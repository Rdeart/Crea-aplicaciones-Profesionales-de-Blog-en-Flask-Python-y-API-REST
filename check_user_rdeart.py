import sqlite3

conn = sqlite3.connect('instance/blog.db')
cursor = conn.cursor()

# Buscar usuario con el Gmail de rdeartperez
cursor.execute('SELECT username, email, is_verified FROM user WHERE email = "rdeartperez@gmail.com"')
user = cursor.fetchone()

if user:
    print(f'Usuario encontrado: {user[0]}, Email: {user[1]}, Verificado: {user[2]}')
else:
    print('No se encontró usuario con email rdeartperez@gmail.com')

conn.close()
