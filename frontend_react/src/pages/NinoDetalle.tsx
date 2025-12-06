import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ArrowLeft, Pencil, User, Gift } from "lucide-react";
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
  NinosService,
  Nino,
  ApadrinamientosService,
  Apadrinamiento,
  PadrinosService
} from "@/services/api";

export default function NinoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [nino, setNino] = useState<Nino | null>(null);
  const [apadrinamientos, setApadrinamientos] = useState<Apadrinamiento[]>([]);
  const [padrinosMap, setPadrinosMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const [ninoData, apadrinamientosData, padrinosData] = await Promise.all([
        NinosService.getById(id),
        ApadrinamientosService.getByNino(id),
        PadrinosService.getAll()
      ]);

      setNino(ninoData);
      
      // Filtrar apadrinamientos que tienen padrino válido (no eliminado)
      const padrinosIds = new Set(padrinosData.map(p => p.id_padrino));
      const apadrinamientosValidos = apadrinamientosData.filter(
        (apad) => padrinosIds.has(apad.id_padrino)
      );
      
      setApadrinamientos(apadrinamientosValidos);
      setPadrinosMap(new Map(padrinosData.map(p => [p.id_padrino, p.nombre])));
    } catch (err) {
      toast.error("Error al cargar datos del niño");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs />
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full md:col-span-2" />
        </div>
      </div>
    );
  }

  if (!nino) {
    return (
      <div className="space-y-6">
        <Breadcrumbs />
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Niño no encontrado</p>
            <div className="flex justify-center mt-4">
              <Button onClick={() => navigate("/ninos")}>Volver a la lista</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{nino.nombre}</h1>
          <p className="text-muted-foreground">Detalles del niño beneficiario</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/ninos")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <Button onClick={() => navigate(`/ninos/${id}/editar`)}>
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
              Información
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-square relative overflow-hidden rounded-lg bg-muted flex items-center justify-center mb-4">
              <User className="h-20 w-20 text-muted-foreground" />
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">ID</p>
                <p className="font-mono text-sm">{nino.id_nino}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <Badge variant={nino.estado_apadrinamiento === "Disponible" ? "destructive" : "default"}>
                  {nino.estado_apadrinamiento}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nombre Completo</p>
                <p className="font-medium">{nino.nombre}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Edad</p>
                <p className="font-medium">{nino.edad} años</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Género</p>
                <p className="font-medium">{nino.genero}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Padrino Actual</p>
                <p className="font-medium">
                  {nino.id_padrino_actual
                    ? padrinosMap.get(nino.id_padrino_actual) || "N/A"
                    : "Sin padrino"}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Descripción</p>
              <p className="font-medium">{nino.descripcion || "No especificado"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Necesidades
          </CardTitle>
        </CardHeader>
        <CardContent>
          {nino.necesidades.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {nino.necesidades.map((necesidad, index) => (
                <Badge key={index} variant="secondary">
                  {necesidad}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No hay necesidades registradas</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Apadrinamientos</CardTitle>
        </CardHeader>
        <CardContent>
          {apadrinamientos.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Padrino</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fecha Inicio</TableHead>
                  <TableHead>Fecha Fin</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Entregas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apadrinamientos.map((apad) => (
                  <TableRow key={apad.id_apadrinamiento}>
                    <TableCell className="font-mono text-xs">{apad.id_apadrinamiento}</TableCell>
                    <TableCell>{padrinosMap.get(apad.id_padrino) || "N/A"}</TableCell>
                    <TableCell>{apad.tipo_apadrinamiento}</TableCell>
                    <TableCell>{new Date(apad.fecha_inicio).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {apad.fecha_fin ? new Date(apad.fecha_fin).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={apad.estado_apadrinamiento_registro === "Activo" ? "default" : "outline"}>
                        {apad.estado_apadrinamiento_registro}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{apad.entregas_ids.length}</Badge>
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
