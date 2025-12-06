"""
Script para limpiar todas las entregas de prueba
"""
from storage import get_storage_manager

storage = get_storage_manager()

print("🗑️  Limpiando entregas de prueba...")

# Get all entregas
entregas = storage.list_all('entregas')
print(f"Encontradas {len(entregas)} entregas")

# Delete each one
for entrega in entregas:
    entrega_id = entrega.get('id_entrega')
    if entrega_id:
        result = storage.delete('entregas', entrega_id)
        if result:
            print(f"  ✅ Eliminada: {entrega_id} - {entrega.get('descripcion_regalo')}")
        else:
            print(f"  ❌ Error eliminando: {entrega_id}")

# Verify cleanup
entregas_after = storage.list_all('entregas')
print(f"\n✨ Limpieza completada!")
print(f"Entregas restantes: {len(entregas_after)}")
