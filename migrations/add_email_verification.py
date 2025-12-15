"""
Migration: Add email verification fields to User table
"""
import sqlite3
import os

def migrate():
    """Add email verification columns to user table"""
    db_path = os.path.join(os.path.dirname(__file__), '..', 'instance', 'blog.db')
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(user)")
        columns = [row[1] for row in cursor.fetchall()]
        
        # Add new columns if they don't exist
        new_columns = [
            ("is_verified", "BOOLEAN DEFAULT 0"),
            ("verification_token", "VARCHAR(255)"),
            ("verification_token_expires", "DATETIME"),
            ("email_verified_at", "DATETIME")
        ]
        
        for column_name, column_def in new_columns:
            if column_name not in columns:
                print(f"Adding column: {column_name}")
                cursor.execute(f"ALTER TABLE user ADD COLUMN {column_name} {column_def}")
            else:
                print(f"Column {column_name} already exists")
        
        conn.commit()
        print("Migration completed successfully!")
        
    except Exception as e:
        print(f"Migration error: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    migrate()
