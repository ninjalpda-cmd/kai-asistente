import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2, Bot, MessageSquare, Brain, Zap, Shield, ArrowRight, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";

const FEATURES = [
  {
    icon: Brain,
    title: "Memoria persistente",
    desc: "Kai recuerda tus preferencias y contexto entre conversaciones para darte respuestas cada vez más personalizadas.",
  },
  {
    icon: Zap,
    title: "Selección dinámica de modelos",
    desc: "Elige automáticamente el mejor modelo de IA según el tipo de tarea: conversacional, técnico, creativo o analítico.",
  },
  {
    icon: MessageSquare,
    title: "Chat en tiempo real",
    desc: "Interfaz fluida con historial de conversaciones, renderizado de markdown y respuestas instantáneas.",
  },
  {
    icon: Shield,
    title: "Personalización total",
    desc: "Ajusta el tono, nivel de humanización, velocidad de escritura y estilo de respuesta a tu gusto.",
  },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="border-b border-border bg-card/40 backdrop-blur-sm px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-md shadow-purple-900/30">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Kai
          </span>
        </div>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-muted-foreground hidden sm:block">
                {user?.name ?? user?.email}
              </span>
              <Button
                onClick={() => setLocation("/chat")}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-sm font-medium"
              >
                Abrir chat
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </>
          ) : (
            <Button
              onClick={() => (window.location.href = getLoginUrl())}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-sm font-medium"
            >
              Iniciar sesión
            </Button>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="px-4 py-20 text-center relative overflow-hidden">
        {/* Glow de fondo */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-purple-600/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-blue-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-3xl mx-auto space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center mx-auto shadow-2xl shadow-purple-900/40">
            <Bot className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
            Tu asistente de IA{" "}
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              inteligente
            </span>{" "}
            en español
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Kai aprende de ti, recuerda tus preferencias y se adapta a tu estilo.
            Conversaciones más naturales, respuestas más precisas.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            {isAuthenticated ? (
              <Button
                onClick={() => setLocation("/chat")}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-8 py-6 text-base"
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                Ir al chat
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => (window.location.href = getLoginUrl())}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-8 py-6 text-base"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Comenzar gratis
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => (window.location.href = getLoginUrl())}
                  className="border-border text-foreground hover:bg-accent px-8 py-6 text-base"
                >
                  Iniciar sesión
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-16 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-center text-foreground mb-2">
          Todo lo que necesitas en un asistente
        </h2>
        <p className="text-center text-muted-foreground mb-10">
          Diseñado para ser útil, adaptable y completamente en español
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-card border border-border rounded-2xl p-6 space-y-3 hover:border-primary/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="px-4 py-16 text-center">
        <div className="max-w-xl mx-auto bg-card border border-border rounded-2xl p-8 space-y-4">
          <Sparkles className="w-8 h-8 text-primary mx-auto" />
          <h2 className="text-xl font-bold text-foreground">
            Listo para comenzar
          </h2>
          <p className="text-muted-foreground text-sm">
            Inicia sesión y comienza a chatear con Kai en segundos
          </p>
          <Button
            onClick={
              isAuthenticated
                ? () => setLocation("/chat")
                : () => (window.location.href = getLoginUrl())
            }
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium px-8"
          >
            {isAuthenticated ? "Ir al chat" : "Comenzar ahora"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-6 text-center">
        <p className="text-xs text-muted-foreground">
          © 2026 Kai — Asistente de IA inteligente en español
        </p>
      </footer>
    </div>
  );
}
