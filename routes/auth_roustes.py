from flask import Blueprint, request, jsonify, session
from models import User, db
from models.article import Article
from services.auth_service import register_user, login_user, logout_user, get_profile, update_profile
from sqlalchemy.exc import SQLAlchemyError
import logging



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
    user_id = session.get('user_id')
    if user_id:
        try:
            # Select only username to avoid loading full User row (prevents errors if new columns missing)
            username = db.session.query(User.username).filter_by(id=user_id).scalar()
        except SQLAlchemyError:
            # If any DB error (missing columns), return unauthenticated to keep site running
            logging.exception('auth: error checking auth username')
            return jsonify({'authenticated': False}), 401
        if username:
            return jsonify({'authenticated': True, 'username': username, 'user_id': user_id}), 200
        return jsonify({'authenticated': False}), 401
    else:
        return jsonify({
                'authenticated': False,

            }),401





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