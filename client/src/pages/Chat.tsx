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
  const [selectedModel, setSelectedModel] = useState("auto");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const { data: conversations, isLoading: convsLoading } = trpc.chat.getConversations.useQuery({ limit: 30 }, { enabled: isAuthenticated });
  const { data: messages, isLoading: msgsLoading } = trpc.chat.getMessages.useQuery({ conversationId: conversationId ?? 0 }, { enabled: !!conversationId && isAuthenticated });

  const createConvMutation = trpc.chat.createConversation.useMutation({
    onSuccess: (conv) => {
      setConversationId(conv.id);
      utils.chat.getConversations.invalidate();
    },
    onError: () => toast.error("Error al crear la conversación"),
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const handleSendMessage = async () => {
    if (!message.trim() || !conversationId || isSending) return;
    setIsSending(true);
    await sendMessageMutation.mutateAsync({
      conversationId,
      message: message.trim(),
      modelId: selectedModel === "auto" ? undefined : selectedModel,
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

  if (authLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center mx-auto shadow-lg shadow-purple-900/30">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Bienvenido a ShaDowLinG</h1>
            <p className="text-muted-foreground text-sm">Inicia sesión para comenzar a chatear con tu asistente de IA</p>
          </div>
          <Button onClick={() => (window.location.href = getLoginUrl())} className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium">Iniciar sesión</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm px-4 py-3 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-md shadow-purple-900/30">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">ShaDowLinG</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden sm:block">{user?.name ?? user?.email}</span>
          <Button variant="ghost" size="icon" onClick={() => setLocation("/settings")} className="text-muted-foreground hover:text-foreground" title="Configuración"><Settings className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" onClick={logout} className="text-muted-foreground hover:text-foreground" title="Cerrar sesión"><LogOut className="w-4 h-4" /></Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r border-border bg-sidebar flex flex-col shrink-0 hidden sm:flex">
          <div className="p-3 border-b border-border">
            <Button onClick={handleNewConversation} disabled={createConvMutation.isPending} className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium text-sm">
              {createConvMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Nueva conversación
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {convsLoading ? <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div> : conversations?.map((conv) => (
              <div key={conv.id} className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${conversationId === conv.id ? "bg-primary/20 text-foreground border border-primary/30" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`} onClick={() => setConversationId(conv.id)}>
                <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                <span className="text-sm truncate flex-1">{conv.title}</span>
                <button onClick={(e) => { e.stopPropagation(); archiveMutation.mutate({ conversationId: conv.id }); }} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden">
          {conversationId ? (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {msgsLoading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div> : messages?.map((msg) => (
                  <div key={msg.id} className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${msg.role === "user" ? "bg-gradient-to-br from-purple-600 to-blue-600" : "bg-card border border-border"}`}>
                      {msg.role === "user" ? <User className="w-3.5 h-3.5 text-white" /> : <Bot className="w-3.5 h-3.5 text-primary" />}
                    </div>
                    <div className={`max-w-[75%] lg:max-w-[65%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === "user" ? "bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-tr-sm" : "bg-card border border-border text-foreground rounded-tl-sm"}`}>
                      {msg.role === "assistant" ? <div className="prose prose-invert prose-sm max-w-none"><Streamdown>{msg.content}</Streamdown></div> : <p className="whitespace-pre-wrap">{msg.content}</p>}
                      {msg.modelUsed && <p className="text-xs opacity-50 mt-1">{msg.modelUsed}</p>}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-border bg-card/50">
                <div className="max-w-3xl mx-auto space-y-2">
                  <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="text-xs bg-background border rounded px-2 py-1 text-muted-foreground w-fit outline-none focus:ring-1 focus:ring-primary">
                    <option value="auto">✨ Fusión Automática</option>
                    <option value="google/gemini-2.0-flash-exp:free">⚡ Gemini Flash (Gratis)</option>
                    <option value="anthropic/claude-3-sonnet">🧠 Claude 3 Sonnet</option>
                    <option value="meta-llama/llama-3-70b">🛠️ Llama 3 70B</option>
                  </select>
                  <div className="flex gap-2">
                    <Input ref={inputRef} value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={handleKeyDown} placeholder="Escribe a ShaDowLinG..." className="flex-1 bg-background border-border focus-visible:ring-primary" disabled={isSending} />
                    <Button onClick={handleSendMessage} disabled={isSending || !message.trim()} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg shadow-purple-900/20">
                      {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-xl shadow-purple-900/20 mb-2">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-foreground">¿En qué puedo ayudarte hoy?</h2>
              <p className="text-muted-foreground max-w-xs text-sm">Selecciona una conversación o inicia una nueva para comenzar.</p>
              <Button onClick={handleNewConversation} className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20">Nueva conversación</Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
