import re
import dns.resolver
import socket
import smtplib
from typing import Tuple, Optional

def validate_email_format(email: str) -> bool:
    """Validar formato básico del email"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_domain_mx(domain: str) -> Tuple[bool, Optional[str]]:
    """
    Verificar si el dominio tiene registros MX válidos
    Retorna (es_valido, mensaje_error)
    """
    try:
        mx_records = dns.resolver.resolve(domain, 'MX')
        if len(mx_records) > 0:
            return True, None
        else:
            return False, f"El dominio {domain} no tiene servidores de correo configurados"
    except dns.resolver.NXDOMAIN:
        return False, f"El dominio {domain} no existe"
    except dns.resolver.NoAnswer:
        return False, f"El dominio {domain} no tiene registros MX"
    except Exception as e:
        return False, f"Error verificando el dominio: {str(e)}"

def validate_email_existence(email: str) -> Tuple[bool, Optional[str]]:
    """
    Verificar si el email existe usando SMTP
    NOTA: Muchos servidores bloquean esta verificación por seguridad
    """
    domain = email.split('@')[1]
    
    try:
        # Obtener registros MX
        mx_records = dns.resolver.resolve(domain, 'MX')
        mx_host = str(mx_records[0].exchange)
        
        # Conectar al servidor SMTP
        server = smtplib.SMTP(timeout=10)
        server.connect(mx_host)
        server.helo_check = False
        
        # Verificar email (VRFY command - puede estar deshabilitado)
        try:
            code, message = server.verify(email)
            server.quit()
            return code == 250, None
        except smtplib.SMTPResponseException as e:
            server.quit()
            # Si VRFY no está disponible, asumimos que el email podría existir
            # pero no podemos verificarlo con certeza
            if e.smtp_code == 502:  # Command not implemented
                return True, "No se puede verificar la existencia del email, pero el dominio es válido"
            return False, f"Email no existe o no se puede verificar: {str(e)}"
            
    except Exception as e:
        return False, f"Error verificando email: {str(e)}"

def comprehensive_email_validation(email: str) -> Tuple[bool, Optional[str]]:
    """
    Validación completa del email:
    1. Formato
    2. Dominio existente con MX
    3. (Opcional) Verificación de existencia
    """
    
    # 1. Validar formato
    if not validate_email_format(email):
        return False, "El formato del email es inválido"
    
    # 2. Validar dominio
    domain = email.split('@')[1]
    domain_valid, domain_error = validate_domain_mx(domain)
    if not domain_valid:
        return False, domain_error
    
    # 3. Para @curelatam.com, podemos ser más permisivos ya que es un dominio corporativo controlado
    if domain == 'curelatam.com':
        return True, None
    
    # 4. Para otros dominios, intentar verificar existencia (puede fallar)
    email_valid, email_error = validate_email_existence(email)
    if not email_valid:
        # Si no podemos verificar, pero el dominio es válido, permitimos
        if "no se puede verificar" in (email_error or "").lower():
            return True, "Dominio válido pero no se puede verificar la existencia del email"
        return False, email_error
    
    return True, None

def is_real_email(email: str) -> bool:
    """
    Función simple para verificar si es un email real
    Retorna True si parece ser un email válido y real
    """
    is_valid, error = comprehensive_email_validation(email)
    return is_valid
