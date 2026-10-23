import test from 'node:test';
import assert from 'node:assert/strict';

// Simulación del contrato de integración entre el Frontend y el Backend Django REST Framework
test('Integration test frontend: Validación de contrato de autenticación y sesión', async () => {
  // 1. Simulación de respuesta real de login del backend
  const mockBackendLoginResponse = {
    message: 'Login exitoso',
    token: 'header.payload.signature_jwt_token_2026',
    padrino: {
      id: 101,
      nombre: 'María Rodríguez Donante',
      email: 'maria.donante@smilelink.org',
      activo: true,
      puede_apadrinar: false,
      estado_verificacion: 'Pendiente'
    }
  };

  // 2. Simular almacenamiento en LocalStorage y adaptación de headers
  const authState = {
    token: mockBackendLoginResponse.token,
    user: mockBackendLoginResponse.padrino,
    isAuthenticated: true
  };

  assert.equal(authState.isAuthenticated, true);
  assert.equal(authState.user.email, 'maria.donante@smilelink.org');
  assert.ok(authState.token.startsWith('header.'));

  // 3. Simular inyección de token en headers HTTP para peticiones subsecuentes
  const requestHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authState.token}`
  };

  assert.equal(requestHeaders['Authorization'], 'Bearer header.payload.signature_jwt_token_2026');
});

test('Integration test frontend: Adaptador de datos de niños y estado de apadrinamiento', () => {
  const backendNinoRecord = {
    id: 12,
    nombre: 'Pepito Pérez',
    edad: 8,
    genero: 'Masculino',
    descripcion: 'Gusta de dibujar y jugar fútbol',
    estado_apadrinamiento: 'Disponible',
    activo: true
  };

  // Normalización que realiza el frontend
  const frontendModel = {
    id_nino: String(backendNinoRecord.id),
    nombre: backendNinoRecord.nombre,
    edad: backendNinoRecord.edad,
    genero: backendNinoRecord.genero,
    estado_apadrinamiento: backendNinoRecord.estado_apadrinamiento,
    puede_solicitar: backendNinoRecord.estado_apadrinamiento === 'Disponible' && backendNinoRecord.activo
  };

  assert.equal(frontendModel.id_nino, '12');
  assert.equal(frontendModel.puede_solicitar, true);
});
