import { useState, useEffect } from "react";
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
  const [padrinos, setPadrinos] = useState<Padrino[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [padrinoToDelete, setPadrinoToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadPadrinos();
  }, []);

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

  const filteredPadrinos = padrinos
    .filter((padrino) => {
      const matchesSearch = padrino.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        padrino.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const regDate = new Date(padrino.fecha_registro);
      const matchesStart = !startDate || regDate >= new Date(startDate);
      const matchesEnd = !endDate || regDate <= new Date(endDate);
      
      return matchesSearch && matchesStart && matchesEnd;
    })
    .sort((a, b) => {
      if (sortBy === "recent") return new Date(b.fecha_registro).getTime() - new Date(a.fecha_registro).getTime();
      if (sortBy === "oldest") return new Date(a.fecha_registro).getTime() - new Date(b.fecha_registro).getTime();
      if (sortBy === "name_asc") return a.nombre.localeCompare(b.nombre);
      if (sortBy === "name_desc") return b.nombre.localeCompare(a.nombre);
      return 0;
    });

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
      await loadPadrinos();
    } catch (err) {
      toast.error("Error al eliminar padrino");
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

      <Card className="border-border/40 bg-card/60 backdrop-blur-sm shadow-md">
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg font-semibold">Filtros y Búsqueda</CardTitle>
          {(searchTerm || sortBy !== "recent" || startDate || endDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setSortBy("recent");
                setStartDate("");
                setEndDate("");
              }}
              className="text-xs h-8 text-muted-foreground hover:text-foreground"
            >
              Limpiar filtros
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-12">
            <div className="space-y-1.5 sm:col-span-2 md:col-span-3 lg:col-span-6">
              <label className="text-xs font-medium text-muted-foreground">Búsqueda</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 bg-background/50 border-input/60 focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5 sm:col-span-1 lg:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Ordenar por</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input/60 bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors cursor-pointer"
              >
                <option value="recent">Reg. Más reciente</option>
                <option value="oldest">Reg. Más antiguo</option>
                <option value="name_asc">Nombre (A-Z)</option>
                <option value="name_desc">Nombre (Z-A)</option>
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-1 lg:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Registrado Desde</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10 bg-background/50 border-input/60 focus:border-primary transition-colors text-xs"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-1 lg:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Registrado Hasta</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-10 bg-background/50 border-input/60 focus:border-primary transition-colors text-xs"
              />
            </div>
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
