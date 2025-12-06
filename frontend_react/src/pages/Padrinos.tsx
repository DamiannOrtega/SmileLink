import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Plus, Search, Eye, Pencil, Trash2 } from "lucide-react";
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
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { PadrinosService, Padrino } from "@/services/api";

export default function Padrinos() {
  const navigate = useNavigate();
  const location = useLocation();
  const [padrinos, setPadrinos] = useState<Padrino[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [padrinoToDelete, setPadrinoToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadPadrinos();
  }, [location.pathname]);

  const loadPadrinos = async () => {
    try {
      setLoading(true);
      const data = await PadrinosService.getAll();
      setPadrinos(data);
    } catch (err) {
      toast.error("Error al cargar padrinos");
    } finally {
      setLoading(false);
    }
  };

  const filteredPadrinos = padrinos.filter((padrino) =>
    padrino.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    padrino.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string) => {
    setPadrinoToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!padrinoToDelete) return;
    try {
      await PadrinosService.delete(padrinoToDelete);
      toast.success("Padrino eliminado exitosamente");
      setDeleteDialogOpen(false);
      setPadrinoToDelete(null);
      // Recargar la lista
      await loadPadrinos();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error al eliminar padrino";
      toast.error(errorMsg);
    }
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
          <h1 className="text-3xl font-bold text-foreground">Gestión de Padrinos</h1>
          <p className="text-muted-foreground">Administra los padrinos del programa</p>
        </div>
        <Button onClick={() => navigate("/padrinos/nuevo")}>
          <Plus className="mr-2 h-4 w-4" />
          Registrar Padrino
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
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Padrinos ({filteredPadrinos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Fecha Registro</TableHead>
                <TableHead>Apadrinamientos</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPadrinos.map((padrino) => (
                <TableRow key={padrino.id_padrino}>
                  <TableCell className="font-mono text-xs">{padrino.id_padrino}</TableCell>
                  <TableCell className="font-medium">{padrino.nombre}</TableCell>
                  <TableCell>{padrino.email}</TableCell>
                  <TableCell>{padrino.telefono}</TableCell>
                  <TableCell>{new Date(padrino.fecha_registro).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge>{padrino.historial_apadrinamiento_ids.length}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/padrinos/${padrino.id_padrino}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/padrinos/${padrino.id_padrino}/editar`)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(padrino.id_padrino)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="¿Eliminar padrino?"
        description="Esta acción no se puede deshacer."
        onConfirm={confirmDelete}
        confirmText="Eliminar"
      />
    </div>
  );
}
