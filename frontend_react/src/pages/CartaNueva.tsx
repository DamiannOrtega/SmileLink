import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNotificationEvents } from "@/hooks/useNotifications";
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
import { getCartaById, niñosMock, eventosMock } from "@/services/mockData";
import { useEffect } from "react";

const formSchema = z.object({
  niñoId: z.string().min(1, "Debes seleccionar un niño"),
  eventoId: z.string().min(1, "Debes seleccionar un evento"),
  contenido: z.string().min(10, "El contenido debe tener al menos 10 caracteres"),
  estado: z.enum(["Pendiente", "Revisada", "Aprobada", "Rechazada"]),
});

type FormValues = z.infer<typeof formSchema>;

export default function CartaNueva() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const { showNotification } = useNotificationEvents();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      niñoId: "",
      eventoId: "",
      contenido: "",
      estado: "Pendiente",
    },
  });

  useEffect(() => {
    if (isEditing && id) {
      const carta = getCartaById(id);
      if (carta) {
        form.reset({
          niñoId: carta.niñoId,
          eventoId: carta.eventoId,
          contenido: carta.contenido,
          estado: carta.estado,
        });
      }
    }
  }, [isEditing, id, form]);

  const onSubmit = (data: FormValues) => {
    console.log(isEditing ? "Editando carta:" : "Nueva carta:", data);
    toast.success(isEditing ? "Carta actualizada exitosamente" : "Carta registrada exitosamente");
    
    if (!isEditing) {
      // Mostrar notificación si está habilitada
      showNotification(
        "info",
        "Nueva Solicitud de Regalo",
        `Nueva solicitud creada: ${data.descripcion_solicitud.substring(0, 50)}...`
      );
    }
    
    navigate("/cartas");
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div>
        <h1 className="text-3xl font-bold text-foreground">
          {isEditing ? "Editar Carta" : "Registrar Carta"}
        </h1>
        <p className="text-muted-foreground">
          {isEditing ? "Actualiza los datos de la carta" : "Ingresa los datos de la nueva carta de deseos"}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información de la Carta</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <FormField
                control={form.control}
                name="niñoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Niño</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un niño" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {niñosMock.map((niño) => (
                          <SelectItem key={niño.id} value={niño.id}>
                            {niño.nombre} {niño.apellidos}
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
                name="eventoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Evento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un evento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {eventosMock.map((evento) => (
                          <SelectItem key={evento.id} value={evento.id}>
                            {evento.nombre}
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
                name="contenido"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contenido de la Carta</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Escribe aquí los deseos y peticiones del niño..."
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
                name="estado"
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
                        <SelectItem value="Pendiente">Pendiente</SelectItem>
                        <SelectItem value="Revisada">Revisada</SelectItem>
                        <SelectItem value="Aprobada">Aprobada</SelectItem>
                        <SelectItem value="Rechazada">Rechazada</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit">Guardar Carta</Button>
            <Button type="button" variant="outline" onClick={() => navigate("/cartas")}>
              Cancelar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
