import sqlite3
import sys
from sqlalchemy import create_engine, text

DB_PATH = 'instance/blog.db'

def main():
    # Simple sqlite3 approach
    try:
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("PRAGMA table_info(article);")
        cols = [row[1] for row in cur.fetchall()]
        print('Current columns:', cols)
        if 'tag' in cols:
            print('Column "tag" already exists. Nothing to do.')
            return 0
        print('Adding column "tag" to article table...')
        cur.execute('ALTER TABLE article ADD COLUMN tag VARCHAR(150);')
        conn.commit()
        cur.execute("PRAGMA table_info(article);")
        cols = [row[1] for row in cur.fetchall()]
        print('Updated columns:', cols)
        print('Done.')
        return 0
    except Exception as e:
        print('Error:', e)
        return 1

if __name__ == '__main__':
    sys.exit(main())
