#!/usr/bin/env python3
"""
Script de diagnóstico para verificar la configuración del chatbot
"""
import os
import sys

def check_env_file():
    """Verificar el archivo .env"""
    env_path = '.env'
    
    print("🔍 Verificando configuración del chatbot...")
    print("=" * 50)
    
    # 1. Verificar archivo .env
    if os.path.exists(env_path):
        print(f"✅ Archivo .env encontrado en: {os.path.abspath(env_path)}")
        
        # Leer contenido
        try:
            with open(env_path, 'r') as f:
                lines = f.readlines()
                
            google_key_found = False
            for line in lines:
                line = line.strip()
                if line.startswith('GOOGLE_API_KEY='):
                    google_key_found = True
                    key = line.split('=', 1)[1]
                    print(f"✅ GOOGLE_API_KEY encontrada (longitud: {len(key)})")
                    if len(key) < 10:
                        print("⚠️  La API key parece demasiado corta")
                    break
            
            if not google_key_found:
                print("❌ GOOGLE_API_KEY no encontrada en .env")
                
        except Exception as e:
            print(f"❌ Error leyendo .env: {e}")
    else:
        print(f"❌ Archivo .env no encontrado en: {os.path.abspath(env_path)}")
        return False
    
    # 2. Verificar variables de entorno
    print("\n🔍 Verificando variables de entorno...")
    
    env_key = os.environ.get('GOOGLE_API_KEY')
    if env_key:
        print(f"✅ GOOGLE_API_KEY en entorno (longitud: {len(env_key)})")
    else:
        print("❌ GOOGLE_API_KEY no encontrada en variables de entorno")
    
    # 3. Verificar instalación de python-dotenv
    print("\n🔍 Verificando dependencias...")
    try:
        import dotenv
        print("✅ python-dotenv instalado")
    except ImportError:
        print("❌ python-dotenv NO instalado")
        print("   Ejecuta: pip install python-dotenv")
        return False
    
    # 4. Verificar requests
    try:
        import requests
        print("✅ requests instalado")
    except ImportError:
        print("❌ requests NO instalado")
        print("   Ejecuta: pip install requests")
        return False
    
    print("\n" + "=" * 50)
    print("🎯 Diagnóstico completado")
    
    return True

if __name__ == "__main__":
    check_env_file()
