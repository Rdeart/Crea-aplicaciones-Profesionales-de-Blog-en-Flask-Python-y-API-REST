from flask import Blueprint, request, jsonify
from models import db
import datetime
import secrets
import logging

bp = Blueprint('password_reset', __name__)

@bp.route('/test', methods=['GET'])
def test():
    return jsonify({'message': 'Password reset blueprint working'}), 200

@bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """
    Envía un token de recuperación de contraseña al email corporativo
    """
    try:
        logging.info('Endpoint forgot-password llamado')
        
        data = request.get_json()
        logging.info(f'Datos recibidos: {data}')
        
        if not data:
            logging.error('No se recibieron datos')
            return jsonify({'error': 'No se recibieron datos'}), 400
            
        email = data.get('email', '').lower()
        logging.info(f'Email procesado: {email}')
        
        if not email:
            logging.error('Email es requerido')
            return jsonify({'error': 'Email es requerido'}), 400
        
        logging.info(f'Intento de recuperación para email: {email}')
        
        # Importar User aquí para evitar problemas de importación circular
        from models.user import User
        
        # Buscar usuario por email
        user = User.query.filter_by(email=email).first()
        logging.info(f'Usuario encontrado: {user is not None}')
        
        if not user:
            # Por seguridad, no revelamos si el email existe o no
            logging.warning(f'Email no encontrado: {email}')
            return jsonify({'message': 'Si el email está registrado, recibirás instrucciones para recuperar tu contraseña'}), 200
        
        # Generar token de recuperación (válido por 1 hora)
        reset_token = secrets.token_urlsafe(32)
        logging.info(f'Token generado: {reset_token[:10]}...')
        
        user.reset_token = reset_token
        user.reset_token_expires = datetime.datetime.utcnow() + datetime.timedelta(hours=1)
        db.session.commit()
        
        logging.info(f'Token guardado para usuario {user.id}')
        
        # Enviar email con el token
        from services.email_service import send_password_reset_email
        email_sent = send_password_reset_email(email, reset_token)
        
        if email_sent:
            return jsonify({
                'message': 'Se ha enviado un correo con instrucciones para recuperar tu contraseña'
            }), 200
        else:
            # Si falla el envío, devolver el token para desarrollo
            return jsonify({
                'message': 'Se ha generado un token de recuperación (modo desarrollo)',
                'reset_token': reset_token
            }), 200
        
    except Exception as e:
        logging.error(f'Error en forgot_password: {str(e)}', exc_info=True)
        return jsonify({'error': 'Error interno del servidor'}), 500

@bp.route('/reset-password', methods=['POST'])
def reset_password():
    """
    Restablece la contraseña usando el token de recuperación
    """
    try:
        # Importar User aquí para evitar problemas de importación circular
        from models.user import User
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No se recibieron datos'}), 400
            
        reset_token = data.get('reset_token')
        new_password = data.get('new_password')
        
        if not reset_token or not new_password:
            return jsonify({'error': 'Token y nueva contraseña son requeridos'}), 400
        
        logging.info(f'Intento de reset con token: {reset_token[:10]}...')
        
        # Buscar usuario por token de recuperación
        user = User.query.filter_by(reset_token=reset_token).first()
        if not user:
            logging.warning(f'Token no encontrado: {reset_token}')
            return jsonify({'error': 'Token inválido o expirado'}), 400
        
        # Verificar que el token no haya expirado
        if user.reset_token_expires and user.reset_token_expires < datetime.datetime.utcnow():
            logging.warning(f'Token expirado para usuario {user.id}')
            return jsonify({'error': 'Token expirado'}), 400
        
        # Actualizar contraseña
        user.set_password(new_password)
        user.reset_token = None
        user.reset_token_expires = None
        db.session.commit()
        
        logging.info(f'Contraseña actualizada para usuario {user.id}')
        
        return jsonify({'message': 'Contraseña actualizada correctamente'}), 200
        
    except Exception as e:
        logging.error(f'Error en reset_password: {str(e)}')
        return jsonify({'error': 'Error interno del servidor'}), 500
