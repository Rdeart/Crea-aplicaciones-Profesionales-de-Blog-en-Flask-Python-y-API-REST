**Instalar e integrar el chatbot KAT IA**

- Requisitos:
  - Python 3.8+ en el virtualenv del proyecto (ya existe `venv` en el repo). 
  - Dependencias: `requests` (server) — instala en el venv.
  - Clave de OpenAI: variable de entorno `OPENAI_API_KEY`.
  - (Opcional) Puedes personalizar la instrucción del sistema con `KAT_SYSTEM_INSTRUCTION`.

Pasos (PowerShell):

```powershell
# Activar venv
& "C:/Users/Analista Audiovisual/Documents/Flask/venv/Scripts/Activate.ps1"

# Instalar requests si no está
pip install requests

# Exportar la API key (reemplaza la clave por tu valor)
$env:OPENAI_API_KEY = "sk-xxxx..."
# Opcional: inyectar la instrucción completa (si la quieres en servidor)
$env:KAT_SYSTEM_INSTRUCTION = Get-Content -Raw .\kat_system_instruction.txt

# Iniciar la app Flask (ejemplo si usas run.py)
python run.py
```

Nota: en esta versión del proyecto he eliminado el "modo demo" y el servidor requiere una clave real de OpenAI para generar respuestas. Para facilitar la configuración puedes copiar `.env.template` a `.env` y poner tu `OPENAI_API_KEY` allí. Si no quieres usar OpenAI, dime y adapto el endpoint para Google GenAI o Hugging Face.

Prueba rápida con curl (desde otra terminal):

```powershell
curl -X POST http://localhost:5000/api/chat -H "Content-Type: application/json" -d '{"messages": [{"role":"user","text":"Hola, necesito preparar una visita"}]}'
```

Frontend:
- Se han añadido `index.tsx` y `App.tsx` (un widget simple) en la raíz. El `index.html` del repo carga `/index.tsx` mediante `type="module"` y `importmap` que dirige `react`/`react-dom` a CDN. Si abres el HTML en un servidor estático (por ejemplo `vite` o `serve`) debería montar el widget y comunicar con `/api/chat`.

Nota:
- El endpoint `/api/chat` utiliza OpenAI Chat Completions. Asegúrate de tener la variable `OPENAI_API_KEY` definida.
- Si prefieres usar Google GenAI, podemos adaptar el endpoint para esa API.
