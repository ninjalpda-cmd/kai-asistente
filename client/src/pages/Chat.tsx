import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Send,
  Settings,
  Plus,
  MessageSquare,
  Trash2,
  LogOut,
  Bot,
  User,
  Sparkles,
} from "lucide-react";
import { useLocation } from "wouter";
import { Streamdown } from "streamdown";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

export default function Chat() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  // Queries
  const { data: conversations, isLoading: convsLoading } =
    trpc.chat.getConversations.useQuery(
      { limit: 30 },
      { enabled: isAuthenticated }
    );

  const { data: messages, isLoading: msgsLoading } =
    trpc.chat.getMessages.useQuery(
      { conversationId: conversationId ?? 0 },
      { enabled: !!conversationId && isAuthenticated }
    );

  // Mutations
  const createConvMutation = trpc.chat.createConversation.useMutation({
    onSuccess: (conv) => {
      setConversationId(conv.id);
      utils.chat.getConversations.invalidate();
    },
    onError: () => {
      toast.error("Error al crear la conversación");
    },
  });

  const sendMessageMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: () => {
      setMessage("");
      setIsSending(false);
      utils.chat.getMessages.invalidate({ conversationId: conversationId! });
    },
    onError: (err) => {
      setIsSending(false);
      toast.error(`Error: ${err.message}`);
    },
  });

  const archiveMutation = trpc.chat.archiveConversation.useMutation({
    onSuccess: () => {
      if (conversationId) setConversationId(null);
      utils.chat.getConversations.invalidate();
      toast.success("Conversación eliminada");
    },
  });

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const handleSendMessage = async () => {
    if (!message.trim() || !conversationId || isSending) return;
    setIsSending(true);
    await sendMessageMutation.mutateAsync({
      conversationId,
      message: message.trim(),
    });
  };

  const handleNewConversation = async () => {
    await createConvMutation.mutateAsync({ title: "Nueva conversación" });
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Pantalla de carga de autenticación
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Pantalla de login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center mx-auto shadow-lg shadow-purple-900/30">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Bienvenido a Kai
            </h1>
            <p className="text-muted-foreground text-sm">
              Inicia sesión para comenzar a chatear con tu asistente de IA
            </p>
          </div>
          <Button
            onClick={() => (window.location.href = getLoginUrl())}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium"
          >
            Iniciar sesión
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm px-4 py-3 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-md shadow-purple-900/30">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Kai
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden sm:block">
            {user?.name ?? user?.email}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/settings")}
            className="text-muted-foreground hover:text-foreground"
            title="Configuración"
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="text-muted-foreground hover:text-foreground"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar de conversaciones */}
        <aside className="w-64 border-r border-border bg-sidebar flex flex-col shrink-0 hidden sm:flex">
          <div className="p-3 border-b border-border">
            <Button
              onClick={handleNewConversation}
              disabled={createConvMutation.isPending}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium text-sm"
            >
              {createConvMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Nueva conversación
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {convsLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : conversations && conversations.length > 0 ? (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                    conversationId === conv.id
                      ? "bg-primary/20 text-foreground border border-primary/30"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                  onClick={() => setConversationId(conv.id)}
                >
                  <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-sm truncate flex-1">{conv.title}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      archiveMutation.mutate({ conversationId: conv.id });
                    }}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4 px-2">
                No hay conversaciones aún
              </p>
            )}
          </div>
        </aside>

        {/* Área de chat principal */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {conversationId ? (
            <>
              {/* Lista de mensajes */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {msgsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : messages && messages.length > 0 ? (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-3 ${
                        msg.role === "user" ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      {/* Avatar */}
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          msg.role === "user"
                            ? "bg-gradient-to-br from-purple-600 to-blue-600"
                            : "bg-card border border-border"
                        }`}
                      >
                        {msg.role === "user" ? (
                          <User className="w-3.5 h-3.5 text-white" />
                        ) : (
                          <Bot className="w-3.5 h-3.5 text-primary" />
                        )}
                      </div>

                      {/* Burbuja de mensaje */}
                      <div
                        className={`max-w-[75%] lg:max-w-[65%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-tr-sm"
                            : "bg-card border border-border text-foreground rounded-tl-sm"
                        }`}
                      >
                        {msg.role === "assistant" ? (
                          <div className="prose prose-invert prose-sm max-w-none">
                            <Streamdown>{msg.content}</Streamdown>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        )}
                        {msg.modelUsed && (
                          <p className="text-xs opacity-50 mt-1">
                            {msg.modelUsed}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground text-sm">
                      Envía un mensaje para comenzar
                    </p>
                  </div>
                )}

                {/* Indicador de escritura */}
                {isSending && (
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-card border border-border flex items-center justify-center shrink-0">
                      <Bot className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="bg-card border border-border px-4 py-3 rounded-2xl rounded-tl-sm">
                      <div className="flex gap-1 items-center h-4">
                        <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0ms]" />
                        <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:150ms]" />
                        <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input de mensaje */}
              <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
                {/* Botón nueva conv en móvil */}
                <div className="sm:hidden mb-2">
                  <Button
                    onClick={handleNewConversation}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    disabled={createConvMutation.isPending}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Nueva conversación
                  </Button>
                </div>
                <div className="flex gap-2 items-end">
                  <Input
                    ref={inputRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribe tu mensaje... (Enter para enviar)"
                    className="flex-1 bg-input border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/50 resize-none"
                    disabled={isSending}
                    autoFocus
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isSending || !message.trim()}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shrink-0"
                    size="icon"
                  >
                    {isSending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            /* Estado vacío: sin conversación seleccionada */
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center space-y-6 max-w-sm">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/20 flex items-center justify-center mx-auto">
                  <Sparkles className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    ¡Hola, {user?.name?.split(" ")[0] ?? "usuario"}!
                  </h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Soy Kai, tu asistente de IA. Puedo ayudarte con preguntas,
                    redacción, análisis y mucho más.
                  </p>
                </div>
                <Button
                  onClick={handleNewConversation}
                  disabled={createConvMutation.isPending}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium px-8"
                >
                  {createConvMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Comenzar conversación
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
