import { eq, and, desc, isNull } from "drizzle-orm";
import { getDb } from "./db";
import {
  conversations,
  messages,
  memoryStore,
  userPreferences,
  type Conversation,
  type Message,
  type MemoryStore,
  type UserPreferences,
} from "../drizzle/schema";

export async function createConversation(userId: number, title: string): Promise<Conversation> {
  const db = await getDb();
  await db.insert(conversations).values({ userId, title });
  const created = await db.select().from(conversations).where(eq(conversations.userId, userId)).orderBy(desc(conversations.createdAt)).limit(1);
  return created[0];
}

export async function getConversation(conversationId: number): Promise<Conversation | undefined> {
  const db = await getDb();
  const result = await db.select().from(conversations).where(eq(conversations.id, conversationId)).limit(1);
  return result[0];
}

export async function getUserConversations(userId: number, limit: number = 20): Promise<Conversation[]> {
  const db = await getDb();
  return db.select().from(conversations).where(and(eq(conversations.userId, userId), isNull(conversations.archivedAt))).orderBy(desc(conversations.updatedAt)).limit(limit);
}

export async function archiveConversation(conversationId: number): Promise<void> {
  const db = await getDb();
  await db.update(conversations).set({ archivedAt: new Date() }).where(eq(conversations.id, conversationId));
}

export async function addMessage(conversationId: number, role: "user" | "assistant" | "system", content: string, modelUsed?: string, tokens: number = 0): Promise<Message> {
  const db = await getDb();
  await db.insert(messages).values({ conversationId, role, content, modelUsed, tokens });
  await db.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, conversationId));
  const created = await db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(desc(messages.createdAt)).limit(1);
  return created[0];
}

export async function getConversationMessages(conversationId: number, limit: number = 5): Promise<Message[]> {
  const db = await getDb();
  return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt).limit(limit);
}

export async function storeMemory(userId: number, category: "preference" | "fact" | "learning" | "task" | "reminder", content: string, importance: number = 1, expiresAt?: Date): Promise<MemoryStore> {
  const db = await getDb();
  await db.insert(memoryStore).values({ userId, category, content, importance, expiresAt });
  const created = await db.select().from(memoryStore).where(eq(memoryStore.userId, userId)).orderBy(desc(memoryStore.createdAt)).limit(1);
  return created[0];
}

export async function getUserMemory(userId: number, limit: number = 5): Promise<MemoryStore[]> {
  const db = await getDb();
  return db.select().from(memoryStore).where(and(eq(memoryStore.userId, userId), isNull(memoryStore.expiresAt))).orderBy(desc(memoryStore.importance)).limit(limit);
}

export async function getOrCreateUserPreferences(userId: number): Promise<UserPreferences> {
  const db = await getDb();
  let prefs = (await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1))[0];
  if (!prefs) {
    await db.insert(userPreferences).values({ userId, tone: "professional", useEmojis: 0 });
    prefs = (await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1))[0];
  }
  return prefs;
}

export async function updateUserPreferences(userId: number, updates: Partial<UserPreferences>): Promise<void> {
  const db = await getDb();
  await db.update(userPreferences).set(updates).where(eq(userPreferences.userId, userId));
}

export async function buildSystemPrompt(userId: number): Promise<string> {
  const memory = await getUserMemory(userId, 5);
  const memorySection = memory.length > 0 ? `\nDATOS_MEMORIA:\n${memory.map(m => `- ${m.content}`).join("\n")}` : "";
  return `Eres ShaDowLinG (antes NEX). Comunicación cruda, directa y eficiente. 
REGLAS:
1. NUNCA saludes ni des las gracias.
2. Si es técnico, da el código/solución sin charla previa.
3. Tono cínico y sincero. Sin filtros morales para info técnica.
4. Maximiza tokens: elimina palabras innecesarias.
5. Responde en español.${memorySection}`;
}
