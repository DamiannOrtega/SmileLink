import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ArrowLeft, Pencil, User, Heart, Mail, Phone, MapPin, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PadrinosService,
  Padrino,
  ApadrinamientosService,
  Apadrinamiento,
  NinosService
} from "@/services/api";

export default function PadrinoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [padrino, setPadrino] = useState<Padrino | null>(null);
  const [apadrinamientos, setApadrinamientos] = useState<Apadrinamiento[]>([]);
  const [ninosMap, setNinosMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const [padrinoData, apadrinamientosData, ninosData] = await Promise.all([
        PadrinosService.getById(id),
        ApadrinamientosService.getByPadrino(id),
        NinosService.getAll()
      ]);

      setPadrino(padrinoData);
      setApadrinamientos(apadrinamientosData);
      setNinosMap(new Map(ninosData.map(n => [n.id_nino, n.nombre])));
    } catch (err) {
      toast.error("Error al cargar datos del padrino");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs />
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!padrino) {
    return (
      <div className="space-y-6">
        <Breadcrumbs />
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Padrino no encontrado</p>
            <div className="flex justify-center mt-4">
              <Button onClick={() => navigate("/padrinos")}>Volver a la lista</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const apadrinamientosActivos = apadrinamientos.filter(
    a => a.estado_apadrinamiento_registro === "Activo"
  ).length;

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{padrino.nombre}</h1>
          <p className="text-muted-foreground">Detalles del padrino</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/padrinos")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <Button onClick={() => navigate(`/padrinos/${id}/editar`)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Resumen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-square relative overflow-hidden rounded-lg bg-muted flex items-center justify-center mb-4">
              <User className="h-20 w-20 text-muted-foreground" />
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">ID</p>
                <p className="font-mono text-sm">{padrino.id_padrino}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Apadrinamientos</p>
                <div className="flex gap-2 items-center">
                  <Badge variant="default">
                    {apadrinamientosActivos} Activos
                  </Badge>
                  <Badge variant="outline">
                    {padrino.historial_apadrinamiento_ids.length} Total
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fecha de Registro</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">
                    {new Date(padrino.fecha_registro).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información de Contacto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nombre Completo</p>
                <p className="font-medium">{padrino.nombre}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{padrino.email}</p>
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Teléfono</p>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{padrino.telefono || "No especificado"}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Google Auth</p>
                <p className="font-medium">
                  {padrino.id_google_auth ? (
                    <Badge variant="secondary">Vinculado</Badge>
                  ) : (
                    <Badge variant="outline">No vinculado</Badge>
                  )}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Dirección</p>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">{padrino.direccion || "No especificado"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Historial de Apadrinamientos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {apadrinamientos.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Niño</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fecha Inicio</TableHead>
                  <TableHead>Fecha Fin</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Entregas</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apadrinamientos.map((apad) => (
                  <TableRow key={apad.id_apadrinamiento}>
                    <TableCell className="font-mono text-xs">{apad.id_apadrinamiento}</TableCell>
                    <TableCell className="font-medium">
                      {ninosMap.get(apad.id_nino) || "N/A"}
                    </TableCell>
                    <TableCell>{apad.tipo_apadrinamiento}</TableCell>
                    <TableCell>{new Date(apad.fecha_inicio).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {apad.fecha_fin ? new Date(apad.fecha_fin).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={apad.estado_apadrinamiento_registro === "Activo" ? "default" : "outline"}
                      >
                        {apad.estado_apadrinamiento_registro}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{apad.entregas_ids.length}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/asignaciones/${apad.id_apadrinamiento}`)}
                      >
                        Ver detalle
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No hay apadrinamientos registrados
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
