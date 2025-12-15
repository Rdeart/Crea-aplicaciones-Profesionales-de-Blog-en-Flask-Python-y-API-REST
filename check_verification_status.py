import sqlite3

conn = sqlite3.connect('instance/blog.db')
cursor = conn.cursor()

# Verificar estado del usuario rdeartperez
cursor.execute('SELECT username, email, is_verified, verification_token, email_verified_at FROM user WHERE email = "rdeartperez@gmail.com"')
user = cursor.fetchone()

if user:
    print(f'Usuario: {user[0]}')
    print(f'Email: {user[1]}')
    print(f'Verificado: {user[2]}')
    print(f'Token: {user[3][:20]}...')
    print(f'Verificado en: {user[4]}')
else:
    print('Usuario no encontrado')

conn.close()
