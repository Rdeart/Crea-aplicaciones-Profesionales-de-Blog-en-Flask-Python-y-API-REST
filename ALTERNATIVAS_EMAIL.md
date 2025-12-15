# Alternativas para Envío de Emails

## Opción 1: Gmail SMTP (Recomendada para desarrollo)
- **Administrador:** Configura una vez con contraseña de aplicación
- **Gratis:** 500 emails/día
- **Fácil:** Solo configurar `config/email_config.py`

## Opción 2: SendGrid
- **Administrador:** Crea cuenta y configura API key
- **Gratis:** 100 emails/día
- **Más profesional:** Para producción

## Opción 3: Mailgun
- **Administrador:** Crea cuenta y configura API key
- **Gratis:** 5,000 emails/mes
- **Robusto:** Para alta escala

## Opción 4: Deshabilitar verificación (No recomendado)
- Editar `services/email_verification_service.py`
- Comentar la línea que envía email
- **Riesgo:** Cualquiera puede registrarse con @curelatam.com

## ¿Qué necesitas AHORA?

**Si quieres Gmail SMTP:**
1. Sigue los pasos de `INSTRUCCIONES_EMAIL.md`
2. Configura una vez
3. Listo para todos los usuarios

**Si no quieres configurar nada:**
1. Puedo deshabilitar la verificación temporalmente
2. Los usuarios pueden registrarse sin email
3. Pero es menos seguro

¿Qué prefieres?
