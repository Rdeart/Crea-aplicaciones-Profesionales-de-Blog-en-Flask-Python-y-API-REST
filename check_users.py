import sqlite3

conn = sqlite3.connect('instance/blog.db')
cursor = conn.cursor()

# Verificar usuarios recientes
cursor.execute('SELECT username, email, is_verified FROM user WHERE email LIKE "%@curelatam.com" LIMIT 5')
users = cursor.fetchall()

print('Usuarios registrados recientes:')
for user in users:
    print(f'Username: {user[0]}, Email: {user[1]}, Verificado: {user[2]}')

conn.close()
