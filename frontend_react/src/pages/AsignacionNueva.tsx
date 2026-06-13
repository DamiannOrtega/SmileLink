import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
import { Loader2, Check, ChevronsUpDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  ApadrinamientosService,
  NinosService,
  PadrinosService,
  Nino,
  Padrino
} from "@/services/api";

export default function AsignacionNueva() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ninos, setNinos] = useState<Nino[]>([]);
  const [padrinos, setPadrinos] = useState<Padrino[]>([]);
  const [openNino, setOpenNino] = useState(false);
  const [openPadrino, setOpenPadrino] = useState(false);

  const [formData, setFormData] = useState({
    id_nino: "",
    id_padrino: "",
    tipo_apadrinamiento: "" as "Aleatorio" | "Elección Padrino" | "",
    estado_apadrinamiento_registro: "Activo" as "Activo" | "Finalizado",
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ninosData, padrinosData] = await Promise.all([
        NinosService.getAll(),
        PadrinosService.getAll()
      ]);

      setPadrinos(padrinosData);

      if (isEditing && id) {
        const asignacion = await ApadrinamientosService.getById(id);
        if (!asignacion) {
          toast.error("Asignación no encontrada");
          navigate("/asignaciones");
          return;
        }

        const ninoActual = ninosData.find((n) => n.id_nino === asignacion.id_nino);
        const disponibles = ninosData.filter((n) => n.estado_apadrinamiento === "Disponible");
        const ninosParaSelect =
          ninoActual && !disponibles.some((n) => n.id_nino === ninoActual.id_nino)
            ? [ninoActual, ...disponibles]
            : disponibles;

        setNinos(ninosParaSelect);
        setFormData({
          id_nino: asignacion.id_nino,
          id_padrino: asignacion.id_padrino,
          tipo_apadrinamiento: asignacion.tipo_apadrinamiento,
          estado_apadrinamiento_registro: asignacion.estado_apadrinamiento_registro,
        });
      } else {
        setNinos(ninosData.filter((n) => n.estado_apadrinamiento === "Disponible"));
      }
    } catch {
      toast.error("Error al cargar datos");
      if (isEditing) navigate("/asignaciones");
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

      if (isEditing && id) {
        const asignacionActualizada = await ApadrinamientosService.update(id, {
          tipo_apadrinamiento: formData.tipo_apadrinamiento,
          estado_apadrinamiento_registro: formData.estado_apadrinamiento_registro,
        });

        toast.success("Asignación actualizada exitosamente");
        navigate(`/asignaciones/${asignacionActualizada.id_apadrinamiento || id}`);
      } else {
        const nuevaAsignacion = await ApadrinamientosService.create({
          id_nino: formData.id_nino,
          id_padrino: formData.id_padrino,
          fecha_inicio: new Date().toISOString().split("T")[0],
          tipo_apadrinamiento: formData.tipo_apadrinamiento,
          estado_apadrinamiento_registro: "Activo",
          entregas_ids: [],
        });

        await NinosService.update(formData.id_nino, {
          estado_apadrinamiento: "Apadrinado",
          id_padrino_actual: formData.id_padrino,
          fecha_apadrinamiento_actual: new Date().toISOString().split("T")[0],
        });

        toast.success("Asignación creada exitosamente");
        navigate(`/asignaciones/${nuevaAsignacion.id_apadrinamiento}`);
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : isEditing
            ? "Error al actualizar asignación"
            : "Error al crear asignación";
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
        <h1 className="text-3xl font-bold text-foreground">
          {isEditing ? "Editar Asignación" : "Nueva Asignación"}
        </h1>
        <p className="text-muted-foreground">
          {isEditing
            ? "Modifica los datos del apadrinamiento y guarda los cambios"
            : "Crea un nuevo apadrinamiento entre un niño y un padrino"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información de la Asignación</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 flex flex-col">
              <Label htmlFor="id_nino" className="mb-1">
                Niño <span className="text-destructive">*</span>
              </Label>
              {isEditing ? (
                <div className="p-2 border rounded-md bg-muted text-muted-foreground text-sm font-medium">
                  {ninos.find((n) => n.id_nino === formData.id_nino)?.nombre || "Cargando..."}
                </div>
              ) : (
                <Popover open={openNino} onOpenChange={setOpenNino}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openNino}
                      className="w-full justify-between font-normal text-left"
                      disabled={isEditing}
                    >
                      {formData.id_nino
                        ? ninos.find((n) => n.id_nino === formData.id_nino)?.nombre +
                          ` (${ninos.find((n) => n.id_nino === formData.id_nino)?.edad} años)`
                        : "Selecciona un niño"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command className="w-full">
                      <CommandInput placeholder="Buscar niño por nombre o edad..." className="h-9" />
                      <CommandList>
                        <CommandEmpty>No se encontraron niños.</CommandEmpty>
                        <CommandGroup>
                          {ninos.map((nino) => (
                            <CommandItem
                              key={nino.id_nino}
                              value={`${nino.nombre} ${nino.edad} años ${nino.id_nino}`.toLowerCase()}
                              onSelect={() => {
                                setFormData((prev) => ({ ...prev, id_nino: nino.id_nino }));
                                setOpenNino(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.id_nino === nino.id_nino ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {nino.nombre} ({nino.edad} años)
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
              {isEditing && (
                <p className="text-xs text-muted-foreground mt-1">
                  El niño asignado no se puede cambiar en una asignación existente
                </p>
              )}
            </div>

            <div className="space-y-2 flex flex-col">
              <Label htmlFor="id_padrino" className="mb-1">
                Padrino <span className="text-destructive">*</span>
              </Label>
              {isEditing ? (
                <div className="p-2 border rounded-md bg-muted text-muted-foreground text-sm font-medium">
                  {padrinos.find((p) => p.id_padrino === formData.id_padrino)?.nombre || "Cargando..."}
                </div>
              ) : (
                <Popover open={openPadrino} onOpenChange={setOpenPadrino}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openPadrino}
                      className="w-full justify-between font-normal text-left"
                      disabled={isEditing}
                    >
                      {formData.id_padrino
                        ? padrinos.find((p) => p.id_padrino === formData.id_padrino)?.nombre +
                          ` (${padrinos.find((p) => p.id_padrino === formData.id_padrino)?.email})`
                        : "Selecciona un padrino"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command className="w-full">
                      <CommandInput placeholder="Buscar padrino por nombre o correo..." className="h-9" />
                      <CommandList>
                        <CommandEmpty>No se encontraron padrinos.</CommandEmpty>
                        <CommandGroup>
                          {padrinos.map((padrino) => (
                            <CommandItem
                              key={padrino.id_padrino}
                              value={`${padrino.nombre} ${padrino.email} ${padrino.id_padrino}`.toLowerCase()}
                              onSelect={() => {
                                setFormData((prev) => ({ ...prev, id_padrino: padrino.id_padrino }));
                                setOpenPadrino(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.id_padrino === padrino.id_padrino ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {padrino.nombre} ({padrino.email})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
              {isEditing && (
                <p className="text-xs text-muted-foreground mt-1">
                  El padrino asignado no se puede cambiar en una asignación existente
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">
                Tipo de Apadrinamiento <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.tipo_apadrinamiento}
                onValueChange={(value: "Aleatorio" | "Elección Padrino") =>
                  setFormData((prev) => ({ ...prev, tipo_apadrinamiento: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Elección Padrino">Elección Padrino</SelectItem>
                  <SelectItem value="Aleatorio">Aleatorio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isEditing && (
              <div className="space-y-2">
                <Label htmlFor="estado">
                  Estado <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.estado_apadrinamiento_registro}
                  onValueChange={(value: "Activo" | "Finalizado") =>
                    setFormData((prev) => ({ ...prev, estado_apadrinamiento_registro: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Activo">Activo</SelectItem>
                    <SelectItem value="Finalizado">Finalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

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
                    {isEditing ? "Guardando..." : "Creando..."}
                  </>
                ) : isEditing ? (
                  "Guardar Cambios"
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
