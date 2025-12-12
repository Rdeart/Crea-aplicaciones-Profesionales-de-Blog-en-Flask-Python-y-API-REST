# ==============================================================================
# CHATBOT DE CAPACITACIÓN (INSTRUCTOR DIGITAL) - CONFIGURACIÓN Y RUTAS
# ==============================================================================

from flask import Blueprint, request, jsonify, session
import os
import json
import requests
from utils.auth_decorators import login_required

# Creación del Blueprint para el chatbot de capacitación
bp_capacitacion = Blueprint('chatbot_capacitacion', __name__)

# ==============================================================================
# CONFIGURACIÓN CHATBOT DE CAPACITACIÓN (INSTRUCTOR DIGITAL)
# ==============================================================================

# Configuración de n8n
N8N_BASE_URL = os.getenv('N8N_BASE_URL', 'http://localhost:5678')
N8N_TRAINING_WEBHOOK = os.getenv('N8N_TRAINING_WEBHOOK', '/webhook/chatbot-capacitacion')
N8N_TRAINING_URL = f"{N8N_BASE_URL}{N8N_TRAINING_WEBHOOK}"


# ==============================================================================
# RUTAS DEL CHATBOT DE CAPACITACIÓN
# ==============================================================================

@bp_capacitacion.route('/api/chat/capacitacion', methods=['POST'])
def chat_capacitacion_route():
    """POST /api/chat/capacitacion
    Endpoint para interactuar con el chatbot de capacitación (Instructor Digital)
    
    Espera JSON: { messages: [{ role: 'user'|'model', text: '...'}], user_id?: '...' }
    Retorna JSON: { reply: '...' }
    """
    # Imprimir mensaje de depuración para seguimiento
    print("DEBUG - Received request to /api/chat/capacitacion")
    
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

    # Construir mensajes para la API, comenzando con la instrucción del sistema
    api_messages = []
    
    # Agregar la instrucción del sistema como primer mensaje
    api_messages.append({'role': 'system', 'content': TRAINING_SYSTEM_INSTRUCTION})

    # Procesar mensajes del usuario
    if not messages:
        # No hay mensajes del usuario, devolver saludo inicial directamente
        return jsonify({'reply': TRAINING_INITIAL_GREETING})
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
    
    # Llamar a n8n en lugar de procesar localmente
    return _call_n8n_and_respond(api_messages, 'training')

@bp_capacitacion.route('/api/chat/capacitacion/clear', methods=['DELETE'])
@login_required
def clear_capacitacion_chat_route():
    """DELETE /api/chat/capacitacion/clear
    Elimina la conversación del chatbot de capacitación del localStorage del usuario
    Returns JSON: { success: true }
    """
    try:
        return jsonify({
            'success': True, 
            'message': 'Conversación de capacitación eliminada correctamente'
        }), 200
    except Exception as e:
        return jsonify({
            'error': 'Error al eliminar conversación de capacitación',
            'detail': str(e)
        }), 500

# ==============================================================================
# FUNCIÓN AUXILIAR PARA LLAMAR A N8N
# ==============================================================================

def _call_n8n_and_respond(api_messages, chat_type='training'):
    """
    Función auxiliar interna utilizada por los endpoints para llamar a n8n
    y retornar una respuesta JSON compatible con Flask.
    
    Args:
        api_messages: Lista de mensajes en formato OpenAI para enviar a n8n
        chat_type: Tipo de chat ('training' o 'comercial')
    
    Returns:
        Response de Flask con la respuesta del chatbot en formato JSON
    """
    
    try:
        print(f'DEBUG - Enviando a n8n ({chat_type}): {len(api_messages)} mensajes')
        
        # Preparar payload para n8n
        payload = {
            'messages': api_messages,
            'chat_type': chat_type
        }
        
        # Seleccionar URL según el tipo de chat
        if chat_type == 'training':
            webhook_url = N8N_TRAINING_URL
        else:
            webhook_url = N8N_TRAINING_URL  # Por defecto usar capacitación
        
        print(f'DEBUG - Webhook URL: {webhook_url}')
        
        # Llamar a n8n
        response = requests.post(
            webhook_url,
            json=payload,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            reply = data.get('output') or data.get('reply') or data.get('response') or 'No hay respuesta del servidor'
            print(f'DEBUG - Respuesta de n8n: {reply[:100]}...')
            return jsonify({'reply': reply})
        else:
            print(f'ERROR - n8n respondió con status {response.status_code}: {response.text}')
            return jsonify({
                'error': f'Error del servidor n8n: {response.status_code}',
                'detail': response.text[:200]
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
            elif any(word in user_message for word in ['beneficios', 'ventajas']):
                response = "Beneficios Endoform: integración rápida sin inflamación excesiva, alto contenido estructural y bioactivo, compatible con otras tecnologías. ¿Necesitas indicaciones específicas?"
            elif any(word in user_message for word in ['indicaciones', 'cuándo usar']):
                response = "Indicaciones Endoform: úlceras crónicas, heridas quirúrgicas, lesiones traumáticas, dificultad en formación de matriz. ¿Quieres conocer contraindicaciones?"
            elif any(word in user_message for word in ['contraindicaciones']):
                response = "Contraindicaciones Endoform: úlceras tumorales, osteomielitis no tratada, fístulas no solucionadas. ¿Quieres entender por qué?"
            else:
                response = "Sobre Endoform: puedo explicarte qué es, componentes, mecanismo, beneficios, indicaciones o contraindicaciones. ¿Qué necesitas?"
        
        # Pretiva - conversación detallada
        elif any(word in user_message for word in ['pretiva', 'presión negativa', 'vacío', 'tpn']):
            if any(word in user_message for word in ['qué es', 'definición']):
                response = "Pretiva es terapia de presión negativa que usa succión controlada para ayudar a sanar heridas más rápido. Funciona como aspiradora suave que elimina exudado. ¿Quieres saber cómo funciona?"
            elif any(word in user_message for word in ['cómo funciona', 'mecanismo']):
                response = "Pretiva aplica microtensión tisular que estimula formación de vasos sanguíneos y matriz extracelular. Elimina exudado, reduce edema y mantiene humedad ideal. ¿Quieres conocer sus componentes?"
            elif any(word in user_message for word in ['componentes', 'partes']):
                response = "Pretiva incluye: bomba de presión subatmosférica, 2 canisters 60ml, almohadilla con adhesivo siliconado. ¿Necesitas especificaciones de apósitos?"
            elif any(word in user_message for word in ['apósitos', 'tamaños']):
                response = "Apósitos Pretiva: multicapa con película PU, espuma absorbente, silicona atraumática. Tamaños: 17.5x22.5, 17.5x32.5, 12.5x35, 12.5x40 cm. ¿Quieres indicaciones?"
            elif any(word in user_message for word in ['indicaciones', 'cuándo usar']):
                response = "Indicaciones Pretiva: úlceras crónicas, lesiones por presión, heridas quirúrgicas, lesiones traumáticas. Exudado leve-moderado, profundidad <2cm. ¿Quieres contraindicaciones?"
            elif any(word in user_message for word in ['contraindicaciones']):
                response = "Contraindicaciones Pretiva: exposición de órganos/vasos, osteomielitis, fístulas, neoplasias, anticoagulantes, desnutrición severa. ¿Quieres entender por qué?"
            else:
                response = "Sobre Pretiva: puedo explicarte qué es, cómo funciona, componentes, apósitos, indicaciones o contraindicaciones. ¿Qué te interesa?"
        
        # Myriad Matrix
        elif any(word in user_message for word in ['myriad', 'myriad matrix']):
            response = "Myriad Matrix es una tecnología avanzada de regeneración tisular. ¿Quieres conocer su mecanismo de acción, indicaciones, o comparación con otros productos?"
        
        else:
            response = "Estoy capacitándote en nuestro portafolio. ¿Sobre qué producto necesitas información: Natrox, Endoform, Pretiva o Myriad Matrix? Puedo profundizar en cualquier aspecto."
    
    elif context_state == 'certification_prep':
        if any(word in user_message for word in ['examen', 'evaluación', 'test']):
            response = "Para el examen de certificación, necesitas dominar: 1) Características de cada producto, 2) Indicaciones/contraindicaciones, 3) Evidencia científica, 4) Algoritmo de cuidado de heridas. ¿Quieres practicar preguntas específicas?"
        elif any(word in user_message for word in ['preguntas', 'práctica', 'simulación']):
            response = "Iniciando práctica de certificación. Pregunta 1: ¿Cuál es la principal contraindicación de Natrox y por qué? Responde y te daré feedback inmediato."
        elif any(word in user_message for word in ['úlcera', 'tumor', 'osteomielitis']):
            response = "¡Correcto! Úlceras tumorales están contraindicadas porque el oxígeno podría estimular crecimiento de células malignas. Pregunta 2: ¿Qué componentes incluye Endoform?"
        else:
            response = "Para tu certificación, te prepararé en: características técnicas, evidencia científica, algoritmos clínicos y manejo de objeciones. ¿Por dónde quieres empezar?"
    
    elif context_state == 'wound_types':
        if any(word in user_message for word in ['pie diabético', 'diabética']):
            response = "Úlcera pie diabético: causada por daño vascular y neurológico por diabetes. Tratamiento: Natrox (oxigena y mejora respuesta inmune), Endoform (facilita migración celular). ¿Quieres protocolo específico?"
        elif any(word in user_message for word in ['venosa', 'várices']):
            response = "Úlcera venosa: causada por estasis sanguíneo en piernas. Tratamiento: Endoform (regula inflamación), Natrox (mejora circulación). ¿Necesitas guía de tratamiento?"
        elif any(word in user_message for word in ['arterial', 'isquémica']):
            response = "Úlcera arterial: causada por mala circulación arterial. Tratamiento: Natrox (promueve angiogénesis), Endoform (mejora oxigenación). ¿Quieres protocolo?"
        elif any(word in user_message for word in ['linfática', 'edema']):
            response = "Úlcera linfática: causada por acumulación de líquido por fallo linfático. Tratamiento: Endoform (reduce edema), Natrox (mejora respuesta inmune). ¿Necesitas más detalles?"
        else:
            response = "Para tipos de heridas: puedo explicarte tratamiento específico para úlcera diabética, venosa, arterial, linfática o por presión. ¿Cuál te interesa?"
    
    # Análisis de intenciones directas
    elif any(word in user_message for word in ['certificar', 'certificación', 'evaluar']):
        response = "Iniciando preparación para certificación. Evaluaré: conocimientos técnicos, evidencia científica, protocolos clínicos. ¿Quieres empezar con evaluación diagnóstica o ir directo a temas específicos?"
    
    elif any(word in user_message for word in ['comparar', 'diferencias', 'versus']):
        response = "Para comparar productos: Natrox (oxigenoterapia) vs Pretiva (presión negativa) vs Endoform (matriz). ¿Qué productos específicos quieres comparar y en qué aspecto?"
    
    elif any(word in user_message for word in ['protocolo', 'guía', 'algoritmo']):
        response = "Te puedo proporcionar protocolos de tratamiento específicos por tipo de herida y producto. ¿Para qué tipo de herida necesitas el protocolo?"
