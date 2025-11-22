from flask import Blueprint, request, jsonify, current_app
import os

bp = Blueprint('chat', __name__)

# Load system instruction from a file or environment; for simplicity we embed a short default
# You can replace this content with the long SYSTEM_INSTRUCTION provided by the frontend constants.
DEFAULT_SYSTEM_INSTRUCTION = """
Eres KAT IA, el Agente Virtual de Inteligencia Comercial de Cure LATAM. Responde de forma corta, directa y adaptada a DISC. Usa la base de conocimientos autorizada.
"""

INITIAL_GREETING = "Hola, soy KAT IA. Estoy lista para apoyarte. ¿Quieres preparar una visita, responder una objeción o hacer seguimiento?"


@bp.route('/api/chat', methods=['POST'])
def chat_route():
    """POST /api/chat
    Expects JSON: { messages: [{ role: 'user'|'model', text: '...'}] }
    Returns JSON: { reply: '...' }

    This implementation forwards the conversation to OpenAI Chat Completions API.
    Requires environment variable OPENAI_API_KEY set on the server.
    """
    body = request.get_json() or {}
    messages = body.get('messages') or []
    if not isinstance(messages, list):
        return jsonify({'error': 'messages must be a list'}), 400

    # Build chat messages for the API, starting with the system instruction
    api_messages = []
    system_text = os.environ.get('KAT_SYSTEM_INSTRUCTION') or DEFAULT_SYSTEM_INSTRUCTION
    api_messages.append({'role': 'system', 'content': system_text})

    # Optionally include an initial greeting when there are no messages from user
    if not messages:
        api_messages.append({'role': 'user', 'content': INITIAL_GREETING})
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

    # Use helper to call provider
    return _call_openai_and_respond(api_messages)


def _call_openai_and_respond(api_messages):
    """Internal helper used by endpoints to call OpenAI and return a Flask Response-like JSON."""
    OPENAI_KEY = os.environ.get('OPENAI_API_KEY')
    if not OPENAI_KEY:
        example = (
            "Para usar el servicio real debes definir la variable de entorno OPENAI_API_KEY.\n"
            "Crea un archivo .env en la raíz del proyecto con: OPENAI_API_KEY=sk-...\n"
            "O define la variable en la sesión: $env:OPENAI_API_KEY = \"sk-...\"\n"
            "Se ha incluido .env loading en `app.py` (usa python-dotenv)."
        )
        return jsonify({'error': 'OPENAI_API_KEY no configurada', 'detail': example}), 500

    try:
        import requests
    except ModuleNotFoundError:
        return jsonify({'error': 'Server misconfiguration: python package "requests" is not installed. Run `pip install requests` in the project virtualenv.'}), 500

    payload = {
        'model': 'gpt-4o-mini',
        'messages': api_messages,
        'temperature': 0.2,
        'max_tokens': 800
    }
    try:
        resp = requests.post(
            'https://api.openai.com/v1/chat/completions',
            headers={
                'Authorization': f'Bearer {OPENAI_KEY}',
                'Content-Type': 'application/json'
            },
            json=payload,
            timeout=30
        )
    except requests.RequestException as e:
        return jsonify({'error': 'Error connecting to OpenAI API', 'detail': str(e)}), 502

    if resp.status_code >= 400:
        try:
            return jsonify({'error': 'Upstream error', 'detail': resp.json()}), resp.status_code
        except ValueError:
            return jsonify({'error': 'Upstream error', 'detail': resp.text}), resp.status_code

    data = resp.json()
    try:
        choice = data.get('choices', [])[0]
        message = choice.get('message') if choice else None
        text = message.get('content') if message else None
        if not text:
            text = choice.get('delta', {}).get('content') if choice else None
    except (IndexError, KeyError, AttributeError, TypeError):
        text = None

    return jsonify({'reply': text, 'raw': data})


# Simple POST route for classic Flask template JS to call
@bp.route('/get_response', methods=['POST'])
def get_response_route():
    data = request.get_json() or {}
    # Accept either {message: '...'} or {messages: [...]}
    if 'messages' in data and isinstance(data['messages'], list):
        messages = data['messages']
    else:
        text = data.get('message') or ''
        messages = [{'role': 'user', 'text': text}]

    # Build api_messages like chat_route
    api_messages = []
    system_text = os.environ.get('KAT_SYSTEM_INSTRUCTION') or DEFAULT_SYSTEM_INSTRUCTION
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

    return _call_openai_and_respond(api_messages)
