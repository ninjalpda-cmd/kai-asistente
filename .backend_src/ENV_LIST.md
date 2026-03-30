# Variables de Entorno - ShaDowLinG OS

Para desplegar ShaDowLinG en un hosting externo (Vercel, Railway, VPS), asegúrate de configurar las siguientes variables:

| Variable | Descripción | Ejemplo / Valor |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Key directa de Google AI Studio | `AIzaSy...` |
| `OPENROUTER_API_KEY` | Key de OpenRouter para modelos fallback | `sk-or-v1-...` |
| `DATABASE_URL` | URL de conexión a MySQL/TiDB | `mysql://user:pass@host:port/db` |
| `JWT_SECRET` | Secreto para cookies y sesiones | `un_secreto_aleatorio_largo` |
| `VITE_APP_NAME` | Nombre de la aplicación (Frontend) | `ShaDowLinG` |
| `NEXT_PUBLIC_APP_NAME` | Nombre de la aplicación (Compatibilidad) | `ShaDowLinG` |
| `NODE_ENV` | Entorno de ejecución | `production` |
| `PORT` | Puerto del servidor | `3000` |

> **Nota:** La `GEMINI_API_KEY` proporcionada (`AIzaSyBai6RZ74hyxoZPHI3ihjKB160N5A6ttvE`) ya está integrada en el código del servidor como valor por defecto en `server/_core/env.ts`, pero se recomienda definirla como variable de entorno real por seguridad.
