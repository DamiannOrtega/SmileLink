import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Plus, Search, Pencil, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { EventosService, Evento } from "@/services/api";

export default function Eventos() {
  const navigate = useNavigate();
  const location = useLocation();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadEventos();
  }, [location.pathname, location.search]);

  const loadEventos = async () => {
    try {
      setLoading(true);
      const data = await EventosService.getAll();
      setEventos(data);
    } catch (err) {
      toast.error("Error al cargar eventos");
    } finally {
      setLoading(false);
    }
  };

  const filteredEventos = eventos.filter((evento) =>
    evento.nombre_evento.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getEstadoBadge = (estado: Evento["estado_evento"]) => {
    const variants: Record<Evento["estado_evento"], "default" | "secondary" | "outline"> = {
      "Planeado": "outline",
      "Activo": "default",
      "Cerrado": "secondary",
    };
    return <Badge variant={variants[estado]}>{estado}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Eventos</h1>
          <p className="text-muted-foreground">Administra los eventos del programa</p>
        </div>
        <Button onClick={() => navigate("/eventos/nuevo")}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Evento
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Eventos ({filteredEventos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Fecha Inicio</TableHead>
                <TableHead>Fecha Fin</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEventos.map((evento) => (
                <TableRow key={evento.id_evento}>
                  <TableCell className="font-mono text-xs">{evento.id_evento}</TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {evento.nombre_evento}
                    </div>
                  </TableCell>
                  <TableCell>{evento.tipo_evento}</TableCell>
                  <TableCell>{new Date(evento.fecha_inicio).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(evento.fecha_fin).toLocaleDateString()}</TableCell>
                  <TableCell>{getEstadoBadge(evento.estado_evento)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/eventos/${evento.id_evento}/editar`)}
                      title="Editar evento"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
