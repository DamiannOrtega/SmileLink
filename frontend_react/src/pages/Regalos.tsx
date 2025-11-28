import { useState } from "react";
import { Search, Eye, Pencil, Gift } from "lucide-react";
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
import { niñosMock, padrinosMock } from "@/services/mockData";

const regalosMock = [
  {
    id: "1",
    niñoId: "1",
    padrinoId: "1",
    evento: "Navidad 2024",
    descripcion: "Balón de fútbol profesional",
    estado: "Comprado",
  },
  {
    id: "2",
    niñoId: "2",
    padrinoId: "2",
    evento: "Navidad 2024",
    descripcion: "Muñeca y set de libros",
    estado: "Entregado",
  },
];

export default function Regalos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<string>("todos");

  const filteredRegalos = regalosMock.filter((regalo) => {
    const niño = niñosMock.find((n) => n.id === regalo.niñoId);
    const matchesSearch =
      niño?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      regalo.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEstado = estadoFilter === "todos" || regalo.estado === estadoFilter;
    return matchesSearch && matchesEstado;
  });

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div>
        <h1 className="text-3xl font-bold text-foreground">Gestión de Regalos</h1>
        <p className="text-muted-foreground">Administra los regalos del programa</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por niño o descripción..."
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
                <SelectItem value="Pendiente compra">Pendiente compra</SelectItem>
                <SelectItem value="Comprado">Comprado</SelectItem>
                <SelectItem value="Entregado">Entregado</SelectItem>
                <SelectItem value="Verificado">Verificado</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">Limpiar filtros</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Regalos ({filteredRegalos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Niño</TableHead>
                <TableHead>Padrino</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRegalos.map((regalo) => {
                const niño = niñosMock.find((n) => n.id === regalo.niñoId);
                const padrino = padrinosMock.find((p) => p.id === regalo.padrinoId);
                return (
                  <TableRow key={regalo.id}>
                    <TableCell className="font-medium">
                      {niño?.nombre} {niño?.apellidos}
                    </TableCell>
                    <TableCell>
                      {padrino?.nombre} {padrino?.apellidos}
                    </TableCell>
                    <TableCell>{regalo.evento}</TableCell>
                    <TableCell>{regalo.descripcion}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          regalo.estado === "Verificado"
                            ? "default"
                            : regalo.estado === "Entregado"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {regalo.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
