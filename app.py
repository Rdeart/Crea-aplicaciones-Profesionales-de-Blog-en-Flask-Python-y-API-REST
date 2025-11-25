from flask import Flask, render_template
from models import db
from flask_cors import CORS
import os
import logging
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

# Cargar variables de entorno de forma robusta
try:
    from dotenv import load_dotenv
    # Forzar la recarga del archivo .env
    load_dotenv(override=True)
    
    # Verificar critical variables al inicio
    google_api_key = os.environ.get('GOOGLE_API_KEY')
    if not google_api_key:
        logging.error('⚠️ GOOGLE_API_KEY no encontrada en variables de entorno')
        print('⚠️ ERROR: GOOGLE_API_KEY no configurada. El chatbot no funcionará.')
    else:
        print('✅ GOOGLE_API_KEY cargada correctamente')
        
except ImportError:
    logging.error('❌ python-dotenv no instalado; intentando carga manual')
    # Intentar carga manual si dotenv no está disponible
    try:
        env_path = os.path.join(os.path.dirname(__file__), '.env')
        if os.path.exists(env_path):
            with open(env_path, 'r') as f:
                for line in f:
                    if line.strip() and not line.startswith('#'):
                        key, value = line.strip().split('=', 1)
                        os.environ[key] = value
            print('✅ Variables cargadas manualmente desde .env')
        else:
            print('❌ Archivo .env no encontrado')
    except Exception as e:
        logging.error(f'❌ Error cargando .env manualmente: {e}')
        print(f'❌ Error crítico cargando variables de entorno: {e}')



def create_app():
    app = Flask(__name__)
    app.secret_key = 'rdeart_super_secret_key_2025'
    # Ensure instance folder exists and use absolute DB path to avoid SQLite open errors
    instance_dir = os.path.join(os.path.dirname(__file__), 'instance')
    os.makedirs(instance_dir, exist_ok=True)
    db_file = os.path.join(instance_dir, 'blog.db')
    db_uri = 'sqlite:///' + os.path.abspath(db_file).replace('\\', '/')
    app.config['SQLALCHEMY_DATABASE_URI'] = db_uri
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Cookie configuration for CORS
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
    app.config['SESSION_COOKIE_SECURE'] = False  # False para HTTP en desarrollo
    app.config['SESSION_COOKIE_HTTPONLY'] = True

    db.init_app(app)

    CORS(app,
        supports_credentials=True,
        origins=[
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'http://192.10.2.191:3000',
            'http://192.10.2.141:3000',
        ],
        allow_headers=["Content-Type"],
        expose_headers=["Set-Cookie"],
        methods=["GET", "POST", "PUT", "PATCH", "OPTIONS", "DELETE"])

    with app.app_context():
        try:
            print(f'[startup] Using DB URI: {app.config["SQLALCHEMY_DATABASE_URI"]}')
            db.create_all()
        except SQLAlchemyError:
            logging.exception('[startup] Error running create_all()')
        # Ensure 'tag' column exists on Article table (safe alter for dev DBs)
        try:
            # Check existing columns
            res = db.session.execute(text("PRAGMA table_info(article);"))
            columns = [row[1] for row in res.fetchall()]
            print('[startup] article table columns:', columns)
            if 'tag' not in columns:
                # Add tag column
                print('[startup] tag column missing, attempting ALTER TABLE to add it')
                db.session.execute(text("ALTER TABLE article ADD COLUMN tag VARCHAR(150);"))
                db.session.commit()
                print('[startup] ALTER TABLE executed, tag column added')
            # Ensure pdf_url column exists as well
            if 'pdf_url' not in columns:
                print('[startup] pdf_url column missing, attempting ALTER TABLE to add it')
                db.session.execute(text("ALTER TABLE article ADD COLUMN pdf_url TEXT;"))
                db.session.commit()
                print('[startup] ALTER TABLE executed, pdf_url column added')
            # Ensure video_url column exists as well
            if 'video_url' not in columns:
                print('[startup] video_url column missing, attempting ALTER TABLE to add it')
                db.session.execute(text("ALTER TABLE article ADD COLUMN video_url TEXT;"))
                db.session.commit()
                print('[startup] ALTER TABLE executed, video_url column added')
                # Ensure user profile columns exist
                res_user = db.session.execute(text("PRAGMA table_info(user);"))
                user_columns = [row[1] for row in res_user.fetchall()]
                print('[startup] user table columns:', user_columns)
                if 'first_name' not in user_columns:
                    print('[startup] first_name missing, attempting ALTER TABLE to add it')
                    db.session.execute(text("ALTER TABLE user ADD COLUMN first_name VARCHAR(120);"))
                    db.session.commit()
                if 'last_name' not in user_columns:
                    print('[startup] last_name missing, attempting ALTER TABLE to add it')
                    db.session.execute(text("ALTER TABLE user ADD COLUMN last_name VARCHAR(120);"))
                    db.session.commit()
                if 'area' not in user_columns:
                    print('[startup] area missing, attempting ALTER TABLE to add it')
                    db.session.execute(text("ALTER TABLE user ADD COLUMN area VARCHAR(150);"))
                    db.session.commit()
                if 'photo_url' not in user_columns:
                    print('[startup] photo_url missing, attempting ALTER TABLE to add it')
                    db.session.execute(text("ALTER TABLE user ADD COLUMN photo_url TEXT;"))
                    db.session.commit()
        except SQLAlchemyError:
            # If anything fails here, avoid crashing the app on startup but log error
            logging.exception('[startup] Error ensuring DB columns')
            try:
                db.session.rollback()
            except Exception:
                pass


    from routes import auth_roustes, article_routes, chat_routes
    app.register_blueprint(auth_roustes.bp)
    app.register_blueprint(article_routes.bp)
    app.register_blueprint(chat_routes.bp)

    # Root route to serve the chat UI template
    @app.route('/')
    def index():
        return render_template('index.html')


    return app