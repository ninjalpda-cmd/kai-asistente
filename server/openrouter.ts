import { invokeLLM } from "./_core/llm";

export enum TaskType {
  CONVERSATIONAL = "conversational",
  TECHNICAL = "technical",
  CREATIVE = "creative",
  ANALYTICAL = "analytical",
  GENERAL = "general",
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  taskType: TaskType;
  costPer1kTokens: number;
  maxContextTokens: number;
  isFree: boolean;
  priority: number;
}

const AVAILABLE_MODELS: ModelInfo[] = [
  {
    id: "meta-llama/llama-3-8b-instruct:free",
    name: "Llama 3 8B (Gratis)",
    provider: "Meta",
    taskType: TaskType.CONVERSATIONAL,
    costPer1kTokens: 0,
    maxContextTokens: 8000,
    isFree: true,
    priority: 1,
  },
  {
    id: "mistralai/mistral-7b-instruct:free",
    name: "Mistral 7B (Gratis)",
    provider: "Mistral",
    taskType: TaskType.CONVERSATIONAL,
    costPer1kTokens: 0,
    maxContextTokens: 32000,
    isFree: true,
    priority: 2,
  },
  {
    id: "openai/gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    provider: "OpenAI",
    taskType: TaskType.CONVERSATIONAL,
    costPer1kTokens: 0.0015,
    maxContextTokens: 4096,
    isFree: false,
    priority: 3,
  },
  {
    id: "anthropic/claude-3-haiku",
    name: "Claude 3 Haiku",
    provider: "Anthropic",
    taskType: TaskType.CONVERSATIONAL,
    costPer1kTokens: 0.00025,
    maxContextTokens: 200000,
    isFree: false,
    priority: 4,
  },
  {
    id: "openai/gpt-4-turbo-preview",
    name: "GPT-4 Turbo",
    provider: "OpenAI",
    taskType: TaskType.TECHNICAL,
    costPer1kTokens: 0.01,
    maxContextTokens: 128000,
    isFree: false,
    priority: 1,
  },
  {
    id: "anthropic/claude-3-opus",
    name: "Claude 3 Opus",
    provider: "Anthropic",
    taskType: TaskType.TECHNICAL,
    costPer1kTokens: 0.015,
    maxContextTokens: 200000,
    isFree: false,
    priority: 2,
  },
  {
    id: "openai/gpt-4",
    name: "GPT-4",
    provider: "OpenAI",
    taskType: TaskType.CREATIVE,
    costPer1kTokens: 0.03,
    maxContextTokens: 8192,
    isFree: false,
    priority: 1,
  },
  {
    id: "anthropic/claude-3-sonnet",
    name: "Claude 3 Sonnet",
    provider: "Anthropic",
    taskType: TaskType.CREATIVE,
    costPer1kTokens: 0.003,
    maxContextTokens: 200000,
    isFree: false,
    priority: 2,
  },
  {
    id: "google/gemini-pro",
    name: "Gemini Pro",
    provider: "Google",
    taskType: TaskType.ANALYTICAL,
    costPer1kTokens: 0.0005,
    maxContextTokens: 32000,
    isFree: false,
    priority: 1,
  },
  {
    id: "meta-llama/llama-3-70b-instruct:free",
    name: "Llama 3 70B (Gratis)",
    provider: "Meta",
    taskType: TaskType.GENERAL,
    costPer1kTokens: 0,
    maxContextTokens: 8000,
    isFree: true,
    priority: 1,
  },
];

export class ModelSelector {
  static selectBestModel(
    taskType: TaskType,
    preferFree: boolean = true,
    estimatedTokens: number = 2000
  ): ModelInfo {
    let compatible = AVAILABLE_MODELS.filter(
      (m) => m.taskType === taskType && m.maxContextTokens >= estimatedTokens
    );

    if (compatible.length === 0) {
      compatible = AVAILABLE_MODELS.filter(
        (m) => m.taskType === TaskType.CONVERSATIONAL
      );
    }

    if (preferFree) {
      const freeModels = compatible.filter((m) => m.isFree);
      if (freeModels.length > 0) {
        compatible = freeModels;
      }
    }

    compatible.sort((a, b) => a.priority - b.priority);
    return compatible[0] ?? AVAILABLE_MODELS[0];
  }

  static getFallbackSequence(taskType: TaskType): ModelInfo[] {
    const typed = AVAILABLE_MODELS.filter(
      (m) => m.taskType === taskType
    ).sort((a, b) => a.priority - b.priority);

    if (typed.length === 0) {
      return AVAILABLE_MODELS.filter(
        (m) => m.taskType === TaskType.CONVERSATIONAL
      ).sort((a, b) => a.priority - b.priority);
    }

    return typed;
  }

  static getAllModels(): ModelInfo[] {
    return AVAILABLE_MODELS;
  }
}

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  content: string;
  modelUsed: string;
  tokensUsed: number;
}

export function createOpenRouterClient() {
  return {
    async chatWithFallback(
      msgs: LLMMessage[],
      taskType: TaskType = TaskType.CONVERSATIONAL,
      maxRetries: number = 3
    ): Promise<ChatResponse> {
      const fallbackSequence = ModelSelector.getFallbackSequence(taskType);
      const attempts = Math.min(maxRetries, Math.max(fallbackSequence.length, 1));

      for (let i = 0; i < attempts; i++) {
        const model = fallbackSequence[i] ?? fallbackSequence[0];
        try {
          const response = await invokeLLM({
            messages: msgs as any,
          });

          const content =
            (response as any).choices?.[0]?.message?.content ??
            (response as any).content ??
            "No se generó respuesta";

          const tokensUsed =
            (response as any).usage?.total_tokens ?? 0;

          return {
            content,
            modelUsed: model?.name ?? "ShaDoWLinG LLM",
            tokensUsed,
          };
        } catch (error) {
          console.error(`[OpenRouter] Error con modelo ${model?.name}:`, error);
          if (i === attempts - 1) {
            throw new Error(
              `Todos los modelos de fallback fallaron: ${(error as Error).message}`
            );
          }
        }
      }

      throw new Error("Error inesperado en chatWithFallback");
    },
  };
}
