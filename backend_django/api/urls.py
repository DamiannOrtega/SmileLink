"""
SmileLink API - URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    NinosViewSet, PadrinosViewSet, ApadrinamientosViewSet,
    EntregasViewSet, SolicitudesViewSet, PuntosEntregaViewSet,
    EventosViewSet, AdministradoresViewSet, DashboardViewSet
)
from .auth_views import register, login, logout, get_current_user

router = DefaultRouter()
router.register(r'ninos', NinosViewSet, basename='nino')
router.register(r'padrinos', PadrinosViewSet, basename='padrino')
router.register(r'apadrinamientos', ApadrinamientosViewSet, basename='apadrinamiento')
router.register(r'entregas', EntregasViewSet, basename='entrega')
router.register(r'solicitudes', SolicitudesViewSet, basename='solicitud')
router.register(r'puntos-entrega', PuntosEntregaViewSet, basename='punto-entrega')
router.register(r'eventos', EventosViewSet, basename='evento')
router.register(r'administradores', AdministradoresViewSet, basename='administrador')
router.register(r'dashboard', DashboardViewSet, basename='dashboard')

urlpatterns = [
    path('', include(router.urls)),
    # Authentication endpoints
    path('auth/register/', register, name='auth-register'),
    path('auth/login/', login, name='auth-login'),
    path('auth/logout/', logout, name='auth-logout'),
    path('auth/me/', get_current_user, name='auth-me'),
]
