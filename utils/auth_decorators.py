from functools import wraps
from flask import jsonify, session
from models import User, db
from sqlalchemy.exc import SQLAlchemyError
import logging

def login_required(f):
    """
    Decorador que requiere que el usuario haya iniciado sesión para acceder a la ruta.
    Si no está autenticado, devuelve un error 401.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({
                'error': 'Autenticación requerida',
                'message': 'Debes iniciar sesión para acceder al chatbot'
            }), 401
        
        try:
            # Verificar que el usuario existe en la base de datos
            user = db.session.query(User).filter_by(id=user_id).first()
            if not user:
                session.clear()
                return jsonify({
                    'error': 'Usuario no encontrado',
                    'message': 'Debes iniciar sesión nuevamente'
                }), 401
        except SQLAlchemyError:
            logging.exception('auth: error verificando usuario en decorador')
            return jsonify({
                'error': 'Error de base de datos',
                'message': 'No se pudo verificar la autenticación'
            }), 500
        
        return f(*args, **kwargs)
    
    return decorated_function
