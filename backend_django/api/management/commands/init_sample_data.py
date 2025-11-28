"""
Management command to initialize storage with sample data
"""
from django.core.management.base import BaseCommand
from storage import get_storage_manager
from datetime import date


class Command(BaseCommand):
    help = 'Initialize storage with sample data for testing'
    
    def handle(self, *args, **options):
        storage = get_storage_manager()
        
        self.stdout.write('Initializing storage with sample data...')
        
        # Sample Niños
        ninos = [
            {
                'id_nino': 'N001',
                'nombre': 'Sofía Martínez',
                'edad': 8,
                'genero': 'Femenino',
                'descripcion': 'Le gusta dibujar y los gatos.',
                'necesidades': ['Mochila', 'Zapatos escolares'],
                'id_padrino_actual': 'P001',
                'estado_apadrinamiento': 'Apadrinado',
                'fecha_apadrinamiento_actual': '2025-11-01'
            },
            {
                'id_nino': 'N002',
                'nombre': 'Carlos Ramírez',
                'edad': 10,
                'genero': 'Masculino',
                'descripcion': 'Apasionado por el fútbol.',
                'necesidades': ['Balón de fútbol', 'Libros'],
                'estado_apadrinamiento': 'Disponible'
            }
        ]
        
        # Sample Padrinos
        padrinos = [
            {
                'id_padrino': 'P001',
                'nombre': 'Juan Damián Ortega',
                'email': 'juan@smilelink.org',
                'fecha_registro': str(date.today()),
                'direccion': 'Av. Universidad 100',
                'telefono': '449-123-4567',
                'historial_apadrinamiento_ids': ['AP001']
            }
        ]
        
        # Sample Apadrinamientos
        apadrinamientos = [
            {
                'id_apadrinamiento': 'AP001',
                'id_padrino': 'P001',
                'id_nino': 'N001',
                'fecha_inicio': '2025-11-01',
                'tipo_apadrinamiento': 'Elección Padrino',
                'estado_apadrinamiento_registro': 'Activo',
                'entregas_ids': []
            }
        ]
        
        # Save data
        for nino in ninos:
            storage.save('ninos', nino['id_nino'], nino)
            self.stdout.write(f"  ✓ Created niño: {nino['nombre']}")
        
        for padrino in padrinos:
            storage.save('padrinos', padrino['id_padrino'], padrino)
            self.stdout.write(f"  ✓ Created padrino: {padrino['nombre']}")
        
        for apad in apadrinamientos:
            storage.save('apadrinamientos', apad['id_apadrinamiento'], apad)
            self.stdout.write(f"  ✓ Created apadrinamiento: {apad['id_apadrinamiento']}")
        
        self.stdout.write(self.style.SUCCESS('\n✅ Sample data initialized successfully!'))
