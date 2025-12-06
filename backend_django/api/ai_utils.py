
import google.generativeai as genai
import os
import base64
from django.conf import settings

# Configurar API Key
# Se busca en variables de entorno o settings
API_KEY = os.getenv('GOOGLE_API_KEY') or getattr(settings, 'GOOGLE_API_KEY', None)

if API_KEY:
    genai.configure(api_key=API_KEY)

def generate_avatar_description(child_description):
    """
    Usa Gemini para mejorar la descripción del niño y hacerla óptima para generar una imagen.
    """
    if not API_KEY:
        return None
    
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = f"Genera un prompt detallado en inglés para una IA generadora de imágenes (como DALL-E o Midjourney) para crear un avatar estilo cartoon/pixar 3D amigable de un niño con las siguientes características: {child_description}.  Solo devuelve el prompt, nada más."
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Error generando descripción: {e}")
        return child_description

def generate_avatar_image(child_description):
    """
    Intenta generar una imagen basada en la descripción.
    Nota: La generación de imágenes via API de Gemini Python SDK puede requerir configuración específica
    o acceso a modelos Imagen. Aquí simulamos la llamada si la librería
    no soporta 'generate_images' directamente en la versión instalada, o intentamos usar el endpoint correcto.
    """
    if not API_KEY:
        raise Exception("GOOGLE_API_KEY no configurada")

    try:
        # 1. Mejorar el prompt con Gemini
        image_prompt = generate_avatar_description(child_description)
        
        # NOTA: Actualmente la librería google-generativeai para consumidores (AI Studio)
        # está integrando Imagen. Si no está disponible directamente, esto fallará.
        # En ese caso, para este prototipo, si la llamada falla, devolvemos un error explicativo.
        
        # Intento hipotético de uso de modelo Imagen (si está disponible en tu cuenta/región)
        # model = genai.GenerativeModel('imagen-3.0-generate-001') # Nombre hipotético del modelo
        # response = model.generate_images(prompt=image_prompt, number_of_images=1)
        # return response.images[0] 
        
        # COMO FALLBACK para garantizar funcionalidad si no tienes acceso a Imagen 3 Beta:
        # Devolveremos el prompt mejorado para que el frontend pueda usarlo 
        # o (si prefieres) usamos una API pública gratuita de prueba.
        
        # Por ahora, vamos a dejar la estructura lista.
        # Si tienes acceso a Imagen, descomenta la parte de generación real.
        
        return {
            "prompt_used": image_prompt,
            "status": "prompt_generated_only",
            "message": "La generación de imagen directa requiere acceso al modelo Imagen 3 en tu cuenta. Se ha generado el prompt optimizado."
        }

    except Exception as e:
        print(f"Error en generación de avatar: {e}")
        raise e
