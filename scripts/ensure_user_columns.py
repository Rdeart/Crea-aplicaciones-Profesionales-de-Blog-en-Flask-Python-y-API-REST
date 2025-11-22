import os
import sys
# Añadir la carpeta raíz del proyecto al sys.path para que 'import app' funcione
ROOT = os.path.dirname(os.path.dirname(__file__))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from app import create_app
from models import db
from sqlalchemy import text
import traceback

app = create_app()

with app.app_context():
    try:
        print('[script] Verificando columnas de la tabla `user`...')
        res = db.session.execute(text("PRAGMA table_info(user);"))
        cols = [row[1] for row in res.fetchall()]
        print('[script] columnas existentes:', cols)
        changed = False
        if 'first_name' not in cols:
            print('[script] Agregando columna `first_name`')
            db.session.execute(text("ALTER TABLE user ADD COLUMN first_name VARCHAR(120);"))
            changed = True
        if 'last_name' not in cols:
            print('[script] Agregando columna `last_name`')
            db.session.execute(text("ALTER TABLE user ADD COLUMN last_name VARCHAR(120);"))
            changed = True
        if 'area' not in cols:
            print('[script] Agregando columna `area`')
            db.session.execute(text("ALTER TABLE user ADD COLUMN area VARCHAR(150);"))
            changed = True
        if 'photo_url' not in cols:
            print('[script] Agregando columna `photo_url`')
            db.session.execute(text("ALTER TABLE user ADD COLUMN photo_url TEXT;"))
            changed = True
        if changed:
            db.session.commit()
            print('[script] Columnas agregadas y guardadas en la base de datos')
        else:
            print('[script] No hay cambios necesarios')
    except Exception:
        traceback.print_exc()
        db.session.rollback()
        print('[script] Error al asegurar las columnas')

print('Listo')