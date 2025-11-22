from flask import jsonify, session
from models.user import User 
from models import db 


def register_user(data):
    if User.query.filter_by(email=data['email']).first() is not None:
        return jsonify({
            'error': 'El email ya esta registrado'
        }), 400
    
    new_user = User(username=data['username'], email=data['email'])
    new_user.set_password(data['password'])
    db.session.add(new_user)
    db.session.commit()
    return jsonify({
        'message': f'Usuario {new_user.username} registrado con exito'
    }), 201

def login_user(data):
    user = User.query.filter_by(email=data['email']).first()
    if user and user.check_password(data['password']):
        session['user_id'] = user.id
        
        return jsonify({'message': 'Inicio de sesion exitoso'}), 200
    else:
        return jsonify({'error': 'Credenciales invalidas'}), 401
    
def logout_user():
    session.pop('user_id', None)
    return jsonify({'message':'Sesion cerrada con exito'})


def get_profile():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Usuario no autenticado'}), 401
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


def update_profile(data):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Usuario no autenticado'}), 401
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
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    return jsonify({'message': 'Perfil actualizado'}), 200