import { useState, useEffect } from "react";
import { Plus, Search, Eye, Pencil, Trash2, Loader2, User } from "lucide-react";
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

    // Estados para datos
    const [ninos, setNinos] = useState<Nino[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Estados para filtros
    const [searchTerm, setSearchTerm] = useState("");
    const [estadoFilter, setEstadoFilter] = useState<string>("todos");
    const [generoFilter, setGeneroFilter] = useState<string>("todos");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [sortBy, setSortBy] = useState("name_asc");

    // Estados para diálogo de eliminación
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [ninoToDelete, setNinoToDelete] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    // ✅ CARGAR DATOS AL MONTAR EL COMPONENTE
    useEffect(() => {
        loadNinos();
    }, []);

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
    const filteredNinos = ninos
        .filter((nino) => {
            const matchesSearch = nino.nombre.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesEstado = estadoFilter === "todos" || nino.estado_apadrinamiento === estadoFilter;
            const matchesGenero = generoFilter === "todos" || nino.genero === generoFilter;
            
            const apadrinamientoDate = nino.fecha_apadrinamiento_actual ? new Date(nino.fecha_apadrinamiento_actual) : null;
            const matchesStart = !startDate || (apadrinamientoDate && apadrinamientoDate >= new Date(startDate));
            const matchesEnd = !endDate || (apadrinamientoDate && apadrinamientoDate <= new Date(endDate));
            
            return matchesSearch && matchesEstado && matchesGenero && matchesStart && matchesEnd;
        })
        .sort((a, b) => {
            if (sortBy === "name_asc") return a.nombre.localeCompare(b.nombre);
            if (sortBy === "name_desc") return b.nombre.localeCompare(a.nombre);
            if (sortBy === "age_asc") return a.edad - b.edad;
            if (sortBy === "age_desc") return b.edad - a.edad;
            if (sortBy === "date_desc") {
                const dateA = a.fecha_apadrinamiento_actual ? new Date(a.fecha_apadrinamiento_actual).getTime() : 0;
                const dateB = b.fecha_apadrinamiento_actual ? new Date(b.fecha_apadrinamiento_actual).getTime() : 0;
                return dateB - dateA;
            }
            if (sortBy === "date_asc") {
                const dateA = a.fecha_apadrinamiento_actual ? new Date(a.fecha_apadrinamiento_actual).getTime() : 0;
                const dateB = b.fecha_apadrinamiento_actual ? new Date(b.fecha_apadrinamiento_actual).getTime() : 0;
                return dateA - dateB;
            }
            return 0;
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
        setStartDate("");
        setEndDate("");
        setSortBy("name_asc");
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

            <Card className="border-border/40 bg-card/60 backdrop-blur-sm shadow-md">
                <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-lg font-semibold">Filtros y Búsqueda</CardTitle>
                    {(searchTerm || estadoFilter !== "todos" || generoFilter !== "todos" || sortBy !== "name_asc" || startDate || endDate) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearFilters}
                            className="text-xs h-8 text-muted-foreground hover:text-foreground"
                        >
                            Limpiar filtros
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-12">
                        <div className="space-y-1.5 sm:col-span-2 md:col-span-3 lg:col-span-3">
                            <label className="text-xs font-medium text-muted-foreground">Búsqueda</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por nombre..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 h-10 bg-background/50 border-input/60 focus:border-primary transition-colors"
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-1.5 sm:col-span-1 lg:col-span-2">
                            <label className="text-xs font-medium text-muted-foreground">Estado</label>
                            <select
                                value={estadoFilter}
                                onChange={(e) => setEstadoFilter(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input/60 bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors cursor-pointer"
                            >
                                <option value="todos">Todos los estados</option>
                                <option value="Disponible">Disponible</option>
                                <option value="Apadrinado">Apadrinado</option>
                            </select>
                        </div>

                        <div className="space-y-1.5 sm:col-span-1 lg:col-span-1">
                            <label className="text-xs font-medium text-muted-foreground">Género</label>
                            <select
                                value={generoFilter}
                                onChange={(e) => setGeneroFilter(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input/60 bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors cursor-pointer"
                            >
                                <option value="todos">Todos</option>
                                <option value="Masculino">Masculino</option>
                                <option value="Femenino">Femenino</option>
                            </select>
                        </div>

                        <div className="space-y-1.5 sm:col-span-1 lg:col-span-2">
                            <label className="text-xs font-medium text-muted-foreground">Ordenar por</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input/60 bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors cursor-pointer"
                            >
                                <option value="name_asc">Nombre (A-Z)</option>
                                <option value="name_desc">Nombre (Z-A)</option>
                                <option value="age_asc">Edad (Menor a Mayor)</option>
                                <option value="age_desc">Edad (Mayor a Menor)</option>
                                <option value="date_desc">Apadrinado (Reciente)</option>
                                <option value="date_asc">Apadrinado (Antiguo)</option>
                            </select>
                        </div>

                        <div className="space-y-1.5 sm:col-span-1 lg:col-span-2">
                            <label className="text-xs font-medium text-muted-foreground">Apadrinado Desde</label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="h-10 bg-background/50 border-input/60 focus:border-primary transition-colors text-xs"
                            />
                        </div>

                        <div className="space-y-1.5 sm:col-span-1 lg:col-span-2">
                            <label className="text-xs font-medium text-muted-foreground">Apadrinado Hasta</label>
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
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                {nino.foto ? (
                                                    <img
                                                        src={nino.foto}
                                                        alt={nino.nombre}
                                                        className="h-8 w-8 rounded-full object-cover border border-border bg-background"
                                                    />
                                                ) : (
                                                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center border border-border">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                )}
                                                <span>{nino.nombre}</span>
                                            </div>
                                        </TableCell>
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
