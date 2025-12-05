import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ApadrinamientosService,
  NinosService,
  PadrinosService,
  Nino,
  Padrino
} from "@/services/api";
import LeafletMapComponent from "@/components/LeafletMapComponent";

const defaultCenter = {
  lat: 21.8853, // Aguascalientes, Mexico default
  lng: -102.2916,
};


export default function AsignacionNueva() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ninos, setNinos] = useState<Nino[]>([]);
  const [padrinos, setPadrinos] = useState<Padrino[]>([]);

  const [formData, setFormData] = useState({
    id_nino: "",
    id_padrino: "",
    tipo_apadrinamiento: "" as "Aleatorio" | "Elección Padrino" | "",
    direccion_entrega: "",
  });

  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ninosData, padrinosData] = await Promise.all([
        NinosService.getAll(),
        PadrinosService.getAll()
      ]);

      // Filtrar solo niños disponibles
      setNinos(ninosData.filter(n => n.estado_apadrinamiento === "Disponible"));
      setPadrinos(padrinosData);
    } catch (err) {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.id_nino) {
      toast.error("Selecciona un niño");
      return;
    }

    if (!formData.id_padrino) {
      toast.error("Selecciona un padrino");
      return;
    }

    if (!formData.tipo_apadrinamiento) {
      toast.error("Selecciona el tipo de apadrinamiento");
      return;
    }

    try {
      setSubmitting(true);
      const nuevaAsignacion = await ApadrinamientosService.create({
        id_nino: formData.id_nino,
        id_padrino: formData.id_padrino,
        fecha_inicio: new Date().toISOString().split("T")[0],
        tipo_apadrinamiento: formData.tipo_apadrinamiento,
        estado_apadrinamiento_registro: "Activo",
        entregas_ids: [],
        ubicacion_entrega_lat: selectedLocation?.lat,
        ubicacion_entrega_lng: selectedLocation?.lng,
        direccion_entrega: formData.direccion_entrega,
      });

      // Actualizar estado del niño
      await NinosService.update(formData.id_nino, {
        estado_apadrinamiento: "Apadrinado",
        id_padrino_actual: formData.id_padrino,
        fecha_apadrinamiento_actual: new Date().toISOString().split("T")[0],
      });

      toast.success("Asignación creada exitosamente");
      navigate(`/asignaciones/${nuevaAsignacion.id_apadrinamiento}`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error al crear asignación";
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div>
        <h1 className="text-3xl font-bold text-foreground">Nueva Asignación</h1>
        <p className="text-muted-foreground">
          Crea un nuevo apadrinamiento entre un niño y un padrino
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información de la Asignación</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="id_nino">
                Niño <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.id_nino} onValueChange={(value) => setFormData(prev => ({ ...prev, id_nino: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un niño" />
                </SelectTrigger>
                <SelectContent>
                  {ninos.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      No hay niños disponibles
                    </div>
                  ) : (
                    ninos.map((nino) => (
                      <SelectItem key={nino.id_nino} value={nino.id_nino}>
                        {nino.nombre} ({nino.edad} años)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="id_padrino">
                Padrino <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.id_padrino} onValueChange={(value) => setFormData(prev => ({ ...prev, id_padrino: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un padrino" />
                </SelectTrigger>
                <SelectContent>
                  {padrinos.map((padrino) => (
                    <SelectItem key={padrino.id_padrino} value={padrino.id_padrino}>
                      {padrino.nombre} ({padrino.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">
                Tipo de Apadrinamiento <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.tipo_apadrinamiento} onValueChange={(value: "Aleatorio" | "Elección Padrino") => setFormData(prev => ({ ...prev, tipo_apadrinamiento: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Elección Padrino">Elección Padrino</SelectItem>
                  <SelectItem value="Aleatorio">Aleatorio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ubicación de Entrega (Opcional)</Label>
              <LeafletMapComponent
                center={defaultCenter}
                zoom={13}
                height="400px"
                selectedLocation={selectedLocation}
                onLocationSelect={setSelectedLocation}
                interactive={true}
              />
              <div className="pt-2">
                <Label htmlFor="direccion_entrega">Dirección Escrita</Label>
                <Input
                  id="direccion_entrega"
                  placeholder="Ej. Parque Central, o detalles adicionales"
                  value={formData.direccion_entrega}
                  onChange={(e) => setFormData(prev => ({ ...prev, direccion_entrega: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Selecciona en el mapa o escribe una dirección de referencia.
                </p>
              </div>
            </div>


            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/asignaciones")}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  "Crear Asignación"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
