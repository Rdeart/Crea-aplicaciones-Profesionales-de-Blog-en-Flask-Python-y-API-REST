from flask import Blueprint, request, jsonify, session
from models import User, db
from models.article import Article
from services.auth_service import register_user, login_user, logout_user, get_profile, update_profile
from utils.auth_decorators import login_required
from sqlalchemy.exc import SQLAlchemyError
import logging
import jwt



bp = Blueprint('auth', __name__)


@bp.route('/register', methods=['POST'])
def register_user_route():
    data = request.get_json()
    return register_user(data)
   

@bp.route('/login', methods=['POST'])
def login_user_route():
    data = request.get_json()
    return login_user(data)
   

@bp.route('/logout', methods=['POST'])
def logout_user_route():
    return logout_user()


@bp.route('/check-auth', methods=['GET'])
def check_auth_route():
    token = request.headers.get('Authorization')
    if not token:
        token = request.args.get('token')
    
    if not token:
        return jsonify({'authenticated': False}), 401
    
    try:
        if token.startswith('Bearer '):
            token = token[7:]
        
        decoded = jwt.decode(token, 'rdeart_super_secret_key_2025', algorithms=['HS256'])
        user_id = decoded['user_id']
        
        user = User.query.get(user_id)
        if user:
            return jsonify({
                'authenticated': True, 
                'username': user.username, 
                'user_id': user_id
            }), 200
        else:
            return jsonify({'authenticated': False}), 401
    except jwt.ExpiredSignatureError:
        return jsonify({'authenticated': False}), 401
    except jwt.InvalidTokenError:
        return jsonify({'authenticated': False}), 401

# Ruta para obtener información del usuario autenticado
@bp.route('/api/user/current', methods=['GET'])
@login_required
def get_current_user():
    """
    GET /api/user/current
    Retorna información del usuario actual
    Retorna JSON: { id: user_id, username: username, email: email }
    """
    try:
        user_id = session.get('user_id')
        
        # Intentar obtener información adicional del usuario desde la base de datos
        from models import User
        user = User.query.get(user_id) if user_id else None
        
        if user:
            # Usuario encontrado en la base de datos
            return jsonify({
                'id': str(user.id),
                'username': user.username,
                'email': user.email
            })
        else:
            # Si no hay usuario en BD, devolver información de sesión
            return jsonify({
                'id': str(user_id) if user_id else 'anonymous',
                'username': 'Anonymous'
            })
            
    except Exception as e:
        # Manejar errores inesperados
        return jsonify({
            'error': 'Error obteniendo información del usuario',
            'detail': str(e)
        }), 500





@bp.route('/user/profile', methods=['GET'])
def get_profile_route():
    return get_profile()


@bp.route('/user/profile', methods=['PUT'])
def update_profile_route():
    data = request.get_json() or {}
    return update_profile(data)


@bp.route('/user/<int:user_id>/articles', methods=['GET'])
def user_articles_route(user_id):
    # reuse article_service to return all articles but filter by user
    articles = Article.query.filter_by(user_id=user_id).all()
    result = []
    for a in articles:
        result.append({
            'id': a.id,
            'title': a.title,
            'content': a.content,
            'image_url': a.image_url,
            'pdf_url': a.pdf_url,
            'tag': a.tag,
            'created_at': a.created_at.strftime('%d-%m-%Y') if a.created_at else None
        })
    return jsonify(result), 200


@bp.route('/user/<int:user_id>', methods=['GET'])
def get_user_profile_route(user_id):
    try:
        user = db.session.query(User).filter_by(id=user_id).first()
        if not user:
            return jsonify({'error': 'Usuario no encontrado'}), 404
        data = {
            'id': user.id,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'area': user.area,
            'photo_url': user.photo_url
        }
        return jsonify(data), 200
    except SQLAlchemyError as e:
        logging.exception('auth: error getting user profile')
        return jsonify({'error': 'Error al obtener usuario', 'detail': str(e)}), 500