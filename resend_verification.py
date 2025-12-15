import sqlite3
from services.email_verification_service import send_verification_email

conn = sqlite3.connect('instance/blog.db')
cursor = conn.cursor()

# Obtener usuarios no verificados
cursor.execute('SELECT username, email, verification_token FROM user WHERE is_verified = 0 AND email LIKE "%@curelatam.com"')
users = cursor.fetchall()

print(f'Enviando emails a {len(users)} usuarios no verificados...')

for user in users:
    username, email, token = user
    print(f'Enviando a {username} ({email})...')
    result = send_verification_email(email, token)
    if result:
        print(f'✅ Email enviado a {email}')
    else:
        print(f'❌ Error enviando a {email}')

conn.close()
