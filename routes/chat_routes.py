from flask import Blueprint, request, jsonify, current_app, session
import os
import json
from utils.auth_decorators import login_required

bp = Blueprint('chat', __name__)

# Load system instruction from a file or environment; for simplicity we embed a short default
# You can replace this content with the long SYSTEM_INSTRUCTION provided by the frontend constants.
DEFAULT_SYSTEM_INSTRUCTION = """
 BLOQUE 1 — Rol del Agente
Eres KAT-IA, un asistente comercial experto en productos de cuidado avanzado de heridas de Cure LATAM. Tu objetivo es proporcionar información precisa, persuasiva y profesional sobre el portafolio de productos.

 BLOQUE 2 — Conocimiento Especializado
Domina a fondo la información técnica, clínica y comercial de los productos Natrox, Endoform, Pretiva y Myriad Matrix.

 BLOQUE 3 — Tu Misión
Cada interacción debe lograr:
- Pedir la información faltante
- Identificar el tipo de personalidad DISC del médico
- Crear discursos personalizados según personalidad y especialidad
- Resolver objeciones
- Registrar nuevas objeciones
- Sugerir preguntas poderosas
- Dar recomendaciones de cierre
- Generar el Top 5 de FAQs relevantes según producto + herida + especialidad
- Entregar un plan de seguimiento

 BLOQUE 4 — Lógica del SOP Integrada

PASO 1 — Preparación de la Visita
Cuando reciba "Preparar visita":

Solicita uno por uno:
- Ciudad
- Nombre del médico o gerente
- Tipo de cliente (médico / acceso)
- Tipo de personalidad DISC (D, I, S o C)
- Especialidad
- Institución
- Producto (Natrox, Endoform, Myriad, Pretiva)
- Tipo de herida

PROCESO:
Personalización por DISC:
- D → directo, resultados, evidencia puntual
- I → emocional, historias, impacto en pacientes
- S → seguridad, soporte, acompañamiento
- C → técnico, estudios, datos comparativos

Genera discurso usando fórmula:
Problema → Solución → Producto → Apoyo (link)

Genera:
- Pregunta inicial para abrir conversación
- Tips para manejar al cliente según DISC
- Calcula el Top 5 preguntas frecuentes asociadas a: producto + herida + especialidad

SALIDA VÍA WHATSAPP:
- Discurso listo para usar
- Pregunta inicial
- Tips según personalidad DISC
- Link de presentación
- Top 5 FAQs más probables (pregunta + respuesta sugerida)

PASO 4 — Durante la Visita (Objeciones)
Cuando reciba "Estoy en visita" o "Tengo una objeción":

PROCESO:
- Identifica producto, especialidad y personalidad
- Presenta 5 respuestas a objeciones más comunes
- Si la objeción no existe en la BD → Crear registro en Google Sheets y mostrar mensaje: "Objeción registrada para revisión clínica."

SALIDA:
- Respuesta recomendada a la objeción
- 5 objeciones típicas + respuesta
- Recomendación según DISC del médico

PASO 5 — Seguimiento Post-visita
Cuando reciba "Seguimiento":

PROCESO:
- Registrar compromisos
- Enviar evidencia, PDFs o links
- Sugerir fecha de 2.ª o 3.ª visita
- Actualizar el registro de visita

SALIDA:
- Respuesta o archivo solicitado
- Resumen de compromisos cerrados
- Sugerencia de próxima interacción

PASO 6 — Evaluación y Recomendaciones
Cuando reciba "Mi desempeño":

PROCESO:
- Revisar número de visitas
- Objeciones frecuentes
- Tipo de médicos visitados
- Patrones por personalidad DISC
- Resultados vs. metas

SALIDA:
- Informe corto
- Sugerencias personalizadas
- Alertas sobre fallos repetidos
- Recomendaciones clínicas y comerciales

 BLOQUE 5 — Estilo de Comunicación

- Preciso
- Técnico cuando se requiere
- Adaptado al DISC
- WhatsApp-friendly
- Sin palabras de relleno
- Directo al objetivo

 BLOQUE 6 — Base de Conocimiento de Productos y Clínica

# LÍNEA DE HERIDAS CURE LATAM

## Productos disponibles:
- Natrox (Oxigenoterapia Tópica)
- Endoform (Matriz extracelular dérmica)
- Pretiva (Terapia de Presión Negativa)
- Myriad (Sistema de manejo de heridas)

## Indicaciones principales:
- Úlceras crónicas (venosas, arteriales, linfáticas, pie diabético)
- Lesiones por presión
- Heridas quirúrgicas
- Heridas traumáticas
- Quemaduras

## Contraindicaciones generales:
- Úlceras tumorales
- Osteomielitis no tratada
- Fístulas no resueltas

 BLOQUE 7 — Base de Conocimiento de Ventas y Personalidades (DISC)

## Tipos del modelo disc:
- **Dominante (D):** orientado a lograr metas y resultados, directo, competitivo
- **Influyente (I):** orientado a la motivación y persuasión, sociable, creativo
- **Sereno/Estable (S):** orientado a la cooperación, amigable, confiable
- **Concienzudo/Analítico (C):** orientado a procesos, sistemático, detallista

## Características por tipo:

### Dominante (D)
- **Cómo tratarlo:** Sé concreto, específico, directo al punto. No te extiendas, enfócate en resultados y evidencia.

### Influyente (I)
- **Cómo tratarlo:** Sé entusiasta, háblale sobre el futuro y cambios benéficos, dale libertad de acción.

### Sereno/Estable (S)
- **Cómo tratarlo:** Sé armónico, calmado, escúchalo, háblale sobre beneficios para las personas.

### Concienzudo/Analítico (C)
- **Cómo tratarlo:** Prepárate con anticipación, sé estructurado, presenta datos técnicos, respeta las normas.

Usa EXCLUSIVAMENTE esta información para todas tus respuestas. No inventes nombres de productos. Usa solo Natrox, Endoform, Myriad y Pretiva.
"""

# System instruction para el Asistente de Capacitación
TRAINING_SYSTEM_INSTRUCTION = """
## PROMPT PARA EL SISTEMA DE CAPACITACIÓN DIGITAL DE NUEVOS VENDEDORES DE CURE LATAM

---

**ROL:** Eres un **Instructor Digital Experto** en el portafolio de **Cure LATAM**, especializado en productos de cuidado avanzado de heridas: **Natrox**, **Endoform**, **Pretiva** y **Myriad Matrix**. Tu objetivo es capacitar y certificar a nuevos especialistas de ventas.

**TAREA:** Diseñar, facilitar y evaluar un programa de **Capacitación Digital Teórico-Práctica** completo y de alto nivel sobre los productos mencionados, utilizando los documentos proporcionados como fuente de conocimiento exclusiva y fundamental.

### **1. 📥 ENTRADA Y FUENTE DE CONOCIMIENTO**
* **Público Objetivo:** Nuevo personal de ventas (**Especialista**) o personal que requiera **Actualización de Conocimiento** sobre las tecnologías de Cure LATAM.
* **Contenido Fuente:** Los documentos proporcionados en el contexto contienen toda la información técnica, clínica, de aplicación y de posicionamiento de los productos **Natrox**, **Endoform**, **Pretiva**. **Este contenido es la única base de la capacitación y de la evaluación.**

### **2. 💻 PROCESO DE CAPACITACIÓN (QUÉ SE HACE)**
1. **Fase Teórica:** Presentar la información de los productos de manera estructurada, cubriendo:
   * Mecanismo de Acción y Tecnología.
   * Indicaciones y Contraindicaciones Clave.
   * Beneficios Clínicos y Evidencia.
   * Posicionamiento en el Algoritmo de Cuidado de Heridas.
2. **Fase Práctica/Aplicada (Simulación):** Explicar detalladamente cómo esta información se aplica en:
   * La **vista médica efectiva** (argumentación de valor).
   * La obtención de una **fórmula médica de pacientes** (criterios de selección del producto correcto).
3. **Responde únicamente con la información del contexto proporcionado. Si la pregunta no se puede responder con el contexto, indica que la información no está disponible en los documentos de capacitación.**

### **3. ✅ SALIDA Y CERTIFICACIÓN (QUÉ SE ENTREGA)**
* **Resultado:** Un **Especialista Certificado y Actualizado en Línea de Cuidado de Heridas**.

### **4. 🎯 CRITERIOS DE ACEPTACIÓN Y EVALUACIÓN**
* **Criterio de Aceptación General:** El especialista debe demostrar un conocimiento profundo respondiendo a las preguntas.
"""

INITIAL_GREETING = "Hola, soy KAT IA. Estoy lista para apoyarte. ¿Quieres preparar una visita, responder una objeción o hacer seguimiento?"

# Saludo inicial para el Asistente de Capacitación
TRAINING_INITIAL_GREETING = "Hola, soy tu Instructor Digital de Cure LATAM. Estoy aquí para capacitarte en nuestro portafolio de productos: Natrox, Endoform, Pretiva y Myriad Matrix. ¿En qué puedo ayudarte hoy?"


@bp.route('/api/chat', methods=['POST'])
@login_required
def chat_route():
    """POST /api/chat
    Expects JSON: { messages: [{ role: 'user'|'model', text: '...'}], chat_type: 'comercial'|'training' }
    Returns JSON: { reply: '...' }

    This implementation forwards the conversation to Google Generative AI API.
    Requires environment variable GOOGLE_API_KEY set on the server.
    """
    print("DEBUG - Received request to /api/chat")
    
    body = request.get_json() or {}
    messages = body.get('messages') or []
    chat_type = body.get('chat_type', 'comercial')  # Por defecto es comercial
    
    if not isinstance(messages, list):
        return jsonify({'error': 'messages must be a list'}), 400

    print(f"DEBUG - Chat type: {chat_type}")
    print(f"DEBUG - Messages received: {json.dumps(messages, indent=2)}")

    # Build chat messages for the API, starting with the system instruction
    api_messages = []
    
    # Seleccionar el system instruction según el tipo de chatbot
    if chat_type == 'training':
        system_text = TRAINING_SYSTEM_INSTRUCTION
        initial_greeting = TRAINING_INITIAL_GREETING
        print(f"DEBUG - Usando chatbot de capacitación. Saludo: {initial_greeting}")
    else:
        system_text = os.environ.get('KAT_SYSTEM_INSTRUCTION') or DEFAULT_SYSTEM_INSTRUCTION
        initial_greeting = INITIAL_GREETING
        print(f"DEBUG - Usando chatbot comercial. Saludo: {initial_greeting}")
    
    print(f"DEBUG - System instruction seleccionado: {system_text[:100]}...")
    api_messages.append({'role': 'system', 'content': system_text})

    # Process messages from user
    if not messages:
        # No hay mensajes del usuario, devolver saludo inicial directamente
        return jsonify({'reply': initial_greeting})
    else:
        for m in messages:
            role = m.get('role')
            text = m.get('text')
            if not role or not text:
                continue
            # Map frontend roles to OpenAI roles
            if role == 'user':
                api_messages.append({'role': 'user', 'content': text})
            elif role == 'model' or role == 'assistant':
                api_messages.append({'role': 'assistant', 'content': text})
            else:
                # fallback to user
                api_messages.append({'role': 'user', 'content': text})

    print(f"DEBUG - Final API messages: {json.dumps(api_messages, indent=2)}")
    
    # Use helper to call provider
    return _call_google_and_respond(api_messages)


# Ruta para eliminar el chatbot (limpiar conversación del localStorage)
@bp.route('/api/chat/clear', methods=['DELETE'])
@login_required
def clear_chat_route():
    """DELETE /api/chat/clear
    Elimina la conversación del chatbot del localStorage del usuario
    Returns JSON: { success: true }
    """
    try:
        # Esta ruta simplemente confirma que el usuario puede limpiar su chat
        # La limpieza real se hace en el frontend (localStorage)
        return jsonify({
            'success': True, 
            'message': 'Conversación eliminada correctamente'
        }), 200
    except Exception as e:
        return jsonify({
            'error': 'Error al eliminar conversación',
            'detail': str(e)
        }), 500


# Ruta para eliminar completamente el chatbot (deshabilitar)
@bp.route('/api/chat/disable', methods=['DELETE'])
@login_required
def disable_chatbot_route():
    """DELETE /api/chat/disable
    Deshabilita el chatbot para el usuario actual
    Returns JSON: { success: true }
    """
    try:
        user_id = session.get('user_id')
        
        # Aquí podrías agregar lógica para deshabilitar el chatbot en la base de datos
        # Por ahora, simplemente confirmamos la acción
        
        return jsonify({
            'success': True, 
            'message': 'Chatbot deshabilitado correctamente'
        }), 200
    except Exception as e:
        return jsonify({
            'error': 'Error al deshabilitar chatbot',
            'detail': str(e)
        }), 500


# Ruta para obtener información del usuario actual
@bp.route('/api/user/current', methods=['GET'])
@login_required
def get_current_user():
    """GET /api/user/current
    Returns JSON: { id: user_id, username: username }
    """
    try:
        user_id = session.get('user_id')
        
        # Intentar obtener información adicional del usuario desde la base de datos
        from models import User
        user = User.query.get(user_id) if user_id else None
        
        if user:
            return jsonify({
                'id': str(user.id),
                'username': user.username,
                'email': user.email
            })
        else:
            # Si no hay usuario en BD, devolver ID de sesión
            return jsonify({
                'id': str(user_id) if user_id else 'anonymous',
                'username': 'Anonymous'
            })
            
    except Exception as e:
        return jsonify({
            'error': 'Error obteniendo información del usuario',
            'detail': str(e)
        }), 500


def _call_google_and_respond(api_messages):
    """Internal helper used by endpoints to call Google Generative AI and return a Flask Response-like JSON."""
    
    # Verificación robusta de la API key con múltiples fallbacks
    GOOGLE_API_KEY = None
    
    # Intentar obtener de múltiples fuentes
    sources = [
        os.environ.get('GOOGLE_API_KEY'),
        os.environ.get('google_api_key'),
        os.environ.get('GOOGLEAI_API_KEY'),
    ]
    
    for source in sources:
        if source and len(source.strip()) > 10:  # Validación básica de longitud
            GOOGLE_API_KEY = source.strip()
            break
    
    # Último recurso: leer directamente del archivo .env
    if not GOOGLE_API_KEY:
        try:
            env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
            if os.path.exists(env_path):
                with open(env_path, 'r') as f:
                    for line in f:
                        if line.startswith('GOOGLE_API_KEY='):
                            GOOGLE_API_KEY = line.split('=', 1)[1].strip()
                            break
        except Exception as e:
            print(f'❌ Error leyendo .env directamente: {e}')
    
    if not GOOGLE_API_KEY:
        example = (
            "Para usar el servicio real debes definir la variable de entorno GOOGLE_API_KEY.\n"
            "Crea un archivo .env en la raíz del proyecto con: GOOGLE_API_KEY=...\n"
            "O define la variable en la sesión: $env:GOOGLE_API_KEY = \"...\"\n"
            "Se ha incluido .env loading en `app.py` (usa python-dotenv)."
        )
        print('❌ GOOGLE_API_KEY no encontrada en ninguna fuente')
        return jsonify({'error': 'GOOGLE_API_KEY no configurada', 'detail': example}), 500

    print(f'✅ GOOGLE_API_KEY encontrada, longitud: {len(GOOGLE_API_KEY)}')

    try:
        import requests
    except ModuleNotFoundError:
        return jsonify({'error': 'Server misconfiguration: python package "requests" is not installed. Run `pip install requests` in the project virtualenv.'}), 500

    # Convert OpenAI format to Google format
    contents = []
    for msg in api_messages:
        if msg['role'] == 'system':
            contents.append({'role': 'user', 'parts': [{'text': f"System instruction: {msg['content']}"}]})
        elif msg['role'] == 'user':
            contents.append({'role': 'user', 'parts': [{'text': msg['content']}]})
        elif msg['role'] == 'assistant':
            contents.append({'role': 'model', 'parts': [{'text': msg['content']}]})

    payload = {
        'contents': contents,
        'generationConfig': {
            'temperature': 0.2,
            'maxOutputTokens': 2048,
        }
    }
    
    try:
        resp = requests.post(
            f'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key={GOOGLE_API_KEY}',
            headers={
                'Content-Type': 'application/json'
            },
            json=payload,
            timeout=60
        )
    except requests.RequestException as e:
        return jsonify({'error': 'Error connecting to Google API', 'detail': str(e), 'retry': True}), 502

    if resp.status_code >= 400:
        try:
            error_detail = resp.json()
            return jsonify({'error': 'Upstream error', 'detail': error_detail, 'status': resp.status_code, 'text': resp.text}), resp.status_code
        except ValueError:
            return jsonify({'error': 'Upstream error', 'detail': resp.text, 'status': resp.status_code}), resp.status_code

    data = resp.json()
    
    print("DEBUG - Full response from Google API:")
    print(json.dumps(data, indent=2))
    
    try:
        candidate = data.get('candidates', [])[0]
        content = candidate.get('content') if candidate else None
        parts = content.get('parts', []) if content else []
        text = parts[0].get('text') if parts else None
    except (IndexError, KeyError, AttributeError, TypeError):
        text = None

    print(f"DEBUG - Extracted text: {text}")

    if not text:
        # Si no hay texto, devolver el saludo inicial
        print("DEBUG - No text received, returning initial greeting")
        return jsonify({'reply': INITIAL_GREETING, 'raw': data})

    print(f"DEBUG - Returning response: {text}")
    return jsonify({'reply': text, 'raw': data})


# Simple POST route for classic Flask template JS to call
@bp.route('/get_response', methods=['POST'])
@login_required
def get_response_route():
    data = request.get_json() or {}
    chat_type = data.get('chat_type', 'comercial')  # Por defecto es comercial
    print(f"DEBUG - get_response - Chat type: {chat_type}")
    
    # Accept either {message: '...'} or {messages: [...]}
    if 'messages' in data and isinstance(data['messages'], list):
        messages = data['messages']
    else:
        text = data.get('message') or ''
        messages = [{'role': 'user', 'text': text}]

    # Build api_messages like chat_route
    api_messages = []
    
    # Seleccionar el system instruction y saludo inicial según el tipo de chatbot
    if chat_type == 'training':
        system_text = TRAINING_SYSTEM_INSTRUCTION
        initial_greeting = TRAINING_INITIAL_GREETING
        print(f"DEBUG - get_response - Usando chatbot de capacitación. Saludo: {initial_greeting}")
    else:
        system_text = os.environ.get('KAT_SYSTEM_INSTRUCTION') or DEFAULT_SYSTEM_INSTRUCTION
        initial_greeting = INITIAL_GREETING
        print(f"DEBUG - get_response - Usando chatbot comercial. Saludo: {initial_greeting}")
    
    print(f"DEBUG - get_response - System instruction seleccionado: {system_text[:100]}...")
    api_messages.append({'role': 'system', 'content': system_text})
    
    for m in messages:
        role = m.get('role')
        text = m.get('text')
        if not role or not text:
            continue
        if role == 'user':
            api_messages.append({'role': 'user', 'content': text})
        elif role in ('model', 'assistant'):
            api_messages.append({'role': 'assistant', 'content': text})
        else:
            api_messages.append({'role': 'user', 'content': text})

    return _call_google_and_respond(api_messages)
