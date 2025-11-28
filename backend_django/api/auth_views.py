"""
Authentication views for SmileLink API
Handles user registration, login, and session management
"""

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime
import hashlib
import re

from storage import get_storage_manager


def hash_password(password: str) -> str:
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()


def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def generate_padrino_id() -> str:
    """Generate next padrino ID (P001, P002, etc.)"""
    storage = get_storage_manager()
    padrinos = storage.list_all('padrinos')
    
    if not padrinos:
        return "P001"
    
    # Get highest ID number
    max_num = 0
    for padrino in padrinos:
        id_num = int(padrino['id_padrino'][1:])  # Remove 'P' prefix
        max_num = max(max_num, id_num)
    
    return f"P{str(max_num + 1).zfill(3)}"


@api_view(['POST'])
def register(request):
    """
    Register a new padrino
    
    POST /api/auth/register/
    Body: {
        "nombre": "Juan Damián Ortega",
        "email": "juan@smilelink.org",
        "password": "password123",
        "direccion": "Av. Universidad 100",
        "telefono": "449-123-4567"
    }
    """
    # Validate required fields
    required_fields = ['nombre', 'email', 'password', 'direccion']
    for field in required_fields:
        if not request.data.get(field):
            return Response(
                {'error': f'El campo {field} es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    nombre = request.data['nombre']
    email = request.data['email'].lower().strip()
    password = request.data['password']
    direccion = request.data['direccion']
    telefono = request.data.get('telefono', '')
    
    # Validate email format
    if not validate_email(email):
        return Response(
            {'error': 'Formato de email inválido'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate password length
    if len(password) < 6:
        return Response(
            {'error': 'La contraseña debe tener al menos 6 caracteres'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate nombre length
    if len(nombre) < 3:
        return Response(
            {'error': 'El nombre debe tener al menos 3 caracteres'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if email already exists
    storage = get_storage_manager()
    padrinos = storage.list_all('padrinos')
    
    for padrino in padrinos:
        if padrino['email'].lower() == email:
            return Response(
                {'error': 'Este email ya está registrado'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    # Create new padrino
    new_padrino = {
        'id_padrino': generate_padrino_id(),
        'nombre': nombre,
        'email': email,
        'password_hash': hash_password(password),
        'fecha_registro': datetime.now().strftime('%Y-%m-%d'),
        'id_google_auth': None,
        'direccion': direccion,
        'telefono': telefono,
        'historial_apadrinamiento_ids': []
    }
    
    # Save to storage
    storage.save('padrinos', new_padrino['id_padrino'], new_padrino)
    
    # Return padrino data (without password_hash)
    response_data = {k: v for k, v in new_padrino.items() if k != 'password_hash'}
    
    return Response(
        {
            'message': 'Registro exitoso',
            'padrino': response_data
        },
        status=status.HTTP_201_CREATED
    )


@api_view(['POST'])
def login(request):
    """
    Login with email and password
    
    POST /api/auth/login/
    Body: {
        "email": "juan@smilelink.org",
        "password": "password123"
    }
    """
    email = request.data.get('email', '').lower().strip()
    password = request.data.get('password', '')
    
    if not email or not password:
        return Response(
            {'error': 'Email y contraseña son requeridos'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Find padrino by email
    storage = get_storage_manager()
    padrinos = storage.list_all('padrinos')
    
    password_hash = hash_password(password)
    
    for padrino in padrinos:
        if padrino['email'].lower() == email:
            if padrino['password_hash'] == password_hash:
                # Login successful
                response_data = {k: v for k, v in padrino.items() if k != 'password_hash'}
                return Response(
                    {
                        'message': 'Login exitoso',
                        'padrino': response_data
                    },
                    status=status.HTTP_200_OK
                )
            else:
                # Wrong password
                return Response(
                    {'error': 'Contraseña incorrecta'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
    
    # Email not found
    return Response(
        {'error': 'Email no registrado'},
        status=status.HTTP_404_NOT_FOUND
    )


@api_view(['GET'])
def get_current_user(request):
    """
    Get current padrino by ID
    
    GET /api/auth/me/?padrino_id=P001
    """
    padrino_id = request.query_params.get('padrino_id')
    
    if not padrino_id:
        return Response(
            {'error': 'padrino_id es requerido'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    storage = get_storage_manager()
    padrinos = storage.list_all('padrinos')
    
    for padrino in padrinos:
        if padrino['id_padrino'] == padrino_id:
            response_data = {k: v for k, v in padrino.items() if k != 'password_hash'}
            return Response(response_data, status=status.HTTP_200_OK)
    
    return Response(
        {'error': 'Padrino no encontrado'},
        status=status.HTTP_404_NOT_FOUND
    )


@api_view(['POST'])
def logout(request):
    """
    Logout (client-side only, just returns success)
    
    POST /api/auth/logout/
    """
    return Response(
        {'message': 'Sesión cerrada exitosamente'},
        status=status.HTTP_200_OK
    )
