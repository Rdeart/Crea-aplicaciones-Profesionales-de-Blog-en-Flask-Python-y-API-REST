from models import db
from sqlalchemy import text
from app import create_app

app = create_app()

with app.app_context():
    conn = db.engine.connect()
    # Try to add column if not exists (SQLite doesn't support IF NOT EXISTS for ALTER TABLE, so check PRAGMA)
    try:
        # Check if column exists
        res = conn.execute(text("PRAGMA table_info('article')")).fetchall()
        cols = [r[1] for r in res]
        if 'video_url' not in cols:
            print('Adding video_url column to article table...')
            conn.execute(text('ALTER TABLE article ADD COLUMN video_url TEXT'))
            print('Column added.')
        else:
            print('video_url column already exists.')
    except Exception as e:
        print('Error while adding column:', e)
    finally:
        conn.close()
