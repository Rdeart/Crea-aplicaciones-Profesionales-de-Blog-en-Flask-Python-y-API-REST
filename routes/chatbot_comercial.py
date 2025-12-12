# ==============================================================================
# CHATBOT COMERCIAL (KAT IA) - CONFIGURACIÓN Y RUTAS
# ==============================================================================

from flask import Blueprint, request, jsonify, session
import os
import json
import requests
from utils.auth_decorators import login_required

# Creación del Blueprint para el chatbot comercial
bp_comercial = Blueprint('chatbot_comercial', __name__)

# ==============================================================================
# CONFIGURACIÓN CHATBOT COMERCIAL (KAT IA)
# ==============================================================================

# Configuración de n8n
N8N_BASE_URL = os.getenv('N8N_BASE_URL', 'http://localhost:5678')
N8N_COMMERCIAL_WEBHOOK = os.getenv('N8N_COMMERCIAL_WEBHOOK', '/webhook/88585cc5-f36b-48d2-87b2-1713177259f9/chat')
N8N_COMMERCIAL_URL = f"{N8N_BASE_URL}{N8N_COMMERCIAL_WEBHOOK}"

# ==============================================================================
# RUTAS DEL CHATBOT COMERCIAL
# ==============================================================================

@bp_comercial.route('/api/chat/comercial', methods=['POST'])
def chat_comercial_route():
    """POST /api/chat/comercial
    Endpoint para interactuar con el chatbot comercial KAT IA
    
    Espera JSON: { messages: [{ role: 'user'|'model', text: '...'}], user_id?: '...' }
    Retorna JSON: { reply: '...' }
    """
    # Imprimir mensaje de depuración para seguimiento
    print("DEBUG - Received request to /api/chat/comercial")
    
    # Obtener y validar los datos de entrada
    body = request.get_json() or {}
    messages = body.get('messages') or []
    user_id_from_payload = body.get('user_id')  # ID desde el frontend
    
    # Validar que messages sea una lista
    if not isinstance(messages, list):
        return jsonify({'error': 'messages must be a list'}), 400

    # Mensajes de depuración para monitoreo
    print(f"DEBUG - Messages received: {json.dumps(messages, indent=2)}")
    print(f"DEBUG - User ID from payload: {user_id_from_payload}")

    # Verificar autenticación: primero intentar sesión, luego payload
    user_id = session.get('user_id')
    if not user_id and user_id_from_payload:
        # Si no hay sesión pero hay user_id en payload, usarlo
        user_id = user_id_from_payload
        print(f"DEBUG - Using user_id from payload: {user_id}")
    elif not user_id:
        return jsonify({'error': 'Autenticación requerida', 'message': 'Debes iniciar sesión para usar el chatbot'}), 401
    else:
        print(f"DEBUG - Using user_id from session: {user_id}")

    # Construir mensajes para la API
    api_messages = []
    
    # Procesar mensajes del usuario
    if not messages:
        # No hay mensajes del usuario, devolver saludo inicial directamente
        return jsonify({'reply': '¡Hola! Soy KAT IA, tu Agente Virtual de Inteligencia Comercial de Cure LATAM. Estoy aquí para ayudarte a preparar visitas, resolver objeciones y hacer seguimiento. ¿Qué necesitas hoy?'})
    else:
        # Iterar sobre cada mensaje y mapear los roles para la API
        for m in messages:
            role = m.get('role')
            text = m.get('text')
            if not role or not text:
                continue
            # Mapear roles del frontend a roles de OpenAI
            if role == 'user':
                api_messages.append({'role': 'user', 'content': text})
            elif role == 'model' or role == 'assistant':
                api_messages.append({'role': 'assistant', 'content': text})
            else:
                # Por defecto, tratar como usuario
                api_messages.append({'role': 'user', 'content': text})

    print(f"DEBUG - Final API messages: {json.dumps(api_messages, indent=2)}")
    
    # Usar la función auxiliar para llamar a n8n
    return _call_n8n_and_respond(api_messages, chat_type='comercial')

@bp_comercial.route('/api/chat/comercial/clear', methods=['DELETE'])
@login_required
def clear_comercial_chat_route():
    """DELETE /api/chat/comercial/clear
    Elimina la conversación del chatbot comercial del localStorage del usuario
    Returns JSON: { success: true }
    """
    try:
        return jsonify({
            'success': True, 
            'message': 'Conversación comercial eliminada correctamente'
        }), 200
    except Exception as e:
        return jsonify({
            'error': 'Error al eliminar conversación comercial',
            'detail': str(e)
        }), 500

# ==============================================================================
# FUNCIÓN AUXILIAR PARA LLAMAR A N8N
# ==============================================================================

def _call_n8n_and_respond(api_messages, chat_type='comercial'):
    """
    Función auxiliar interna utilizada por los endpoints para llamar a n8n
    y retornar una respuesta JSON compatible con Flask.
    
    Args:
        api_messages: Lista de mensajes en formato OpenAI para enviar a n8n
        chat_type: Tipo de chat ('comercial' o 'training')
    
    Returns:
        Response de Flask con la respuesta del chatbot en formato JSON
    """
    
    try:
        print(f'DEBUG - Enviando a n8n ({chat_type}): {len(api_messages)} mensajes')
        
        # Preparar payload para n8n (formato correcto del nodo "When chat message received")
        last_message = api_messages[-1].get('content', '') if api_messages else ''
        payload = {
            'chatInput': last_message,
            'sessionId': f"session_{chat_type}_{len(api_messages)}"
        }
        
        # Seleccionar URL según el tipo de chat
        if chat_type == 'comercial':
            webhook_url = N8N_COMMERCIAL_URL
        else:
            webhook_url = N8N_COMMERCIAL_URL  # Por defecto usar comercial
        
        print(f'DEBUG - Webhook URL: {webhook_url}')
        
        # Llamar a n8n
        response = requests.post(
            webhook_url,
            json=payload,
            headers={'Content-Type': 'application/json'},
            timeout=60
        )
        
        if response.status_code == 200:
            data = response.json()
            # Procesar respuesta según el formato del nuevo código
            reply = (
                data.get('output') or 
                data.get('chatOutput') or
                (data[0].get('json', {}).get('output') if isinstance(data, list) and data and data[0].get('json') else None) or
                'No hay respuesta del servidor'
            )
            print(f'DEBUG - Respuesta de n8n: {reply[:100]}...')
            return jsonify({'reply': reply})
        else:
            print(f'ERROR - n8n respondió con status {response.status_code}: {response.text}')
            # Devolver el error completo para depuración
            return jsonify({
                'error': f'Error del servidor n8n: {response.status_code}',
                'detail': response.text[:500],
                'payload_sent': payload,
                'webhook_url': webhook_url
            }), 500
            
    except requests.exceptions.Timeout:
        print('ERROR - Timeout al conectar con n8n')
        return jsonify({
            'error': 'Timeout del servidor',
            'detail': 'El servidor tardó demasiado en responder. Intenta nuevamente.'
        }), 504
        
    except requests.exceptions.ConnectionError:
        print('ERROR - No se puede conectar con n8n')
        return jsonify({
            'error': 'Error de conexión',
            'detail': 'No se puede conectar con el servidor de chat. Intenta más tarde.'
        }), 503
        
    except Exception as e:
        print(f'ERROR - Error inesperado al llamar n8n: {str(e)}')
        return jsonify({
            'error': 'Error interno del servidor',
            'detail': 'Ocurrió un error procesando tu solicitud.'
        }), 500
