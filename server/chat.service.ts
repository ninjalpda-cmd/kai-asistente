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

// ─── Conversaciones ──────────────────────────────────────────────────────────

export async function createConversation(
  userId: number,
  title: string
): Promise<Conversation> {
  const db = await getDb();
  if (!db) throw new Error("Base de datos no disponible");

  await db.insert(conversations).values({ userId, title });

  const created = await db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.createdAt))
    .limit(1);

  return created[0];
}

export async function getConversation(
  conversationId: number
): Promise<Conversation | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Base de datos no disponible");

  const result = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);

  return result[0];
}

export async function getUserConversations(
  userId: number,
  limit: number = 20
): Promise<Conversation[]> {
  const db = await getDb();
  if (!db) throw new Error("Base de datos no disponible");

  return db
    .select()
    .from(conversations)
    .where(
      and(eq(conversations.userId, userId), isNull(conversations.archivedAt))
    )
    .orderBy(desc(conversations.updatedAt))
    .limit(limit);
}

export async function archiveConversation(
  conversationId: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Base de datos no disponible");

  await db
    .update(conversations)
    .set({ archivedAt: new Date() })
    .where(eq(conversations.id, conversationId));
}

// ─── Mensajes ─────────────────────────────────────────────────────────────────

export async function addMessage(
  conversationId: number,
  role: "user" | "assistant" | "system",
  content: string,
  modelUsed?: string,
  tokens: number = 0
): Promise<Message> {
  const db = await getDb();
  if (!db) throw new Error("Base de datos no disponible");

  await db.insert(messages).values({ conversationId, role, content, modelUsed, tokens });

  // Actualizar updatedAt de la conversación
  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, conversationId));

  const created = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(1);

  return created[0];
}

export async function getConversationMessages(
  conversationId: number,
  limit: number = 50
): Promise<Message[]> {
  const db = await getDb();
  if (!db) throw new Error("Base de datos no disponible");

  return db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt)
    .limit(limit);
}

// ─── Memoria ──────────────────────────────────────────────────────────────────

export async function storeMemory(
  userId: number,
  category: "preference" | "fact" | "learning" | "task" | "reminder",
  content: string,
  importance: number = 1,
  expiresAt?: Date
): Promise<MemoryStore> {
  const db = await getDb();
  if (!db) throw new Error("Base de datos no disponible");

  await db
    .insert(memoryStore)
    .values({ userId, category, content, importance, expiresAt });

  const created = await db
    .select()
    .from(memoryStore)
    .where(eq(memoryStore.userId, userId))
    .orderBy(desc(memoryStore.createdAt))
    .limit(1);

  return created[0];
}

export async function getUserMemory(
  userId: number,
  limit: number = 20
): Promise<MemoryStore[]> {
  const db = await getDb();
  if (!db) throw new Error("Base de datos no disponible");

  return db
    .select()
    .from(memoryStore)
    .where(
      and(eq(memoryStore.userId, userId), isNull(memoryStore.expiresAt))
    )
    .orderBy(desc(memoryStore.importance))
    .limit(limit);
}

// ─── Preferencias ─────────────────────────────────────────────────────────────

export async function getUserPreferences(
  userId: number
): Promise<UserPreferences | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Base de datos no disponible");

  const result = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  return result[0];
}

export async function getOrCreateUserPreferences(
  userId: number
): Promise<UserPreferences> {
  let prefs = await getUserPreferences(userId);

  if (!prefs) {
    const db = await getDb();
    if (!db) throw new Error("Base de datos no disponible");

    await db.insert(userPreferences).values({
      userId,
      tone: "friendly",
      humanizationLevel: 3,
      writingSpeed: 3,
      useEmojis: 1,
      useColloquialisms: 1,
      enableProactiveMessages: 0,
      enableNotifications: 1,
    });

    prefs = await getUserPreferences(userId);
  }

  return prefs!;
}

export async function updateUserPreferences(
  userId: number,
  updates: Partial<Omit<UserPreferences, "id" | "userId" | "createdAt" | "updatedAt">>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Base de datos no disponible");

  await db
    .update(userPreferences)
    .set(updates)
    .where(eq(userPreferences.userId, userId));
}

// ─── System Prompt ────────────────────────────────────────────────────────────

export async function buildSystemPrompt(userId: number): Promise<string> {
  const prefs = await getOrCreateUserPreferences(userId);
  const memory = await getUserMemory(userId, 10);

  const toneMap: Record<string, string> = {
    formal: "Responde de manera formal y profesional. Usa gramática correcta y evita coloquialismos.",
    casual: "Responde de manera casual y relajada. Puedes usar contracciones y lenguaje informal.",
    friendly: "Responde de manera cálida y amigable. Sé conversacional y accesible.",
    professional: "Responde de manera profesional. Sé claro, conciso y directo.",
    playful: "Responde de manera lúdica y con humor. Agrega personalidad e ingenio a tus respuestas.",
  };

  const toneDescription = toneMap[prefs.tone] ?? toneMap.friendly;

  const humanizationNote =
    (prefs.humanizationLevel ?? 3) >= 4
      ? " Usa expresiones naturales, dudas ocasionales y estructura variada de oraciones para sonar más humano."
      : "";

  const emojiNote = prefs.useEmojis
    ? " Usa emojis ocasionalmente para agregar personalidad."
    : "";

  const colloquialNote = prefs.useColloquialisms
    ? " Usa coloquialismos y patrones de habla natural."
    : "";

  let memorySection = "";
  if (memory.length > 0) {
    const memoryLines = memory
      .map((m) => `- [${m.category}] ${m.content}`)
      .join("\n");
    memorySection = `\n\nInformación que recuerdas sobre el usuario:\n${memoryLines}`;
  }

  return `Eres Kai, un asistente de IA avanzado diseñado para ser útil, inofensivo y honesto. Siempre respondes en español. ${toneDescription}${humanizationNote}${emojiNote}${colloquialNote}${memorySection}`;
}
