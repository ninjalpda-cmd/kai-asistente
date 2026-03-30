import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc";
import * as chatService from "./chat.service";
import { createOpenRouterClient, TaskType, ModelSelector } from "./openrouter";

export const chatRouter = router({
  createConversation: protectedProcedure
    .input(z.object({ title: z.string().min(1).max(255) }))
    .mutation(async ({ ctx, input }) => {
      return chatService.createConversation(ctx.user.id, input.title);
    }),

  getConversations: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(20) }))
    .query(async ({ ctx, input }) => {
      return chatService.getUserConversations(ctx.user.id, input.limit);
    }),

  archiveConversation: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const conv = await chatService.getConversation(input.conversationId);
      if (!conv || conv.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No autorizado" });
      }
      await chatService.archiveConversation(input.conversationId);
      return { success: true };
    }),

  getMessages: protectedProcedure
    .input(z.object({ conversationId: z.number(), limit: z.number().optional().default(50) }))
    .query(async ({ ctx, input }) => {
      const conv = await chatService.getConversation(input.conversationId);
      if (!conv || conv.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No autorizado" });
      }
      return chatService.getConversationMessages(input.conversationId, input.limit);
    }),

  sendMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        message: z.string().min(1).max(10000),
        modelId: z.string().optional(),
        taskType: z.enum(["conversational", "technical", "creative", "analytical", "general"]).optional().default("conversational"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const conv = await chatService.getConversation(input.conversationId);
      if (!conv || conv.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No autorizado" });
      }

      await chatService.addMessage(input.conversationId, "user", input.message);
      const history = await chatService.getConversationMessages(input.conversationId, 5);
      const systemPrompt = await chatService.buildSystemPrompt(ctx.user.id);

      const llmMessages = [
        { role: "system" as const, content: systemPrompt },
        ...history
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      ];

      const client = createOpenRouterClient();
      let response;
      try {
        response = await client.chatWithFallback(llmMessages, input.taskType as TaskType, input.modelId);
      } catch (llmError) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Error en la IA.", cause: llmError });
      }

      const assistantMessage = await chatService.addMessage(input.conversationId, "assistant", response.content, response.modelUsed, response.tokensUsed);
      return { message: assistantMessage, modelUsed: response.modelUsed, tokensUsed: response.tokensUsed };
    }),

  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    return chatService.getOrCreateUserPreferences(ctx.user.id);
  }),

  updatePreferences: protectedProcedure
    .input(
      z.object({
        tone: z.enum(["formal", "casual", "friendly", "professional", "playful"]).optional(),
        humanizationLevel: z.number().min(1).max(5).optional(),
        writingSpeed: z.number().min(1).max(5).optional(),
        useEmojis: z.boolean().optional(),
        useColloquialisms: z.boolean().optional(),
        enableProactiveMessages: z.boolean().optional(),
        enableNotifications: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updates: Record<string, unknown> = {};
      if (input.tone !== undefined) updates.tone = input.tone;
      if (input.humanizationLevel !== undefined) updates.humanizationLevel = input.humanizationLevel;
      if (input.writingSpeed !== undefined) updates.writingSpeed = input.writingSpeed;
      if (input.useEmojis !== undefined) updates.useEmojis = input.useEmojis ? 1 : 0;
      if (input.useColloquialisms !== undefined) updates.useColloquialisms = input.useColloquialisms ? 1 : 0;
      if (input.enableProactiveMessages !== undefined) updates.enableProactiveMessages = input.enableProactiveMessages ? 1 : 0;
      if (input.enableNotifications !== undefined) updates.enableNotifications = input.enableNotifications ? 1 : 0;
      await chatService.updateUserPreferences(ctx.user.id, updates as any);
      return chatService.getOrCreateUserPreferences(ctx.user.id);
    }),

  getMemory: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(20) }))
    .query(async ({ ctx, input }) => {
      return chatService.getUserMemory(ctx.user.id, input.limit);
    }),

  storeMemory: protectedProcedure
    .input(
      z.object({
        category: z.enum(["preference", "fact", "learning", "task", "reminder"]),
        content: z.string().min(1).max(1000),
        importance: z.number().min(1).max(5).optional().default(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return chatService.storeMemory(ctx.user.id, input.category, input.content, input.importance);
    }),

  getAvailableModels: protectedProcedure.query(async () => {
    return ModelSelector.getAllModels().map((m) => ({
      id: m.id,
      name: m.name,
      provider: m.provider,
      taskType: m.taskType,
      isFree: m.isFree,
      costPer1kTokens: m.costPer1kTokens,
    }));
  }),
});
