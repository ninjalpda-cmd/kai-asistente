import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock de base de datos y servicios
vi.mock("./chat.service", () => ({
  createConversation: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    title: "Test conversación",
    archivedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  getUserConversations: vi.fn().mockResolvedValue([
    {
      id: 1,
      userId: 1,
      title: "Test conversación",
      archivedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  getConversation: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    title: "Test conversación",
    archivedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  archiveConversation: vi.fn().mockResolvedValue(undefined),
  getConversationMessages: vi.fn().mockResolvedValue([
    {
      id: 1,
      conversationId: 1,
      role: "user",
      content: "Hola",
      modelUsed: null,
      tokens: 0,
      createdAt: new Date(),
    },
  ]),
  addMessage: vi.fn().mockResolvedValue({
    id: 2,
    conversationId: 1,
    role: "assistant",
    content: "¡Hola! ¿En qué puedo ayudarte?",
    modelUsed: "Llama 3 8B (Gratis)",
    tokens: 15,
    createdAt: new Date(),
  }),
  buildSystemPrompt: vi.fn().mockResolvedValue("Eres ShaDoWLinG, un asistente de IA."),
  getOrCreateUserPreferences: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    tone: "friendly",
    humanizationLevel: 3,
    writingSpeed: 3,
    useEmojis: 1,
    useColloquialisms: 1,
    enableProactiveMessages: 0,
    enableNotifications: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  updateUserPreferences: vi.fn().mockResolvedValue(undefined),
  getUserMemory: vi.fn().mockResolvedValue([]),
  storeMemory: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    category: "fact",
    content: "Le gusta el café",
    importance: 2,
    hitCount: 0,
    expiresAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
}));

vi.mock("./openrouter", () => ({
  createOpenRouterClient: vi.fn().mockReturnValue({
    chatWithFallback: vi.fn().mockResolvedValue({
      content: "¡Hola! ¿En qué puedo ayudarte?",
      modelUsed: "Llama 3 8B (Gratis)",
      tokensUsed: 15,
    }),
  }),
  TaskType: {
    CONVERSATIONAL: "conversational",
    TECHNICAL: "technical",
    CREATIVE: "creative",
    ANALYTICAL: "analytical",
    GENERAL: "general",
  },
  ModelSelector: {
    getAllModels: vi.fn().mockReturnValue([
      {
        id: "meta-llama/llama-3-8b-instruct:free",
        name: "Llama 3 8B (Gratis)",
        provider: "Meta",
        taskType: "conversational",
        isFree: true,
        costPer1kTokens: 0,
      },
    ]),
  },
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("chat.router", () => {
  let ctx: TrpcContext;
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    ctx = createAuthContext();
    caller = appRouter.createCaller(ctx);
  });

  describe("createConversation", () => {
    it("crea una conversación y devuelve el objeto creado", async () => {
      const result = await caller.chat.createConversation({
        title: "Test conversación",
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.title).toBe("Test conversación");
      expect(result.userId).toBe(1);
    });
  });

  describe("getConversations", () => {
    it("devuelve la lista de conversaciones del usuario", async () => {
      const result = await caller.chat.getConversations({ limit: 20 });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.userId).toBe(1);
    });
  });

  describe("getMessages", () => {
    it("devuelve los mensajes de una conversación autorizada", async () => {
      const result = await caller.chat.getMessages({ conversationId: 1 });

      expect(Array.isArray(result)).toBe(true);
      expect(result[0]?.role).toBe("user");
      expect(result[0]?.content).toBe("Hola");
    });
  });

  describe("sendMessage", () => {
    it("envía un mensaje y devuelve la respuesta del asistente", async () => {
      const result = await caller.chat.sendMessage({
        conversationId: 1,
        message: "Hola ShaDoWLinG",
        taskType: "conversational",
      });

      expect(result).toBeDefined();
      expect(result.message.role).toBe("assistant");
      expect(result.message.content).toBe("¡Hola! ¿En qué puedo ayudarte?");
      expect(result.modelUsed).toBe("Llama 3 8B (Gratis)");
    });
  });

  describe("getPreferences", () => {
    it("devuelve las preferencias del usuario", async () => {
      const result = await caller.chat.getPreferences();

      expect(result).toBeDefined();
      expect(result.tone).toBe("friendly");
      expect(result.humanizationLevel).toBe(3);
    });
  });

  describe("updatePreferences", () => {
    it("actualiza las preferencias y devuelve el objeto actualizado", async () => {
      const result = await caller.chat.updatePreferences({
        tone: "professional",
        humanizationLevel: 4,
        useEmojis: false,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
    });
  });

  describe("getMemory", () => {
    it("devuelve la memoria del usuario", async () => {
      const result = await caller.chat.getMemory({ limit: 20 });

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("storeMemory", () => {
    it("almacena un hecho en la memoria del usuario", async () => {
      const result = await caller.chat.storeMemory({
        category: "fact",
        content: "Le gusta el café",
        importance: 2,
      });

      expect(result).toBeDefined();
      expect(result.category).toBe("fact");
      expect(result.content).toBe("Le gusta el café");
    });
  });

  describe("getAvailableModels", () => {
    it("devuelve la lista de modelos disponibles", async () => {
      const result = await caller.chat.getAvailableModels();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("isFree");
    });
  });

  describe("archiveConversation", () => {
    it("archiva una conversación del usuario y devuelve success", async () => {
      const result = await caller.chat.archiveConversation({
        conversationId: 1,
      });

      expect(result).toEqual({ success: true });
    });
  });
});
