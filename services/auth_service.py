from flask import jsonify, session, request
from models.user import User 
from models import db
import jwt
import datetime 
from config.corporate_domains import is_corporate_email

def register_user(data):
    from services.email_verification_service import create_user_with_verification
    return create_user_with_verification(data)

def login_user(data):
    user = User.query.filter_by(email=data['email']).first()
    if user and user.check_password(data['password']):
        # Verificar si el email está verificado
        if not user.is_verified:
            return jsonify({
                'error': 'Por favor verifica tu email antes de iniciar sesión. Revisa tu bandeja de entrada.',
                'requires_verification': True
            }), 401
        
        # Establecer user_id en la sesión para comentarios
        session['user_id'] = user.id
        
        token = jwt.encode({
            'user_id': user.id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, 'rdeart_super_secret_key_2025', algorithm='HS256')
        
        return jsonify({
            'message': 'Inicio de sesion exitoso',
            'token': token,
            'user_id': user.id,
            'username': user.username
        }), 200
    else:
        return jsonify({'error': 'Credenciales invalidas'}), 401
    
def logout_user():
    session.pop('user_id', None)
    return jsonify({'message':'Sesion cerrada con exito'})

def get_profile():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'error': 'Usuario no autenticado'}), 401
    
    if token.startswith('Bearer '):
        token = token[7:]
    
    try:
        decoded = jwt.decode(token, 'rdeart_super_secret_key_2025', algorithms=['HS256'])
        user_id = decoded['user_id']
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Usuario no encontrado'}), 404
            
        return jsonify({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'area': user.area,
            'photo_url': user.photo_url
        }), 200
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Token inválido'}), 401


def update_profile(data):
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'error': 'Usuario no autenticado'}), 401
    
    if token.startswith('Bearer '):
        token = token[7:]
    
    try:
        decoded = jwt.decode(token, 'rdeart_super_secret_key_2025', algorithms=['HS256'])
        user_id = decoded['user_id']
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Usuario no encontrado'}), 404
            
        # Update allowed fields
        if 'first_name' in data:
            user.first_name = data.get('first_name')
        if 'last_name' in data:
            user.last_name = data.get('last_name')
        if 'area' in data:
            user.area = data.get('area')
        if 'photo_url' in data:
            user.photo_url = data.get('photo_url')
        try:
            db.session.commit()
            return jsonify({'message': 'Perfil actualizado'}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Token inválido'}), 401