# Integración con n8n - Guía de Configuración

## Resumen de Cambios

Se ha modificado el sistema de chatbots para que utilice n8n como backend de procesamiento en lugar de Google AI directamente.

## Componentes Modificados

### 1. Backend Flask

#### chatbot_comercial.py
- **Nuevo**: Importación de `requests` para comunicación HTTP
- **Nuevo**: Configuración de URLs de n8n mediante variables de entorno
- **Modificado**: Función `_call_google_and_respond` → `_call_n8n_and_respond`
- **Funcionalidad**: Ahora actúa como proxy hacia n8n

#### chatbot_capacitacion.py  
- **Nuevo**: Importación de `requests` para comunicación HTTP
- **Nuevo**: Configuración de URLs de n8n mediante variables de entorno
- **Modificado**: Función `_call_google_and_respond` → `_call_n8n_and_respond`
- **Funcionalidad**: Ahora actúa como proxy hacia n8n

### 2. Frontend React

#### ChatWidget.tsx
- **Nuevo**: Importación de `@n8n/chat`
- **Nuevo**: Estado `useN8n` para controlar modo de operación
- **Nuevo**: Referencia `n8nChatRef` para manejar widget
- **Modificado**: Lógica de inicialización para crear widget n8n
- **Modificado**: `clearChat()` y `selectChatbot()` para manejar ambos modos
- **Mantenido**: Diseño visual exactamente igual

## Configuración Requerida

### Variables de Entorno

Crear archivo `.env` basado en `.env.example`:

```bash
# Frontend (Next.js)
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_N8N_URL=http://localhost:5678
NEXT_PUBLIC_N8N_COMMERCIAL_WEBHOOK=/webhook/chatbot-comercial
NEXT_PUBLIC_N8N_TRAINING_WEBHOOK=/webhook/chatbot-capacitacion

# Backend (Flask)
N8N_BASE_URL=http://localhost:5678
N8N_COMMERCIAL_WEBHOOK=/webhook/chatbot-comercial
N8N_TRAINING_WEBHOOK=/webhook/chatbot-capacitacion
```

### Configuración n8n

#### Webhooks Requeridos

1. **Chatbot Comercial**
   - URL: `http://localhost:5678/webhook/chatbot-comercial`
   - Método: POST
   - Payload esperado:
     ```json
     {
       "messages": [{"role": "user|assistant|system", "content": "..."}],
       "chat_type": "comercial"
     }
     ```

2. **Chatbot Capacitación**
   - URL: `http://localhost:5678/webhook/chatbot-capacitacion`
   - Método: POST
   - Payload esperado:
     ```json
     {
       "messages": [{"role": "user|assistant|system", "content": "..."}],
       "chat_type": "training"
     }
     ```

#### Respuesta Esperada de n8n

```json
{
  "output": "Respuesta del chatbot...",
  // o
  "reply": "Respuesta del chatbot...",
  // o
  "response": "Respuesta del chatbot..."
}
```

## Flujo de Comunicación

### Modo Actual (con n8n)
```
Frontend → Backend Flask → n8n → IA → n8n → Backend Flask → Frontend
```

### Modo Respaldo (sin n8n)
```
Frontend → Backend Flask → Lógica Local → Frontend
```

## Instalación

### Frontend
```bash
cd app-blog-front
npm install @n8n/chat
```

### Backend
```bash
pip install requests
```

## Pruebas

1. **Iniciar n8n** con los workflows configurados
2. **Iniciar backend Flask** con las variables de entorno
3. **Iniciar frontend** Next.js
4. **Probar ambos chatbots** desde la interfaz

## Características Mantenidas

- ✅ Autenticación de usuarios
- ✅ Selección entre chatbots
- ✅ Diseño visual idéntico
- ✅ Manejo de errores
- ✅ Limpiar conversación
- ✅ Soporte para múltiples usuarios

## Beneficios

- 🔄 **Flexibilidad**: Cambiar lógica de IA sin modificar código
- 📊 **Monitoreo**: n8n proporciona logging y métricas
- 🔧 **Mantenimiento**: Actualizar workflows fácilmente
- 🚀 **Escalabilidad**: n8n maneja concurrencia
- 🔐 **Seguridad**: Backend mantiene control de acceso
