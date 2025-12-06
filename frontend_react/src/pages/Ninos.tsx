import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Plus, Search, Eye, Pencil, Trash2, Loader2 } from "lucide-react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useNavigate } from "react-router-dom";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

// ✅ IMPORTAR DESDE EL NUEVO SERVICE LAYER
import { NinosService, Nino } from "@/services/api";

export default function NinosRefactored() {
    const navigate = useNavigate();
    const location = useLocation();

    // Estados para datos
    const [ninos, setNinos] = useState<Nino[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Estados para filtros
    const [searchTerm, setSearchTerm] = useState("");
    const [estadoFilter, setEstadoFilter] = useState<string>("todos");
    const [generoFilter, setGeneroFilter] = useState<string>("todos");

    // Estados para diálogo de eliminación
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [ninoToDelete, setNinoToDelete] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    // ✅ CARGAR DATOS AL MONTAR EL COMPONENTE Y CUANDO SE VUELVE A LA PÁGINA
    useEffect(() => {
        loadNinos();
    }, [location.pathname]);

    const loadNinos = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await NinosService.getAll();
            setNinos(data);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Error al cargar niños";
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    // Filtrado de niños
    const filteredNinos = ninos.filter((nino) => {
        const matchesSearch = nino.nombre.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesEstado = estadoFilter === "todos" || nino.estado_apadrinamiento === estadoFilter;
        const matchesGenero = generoFilter === "todos" || nino.genero === generoFilter;
        return matchesSearch && matchesEstado && matchesGenero;
    });

    const getEstadoBadge = (estado: Nino["estado_apadrinamiento"]) => {
        const variants: Record<Nino["estado_apadrinamiento"], "default" | "destructive"> = {
            "Disponible": "destructive",
            "Apadrinado": "default",
        };
        return <Badge variant={variants[estado]}>{estado}</Badge>;
    };

    const handleDelete = (id: string) => {
        setNinoToDelete(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!ninoToDelete) return;

        try {
            setDeleting(true);
            await NinosService.delete(ninoToDelete);
            toast.success("Niño eliminado exitosamente");
            setDeleteDialogOpen(false);
            setNinoToDelete(null);
            // Recargar la lista
            await loadNinos();
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Error al eliminar niño";
            toast.error(errorMsg);
        } finally {
            setDeleting(false);
        }
    };

    const handleClearFilters = () => {
        setSearchTerm("");
        setEstadoFilter("todos");
        setGeneroFilter("todos");
    };

    // ✅ SKELETON LOADING STATE
    if (loading) {
        return (
            <div className="space-y-6">
                <Breadcrumbs />

                <div className="flex items-center justify-between">
                    <div>
                        <Skeleton className="h-9 w-64 mb-2" />
                        <Skeleton className="h-5 w-96" />
                    </div>
                    <Skeleton className="h-10 w-40" />
                </div>

                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-24" />
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Skeleton key={i} className="h-16 w-full" />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // ✅ ERROR STATE
    if (error) {
        return (
            <div className="space-y-6">
                <Breadcrumbs />
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center py-12">
                            <p className="text-destructive text-lg mb-4">❌ {error}</p>
                            <Button onClick={loadNinos}>Reintentar</Button>
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
                    <h1 className="text-3xl font-bold text-foreground">Gestión de Niños</h1>
                    <p className="text-muted-foreground">Administra los niños beneficiarios del programa</p>
                </div>
                <Button onClick={() => navigate("/ninos/nuevo")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Registrar Niño
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Filtros</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nombre..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">Todos los estados</SelectItem>
                                <SelectItem value="Disponible">Disponible</SelectItem>
                                <SelectItem value="Apadrinado">Apadrinado</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={generoFilter} onValueChange={setGeneroFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Género" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">Todos</SelectItem>
                                <SelectItem value="Masculino">Masculino</SelectItem>
                                <SelectItem value="Femenino">Femenino</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" onClick={handleClearFilters}>
                            Limpiar filtros
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Lista de Niños ({filteredNinos.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredNinos.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            No se encontraron niños con los filtros aplicados
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Edad</TableHead>
                                    <TableHead>Género</TableHead>
                                    <TableHead>Descripción</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredNinos.map((nino) => (
                                    <TableRow key={nino.id_nino}>
                                        <TableCell className="font-mono text-xs">{nino.id_nino}</TableCell>
                                        <TableCell className="font-medium">{nino.nombre}</TableCell>
                                        <TableCell>{nino.edad} años</TableCell>
                                        <TableCell>{nino.genero}</TableCell>
                                        <TableCell className="max-w-xs truncate">{nino.descripcion}</TableCell>
                                        <TableCell>{getEstadoBadge(nino.estado_apadrinamiento)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => navigate(`/ninos/${nino.id_nino}`)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => navigate(`/ninos/${nino.id_nino}/editar`)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(nino.id_nino)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <ConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="¿Eliminar niño?"
                description="Esta acción no se puede deshacer. El niño será eliminado permanentemente del sistema."
                onConfirm={confirmDelete}
                confirmText={deleting ? "Eliminando..." : "Eliminar"}
            />
        </div>
    );
}
