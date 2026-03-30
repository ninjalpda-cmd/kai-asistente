import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Bot,
  Loader2,
  Save,
  Sliders,
  Bell,
  MessageSquare,
  Smile,
  Zap,
  Brain,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

const TONE_OPTIONS = [
  { value: "friendly", label: "Amigable", desc: "Cálido y conversacional" },
  { value: "casual", label: "Casual", desc: "Relajado e informal" },
  { value: "professional", label: "Profesional", desc: "Claro y directo" },
  { value: "formal", label: "Formal", desc: "Correcto y estructurado" },
  { value: "playful", label: "Lúdico", desc: "Humorístico y creativo" },
] as const;

type ToneValue = (typeof TONE_OPTIONS)[number]["value"];

function SliderInput({
  label,
  value,
  onChange,
  min = 1,
  max = 5,
  leftLabel,
  rightLabel,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  leftLabel?: string;
  rightLabel?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Label className="text-sm font-medium text-foreground">{label}</Label>
        <span className="text-sm font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
          {value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer accent-purple-500"
        style={{
          background: `linear-gradient(to right, oklch(0.65 0.22 290) 0%, oklch(0.6 0.2 240) ${
            ((value - min) / (max - min)) * 100
          }%, oklch(0.22 0.025 264) ${
            ((value - min) / (max - min)) * 100
          }%, oklch(0.22 0.025 264) 100%)`,
        }}
      />
      {(leftLabel || rightLabel) && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </div>
      )}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        checked
          ? "bg-gradient-to-r from-purple-600 to-blue-600"
          : "bg-muted"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function Settings() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const { data: prefs, isLoading: prefsLoading } =
    trpc.chat.getPreferences.useQuery(undefined, {
      enabled: isAuthenticated,
    });

  const updateMutation = trpc.chat.updatePreferences.useMutation({
    onSuccess: () => {
      toast.success("Configuración guardada correctamente");
    },
    onError: (err) => {
      toast.error(`Error al guardar: ${err.message}`);
    },
  });

  // Estado local del formulario
  const [tone, setTone] = useState<ToneValue>("friendly");
  const [humanizationLevel, setHumanizationLevel] = useState(3);
  const [writingSpeed, setWritingSpeed] = useState(3);
  const [useEmojis, setUseEmojis] = useState(true);
  const [useColloquialisms, setUseColloquialisms] = useState(true);
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [enableProactiveMessages, setEnableProactiveMessages] = useState(false);

  // Sincronizar con datos del servidor
  useEffect(() => {
    if (prefs) {
      setTone((prefs.tone as ToneValue) ?? "friendly");
      setHumanizationLevel(prefs.humanizationLevel ?? 3);
      setWritingSpeed(prefs.writingSpeed ?? 3);
      setUseEmojis(!!prefs.useEmojis);
      setUseColloquialisms(!!prefs.useColloquialisms);
      setEnableNotifications(!!prefs.enableNotifications);
      setEnableProactiveMessages(!!prefs.enableProactiveMessages);
    }
  }, [prefs]);

  const handleSave = () => {
    updateMutation.mutate({
      tone,
      humanizationLevel,
      writingSpeed,
      useEmojis,
      useColloquialisms,
      enableNotifications,
      enableProactiveMessages,
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Bot className="w-12 h-12 text-primary mx-auto" />
          <p className="text-muted-foreground">
            Debes iniciar sesión para acceder a la configuración
          </p>
          <Button
            onClick={() => (window.location.href = getLoginUrl())}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
          >
            Iniciar sesión
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/chat")}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
            <Sliders className="w-3.5 h-3.5 text-white" />
          </div>
          <h1 className="text-base font-semibold text-foreground">
            Configuración de ShaDoWLinG
          </h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {prefsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Sección: Tono de comunicación */}
            <Card className="bg-card border-border p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">
                  Tono de comunicación
                </h2>
              </div>
              <p className="text-xs text-muted-foreground">
                Elige cómo quieres que ShaDoWLinG se comunique contigo
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TONE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTone(opt.value)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      tone === opt.value
                        ? "border-primary/60 bg-primary/10 text-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-border/80 hover:bg-accent"
                    }`}
                  >
                    <p className="text-sm font-medium">{opt.label}</p>
                    <p className="text-xs opacity-70 mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </Card>

            {/* Sección: Personalización */}
            <Card className="bg-card border-border p-5 space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <Brain className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">
                  Personalización
                </h2>
              </div>

              <SliderInput
                label="Nivel de humanización"
                value={humanizationLevel}
                onChange={setHumanizationLevel}
                leftLabel="Más conciso"
                rightLabel="Más humano"
              />

              <SliderInput
                label="Velocidad de escritura"
                value={writingSpeed}
                onChange={setWritingSpeed}
                leftLabel="Respuestas cortas"
                rightLabel="Respuestas detalladas"
              />
            </Card>

            {/* Sección: Estilo de respuesta */}
            <Card className="bg-card border-border p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Smile className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">
                  Estilo de respuesta
                </h2>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Usar emojis
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ShaDoWLinG usará emojis ocasionalmente en sus respuestas
                    </p>
                  </div>
                  <Toggle checked={useEmojis} onChange={setUseEmojis} />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Lenguaje coloquial
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Expresiones naturales y patrones de habla cotidiana
                    </p>
                  </div>
                  <Toggle
                    checked={useColloquialisms}
                    onChange={setUseColloquialisms}
                  />
                </div>
              </div>
            </Card>

            {/* Sección: Notificaciones */}
            <Card className="bg-card border-border p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Bell className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">
                  Notificaciones
                </h2>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Notificaciones del sistema
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Recibir alertas y actualizaciones de ShaDoWLinG
                    </p>
                  </div>
                  <Toggle
                    checked={enableNotifications}
                    onChange={setEnableNotifications}
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Mensajes proactivos
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ShaDoWLinG puede iniciar conversaciones con recordatorios
                    </p>
                  </div>
                  <Toggle
                    checked={enableProactiveMessages}
                    onChange={setEnableProactiveMessages}
                  />
                </div>
              </div>
            </Card>

            {/* Sección: Modelos disponibles */}
            <ModelsInfo />

            {/* Botón guardar */}
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-5"
            >
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Guardar configuración
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function ModelsInfo() {
  const { data: models, isLoading } = trpc.chat.getAvailableModels.useQuery();

  return (
    <Card className="bg-card border-border p-5 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Zap className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">
          Modelos de IA disponibles
        </h2>
      </div>
      <p className="text-xs text-muted-foreground">
        ShaDoWLinG selecciona automáticamente el mejor modelo según el tipo de tarea
      </p>

      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      ) : (
        <div className="space-y-2">
          {models?.slice(0, 6).map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-background border border-border"
            >
              <div>
                <p className="text-xs font-medium text-foreground">{m.name}</p>
                <p className="text-xs text-muted-foreground">{m.provider}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground capitalize">
                  {m.taskType}
                </span>
                {m.isFree && (
                  <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-1.5 py-0.5 rounded-full font-medium">
                    Gratis
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
