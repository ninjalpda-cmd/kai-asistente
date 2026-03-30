# Kai - Asistente de IA: TODO

## Base de Datos
- [x] Actualizar drizzle/schema.ts con tablas: conversations, messages, memoryStore, userPreferences
- [x] Ejecutar migración SQL para crear las tablas

## Servidor
- [x] Crear server/chat.service.ts con funciones de BD para conversaciones, mensajes y memoria
- [x] Crear server/openrouter.ts con integración LLM, selector dinámico de modelos y fallback
- [x] Crear server/chat.router.ts con procedimientos tRPC (createConversation, getConversations, getMessages, sendMessage, getPreferences, updatePreferences, getMemory, storeMemory, getAvailableModels)
- [x] Actualizar server/routers.ts para registrar chatRouter

## Cliente
- [x] Actualizar client/src/index.css con tema oscuro profesional (slate-950/900, gradientes púrpura-azul)
- [x] Actualizar client/src/App.tsx con rutas /chat y /settings
- [x] Actualizar client/src/pages/Home.tsx con landing page en español y tema oscuro
- [x] Crear client/src/pages/Chat.tsx con interfaz de chat completa (sidebar, mensajes, input, markdown)
- [x] Crear client/src/pages/Settings.tsx con panel de configuración de personalidad

## Testing
- [x] Crear server/chat.router.test.ts con tests de los procedimientos principales

## Checkpoint
- [x] Guardar checkpoint final
