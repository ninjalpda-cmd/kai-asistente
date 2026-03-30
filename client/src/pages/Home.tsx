// client/src/pages/Home.tsx - ShaDowLinG (Optimizado NEX)
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";

export default function Home() {
  const auth = useAuth();
  const [, setLocation] = useLocation();
  
  // Acceso seguro a propiedades de auth
  const user = auth?.user;
  const isAuthenticated = auth?.isAuthenticated;
  const userName = user?.name || user?.username || "Usuario";

  // LOGO NEX (SVG Minimalista ShaDowLinG)
  const ShaDowLinGLogo = () => (
    <svg width="120" height="120" viewBox="0 0 100 100" className="mx-auto mb-8">
      {/* Círculo de fondo oscuro */}
      <circle cx="50" cy="50" r="48" fill="#000000" stroke="#333" strokeWidth="1"/>
      {/* Símbolo NEX: "S" entrelazada con destello central */}
      <path 
        d="M35,25 Q40,40 50,50 L65,75 Q60,60 50,50 Z" 
        fill="#8B5CF6" 
        stroke="#FFFFFF" 
        strokeWidth="1.5"
      />
      <circle cx="50" cy="50" r="4" fill="#FFFFFF" />
    </svg>
  );

  const handleAction = () => {
    if (isAuthenticated) {
      setLocation("/chat");
    } else {
      window.location.href = getLoginUrl();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white p-4 overflow-hidden">
      {/* Logo y nombre de ShaDoWLinG */}
      <ShaDowLinGLogo />

      <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-indigo-500 mb-2">
        ShaDowLinG OS
      </h1>
      
      {/* Texto Directo NEX - Sin saludos amables */}
      <p className="text-zinc-500 text-lg mb-8 text-center max-w-sm">
        Usuario: <span className="font-mono text-zinc-300">{userName}</span>.<br />
        ADN NEX: Activo (Técnico, Directo, Cínico).
      </p>

      {/* Botón Principal - Acción Directa */}
      <button 
        onClick={handleAction}
        className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-lg px-8 py-4 rounded-full shadow-lg hover:scale-105 transition-transform duration-300 ease-out active:scale-95"
      >
        {isAuthenticated ? "Entrar a Consola (Chat)" : "Iniciar Sesión (NEX)"}
      </button>
      
      <footer className="absolute bottom-8 text-zinc-700 text-xs font-mono">
        v2.0.0-NEX-STABLE
      </footer>
    </div>
  );
}
