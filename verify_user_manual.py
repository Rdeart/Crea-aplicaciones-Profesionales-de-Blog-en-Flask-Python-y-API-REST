import sqlite3
import datetime

conn = sqlite3.connect('instance/blog.db')
cursor = conn.cursor()

# Verificar manualmente al usuario rdeartperez
cursor.execute('UPDATE user SET is_verified = 1, email_verified_at = ? WHERE email = "rdeartperez@gmail.com"', 
              (datetime.datetime.now(),))

conn.commit()

# Verificar el cambio
cursor.execute('SELECT username, email, is_verified, email_verified_at FROM user WHERE email = "rdeartperez@gmail.com"')
user = cursor.fetchone()

if user:
    print(f'Usuario: {user[0]}')
    print(f'Email: {user[1]}')
    print(f'Verificado: {user[2]}')
    print(f'Verificado en: {user[3]}')
    print('¡Usuario verificado exitosamente!')

conn.close()
