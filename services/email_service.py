from flask import current_app
from flask_mail import Message, Mail
import logging

mail = Mail()

def send_password_reset_email(user_email, reset_token):
    """
    Envía un email con el enlace para restablecer la contraseña
    """
    try:
        # URL base para los enlaces de recuperación
        BASE_URL = 'http://localhost:3000'
        
        # Verificar si está configurado para enviar emails
        from flask import current_app
        mail_password = current_app.config.get('MAIL_PASSWORD')
        
        if not mail_password or mail_password == 'tu-contraseña-de-aplicación':
            logging.warning('Email no configurado, usando modo desarrollo')
            return False
        
        # Crear el enlace de recuperación
        reset_url = f"{BASE_URL}/pages/reset-password?token={reset_token}"
        
        # Crear el mensaje
        msg = Message(
            subject='Recuperación de Contraseña - Blog Corporativo',
            sender=current_app.config.get('MAIL_DEFAULT_SENDER'),
            recipients=[user_email]
        )
        
        # HTML del email
        msg.html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Recuperación de Contraseña</title>
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="background-color: #0081a1; color: white; padding: 30px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px;">Recuperación de Contraseña</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">Blog Corporativo Curelatam</p>
                </div>
                
                <div style="padding: 40px 30px;">
                    <h2 style="color: #333; margin-bottom: 20px;">Hola,</h2>
                    
                    <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
                        Hemos recibido una solicitud para restablecer la contraseña de tu cuenta asociada a 
                        <strong>{user_email}</strong>.
                    </p>
                    
                    <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
                        Para continuar con el proceso de recuperación, haz clic en el siguiente botón:
                    </p>
                    
                    <div style="text-align: center; margin: 40px 0;">
                        <a href="{reset_url}" 
                           style="background-color: #0081a1; color: white; padding: 15px 30px; 
                                  text-decoration: none; border-radius: 5px; font-weight: bold; 
                                  display: inline-block; font-size: 16px;">
                            Restablecer Contraseña
                        </a>
                    </div>
                    
                    <p style="color: #999; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
                        Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña actual 
                        seguirá siendo válida.
                    </p>
                    
                    <p style="color: #999; font-size: 14px; line-height: 1.5;">
                        Este enlace expirará en 1 hora por razones de seguridad.
                    </p>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #eee;">
                    <p style="margin: 0; color: #666; font-size: 14px;">
                        © 2025 Blog Corporativo Curelatam. Todos los derechos reservados.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Versión texto plano para clientes de email que no soportan HTML
        msg.body = f"""
        Recuperación de Contraseña - Blog Corporativo
        
        Hola,
        
        Hemos recibido una solicitud para restablecer la contraseña de tu cuenta asociada a {user_email}.
        
        Para continuar, visita el siguiente enlace:
        {reset_url}
        
        Si no solicitaste este cambio, puedes ignorar este correo.
        Este enlace expirará en 1 hora por razones de seguridad.
        
        © 2025 Blog Corporativo Curelatam. Todos los derechos reservados.
        """
        
        # Enviar el email
        mail.send(msg)
        logging.info(f'Email de recuperación enviado a {user_email}')
        return True
        
    except Exception as e:
        logging.error(f'Error al enviar email de recuperación: {str(e)}')
        return False
