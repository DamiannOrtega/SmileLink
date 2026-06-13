import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { NinosService, Nino, SolicitudesService, SolicitudRegalo } from "@/services/api";

const formSchema = z.object({
  id_nino: z.string().min(1, "Debes seleccionar un niño"),
  descripcion_solicitud: z.string().min(10, "El contenido debe tener al menos 10 caracteres"),
  estado_solicitud: z.enum(["Abierta", "En Proceso", "Cumplida"]),
});

type FormValues = z.infer<typeof formSchema>;

export default function CartaNueva() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const [ninos, setNinos] = useState<Nino[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id_nino: "",
      descripcion_solicitud: "",
      estado_solicitud: "Abierta",
    },
  });

  useEffect(() => {
    loadInitialData();
  }, [id]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const ninosData = await NinosService.getAll();
      setNinos(ninosData);

      if (isEditing && id) {
        const sol = await SolicitudesService.getById(id);
        if (sol) {
          form.reset({
            id_nino: sol.id_nino,
            descripcion_solicitud: sol.descripcion_solicitud,
            estado_solicitud: sol.estado_solicitud,
          });
        }
      }
    } catch (err) {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      if (isEditing && id) {
        await SolicitudesService.update(id, data);
        toast.success("Solicitud actualizada exitosamente");
      } else {
        await SolicitudesService.create(data);
        toast.success("Solicitud registrada exitosamente");
      }
      navigate("/cartas");
    } catch (err) {
      toast.error("Error al guardar la solicitud");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs />
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {isEditing ? "Editar Solicitud" : "Registrar Solicitud"}
          </h1>
          <p className="text-muted-foreground">Cargando formulario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div>
        <h1 className="text-3xl font-bold text-foreground">
          {isEditing ? "Editar Solicitud de Regalo" : "Registrar Solicitud de Regalo"}
        </h1>
        <p className="text-muted-foreground">
          {isEditing ? "Actualiza los datos de la solicitud" : "Ingresa los deseos y peticiones de regalo del niño"}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información de la Solicitud / Carta de Deseos</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <FormField
                control={form.control}
                name="id_nino"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Niño</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isEditing}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un niño" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ninos.map((niño) => (
                          <SelectItem key={niño.id_nino} value={niño.id_nino}>
                            {niño.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="descripcion_solicitud"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción de la Solicitud / Deseos</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Escribe aquí los deseos, juguetes o necesidades escolares que solicita el niño..."
                        className="min-h-[200px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estado_solicitud"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Abierta">Abierta</SelectItem>
                        <SelectItem value="En Proceso">En Proceso</SelectItem>
                        <SelectItem value="Cumplida">Cumplida</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit">Guardar Solicitud</Button>
            <Button type="button" variant="outline" onClick={() => navigate("/cartas")}>
              Cancelar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
