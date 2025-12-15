import secrets
import datetime
from flask import url_for, current_app
from models.user import User
from models import db
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config.email_config import EmailConfig

def generate_verification_token():
    """Generar token seguro de verificación"""
    return secrets.token_urlsafe(32)

def send_verification_email(email, token):
    """Enviar email de verificación"""
    try:
        # Verificar si las credenciales están configuradas
        from config.email_config import is_configured
        if not is_configured():
            print("Error: Credenciales de email no configuradas. Por favor configura MAIL_USERNAME y MAIL_PASSWORD en config/email_config.py")
            return False
        
        # Crear URL de verificación
        verification_url = f"{EmailConfig.BASE_URL}/verify-email?token={token}"
        
        # Configurar email con UTF-8
        msg = MIMEMultipart('utf-8')
        msg['From'] = EmailConfig.MAIL_DEFAULT_SENDER
        msg['To'] = email
        msg['Subject'] = 'Verifica tu email - CURELATAM'
        
        # HTML del email sin caracteres especiales
        html_content = f"""
        <html>
        <head>
            <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="background-color: #0081a1; padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">Bienvenido a CURELATAM</h1>
                </div>
                <div style="padding: 40px 30px;">
                    <h2 style="color: #333; margin-bottom: 20px;">Verifica tu direccion de correo</h2>
                    <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
                        Gracias por registrarte en CURELATAM. Por favor haz clic en el boton de abajo para verificar tu direccion de correo y activar tu cuenta.
                    </p>
                    <div style="text-align: center; margin: 40px 0;">
                        <a href="{verification_url}"
                       style="background-color: #0081a1; color: white; padding: 12px 30px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                            Verificar Email
                        </a>
                    </div>
                    <p>Este enlace expirara en 24 horas.</p>
                    <p>Si no creaste esta cuenta, ignora este email.</p>
                </div>
                <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
                    <p>&copy; 2025 CURELATAM. Todos los derechos reservados.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(html_content, 'html', 'utf-8'))
        
        # Enviar email
        with smtplib.SMTP(EmailConfig.MAIL_SERVER, EmailConfig.MAIL_PORT) as server:
            server.starttls()
            server.login(EmailConfig.MAIL_USERNAME, EmailConfig.MAIL_PASSWORD)
            server.send_message(msg)
            
        return True
    except Exception as e:
        print(f"Error enviando email de verificación: {e}")
        return False

def create_user_with_verification(data):
    """Crear usuario con verificación pendiente"""
    email = data.get('email', '').lower()
    username = data.get('username', '').strip()
    
    # Validar dominio corporativo
    from config.corporate_domains import is_corporate_email
    if not is_corporate_email(email):
        return {
            'error': 'El registro está restringido a correos personales. Por favor, utiliza tu email @curelatam.com.'
        }, 403
    
    # Validar que el email sea real
    from services.email_validator import is_real_email
    if not is_real_email(email):
        return {
            'error': 'Por favor ingrese un correo electrónico real y verificado. El correo proporcionado no parece ser válido o no existe.'
        }, 400
    
    # Verificar si el email ya existe
    if User.query.filter_by(email=email).first():
        return {
            'error': 'El email ya está registrado'
        }, 400
    
    # Verificar si el username ya existe
    if User.query.filter_by(username=username).first():
        return {
            'error': 'El nombre de usuario ya está en uso. Por favor elige otro.'
        }, 400
    
    # Crear usuario no verificado
    verification_token = generate_verification_token()
    expiry_time = datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    
    new_user = User(
        username=username, 
        email=email,
        is_verified=False,
        verification_token=verification_token,
        verification_token_expires=expiry_time
    )
    new_user.set_password(data['password'])
    db.session.add(new_user)
    db.session.commit()
    
    # Enviar email de verificación
    email_sent = send_verification_email(email, verification_token)
    
    return {
        'message': f'Usuario {new_user.username} registrado. Por favor verifica tu email.',
        'email_sent': email_sent,
        'requires_verification': True
    }, 201

def verify_email_token(token):
    """Verificar token de email"""
    user = User.query.filter_by(verification_token=token).first()
    
    if not user:
        return {'error': 'Token inválido'}, 400
    
    if user.is_verified:
        return {'error': 'Cuenta ya verificada'}, 400
    
    if datetime.datetime.utcnow() > user.verification_token_expires:
        return {'error': 'Token expirado. Solicita un nuevo email de verificación.'}, 400
    
    # Activar cuenta
    user.is_verified = True
    user.verification_token = None
    user.verification_token_expires = None
    user.email_verified_at = datetime.datetime.utcnow()
    db.session.commit()
    
    return {'message': 'Cuenta verificada exitosamente. Ya puedes iniciar sesión.'}, 200

def resend_verification_email(email):
    """Reenviar email de verificación"""
    user = User.query.filter_by(email=email.lower()).first()
    
    if not user:
        return {'error': 'Email no encontrado'}, 404
    
    if user.is_verified:
        return {'error': 'Cuenta ya verificada'}, 400
    
    # Generar nuevo token
    verification_token = generate_verification_token()
    expiry_time = datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    
    user.verification_token = verification_token
    user.verification_token_expires = expiry_time
    db.session.commit()
    
    # Enviar email
    email_sent = send_verification_email(email, verification_token)
    
    return {
        'message': '¡Email de verificación enviado! Revisa tu bandeja de entrada.',
        'email_sent': email_sent
    }, 200
