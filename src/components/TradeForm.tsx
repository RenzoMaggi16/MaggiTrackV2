import { useState, ChangeEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Combobox } from "@/components/ui/combobox";

// Lista de símbolos predefinidos
const simbolosOptions = [
  { value: "NAS100", label: "NAS100" },
  { value: "SP500", label: "SP500" },
  { value: "US30", label: "US30" },
  { value: "XAUUSD", label: "XAUUSD" },
  { value: "EURUSD", label: "EURUSD" },
  { value: "GBPUSD", label: "GBPUSD" },
  { value: "AUDUSD", label: "AUDUSD" },
];

// Opciones para Ciclo Diario
const cicloDiarioOptions = [
  { value: "iman invertido", label: "Imán invertido" },
  { value: "corona de londres", label: "Corona de Londres" },
  { value: "paraiso tendencial", label: "Paraíso tendencial" },
  { value: "latigazo magnetico", label: "Latigazo magnético" },
];

// Opciones para Inducción
const induccionOptions = [
  { value: "Menor", label: "Menor" },
  { value: "Media", label: "Media" },
  { value: "Mayor", label: "Mayor" },
];

// Opciones para Liquidez
const liquidezOptions = [
  { value: "2TT", label: "2TT" },
  { value: "3TT", label: "3TT" },
  { value: "ASIA H-L", label: "ASIA H-L" },
  { value: "2EQL-H", label: "2EQL-H" },
  { value: "3EQL-H", label: "3EQL-H" },
  { value: "B&R", label: "B&R" },
];

// Opciones para Tipo de Entrada
const tipoEntradaOptions = [
  { value: "RBOS 1M", label: "RBOS 1M" },
  { value: "LET", label: "LET" },
  { value: "EDM", label: "EDM" },
  { value: "Volumen en Inductor", label: "Volumen en Inductor" },
  { value: "LET+EDM", label: "LET+EDM" },
  { value: "Vol + LET", label: "Vol + LET" },
  { value: "Vol + EDM", label: "Vol + EDM" },
  { value: "R BOS 1M+LET", label: "R BOS 1M+LET" },
  { value: "R BOS 1M + EDM", label: "R BOS 1M + EDM" },
  { value: "M5 Limit", label: "M5 Limit" },
];

// Opciones para Emoción
const emocionOptions = [
  { value: "Confianza", label: "Confianza" },
  { value: "Paciencia", label: "Paciencia" },
  { value: "Euforia", label: "Euforia" },
  { value: "Neutral", label: "Neutral" },
  { value: "Ansiedad", label: "Ansiedad" },
  { value: "Miedo", label: "Miedo" },
  { value: "Frustración", label: "Frustración" },
  { value: "Venganza", label: "Venganza" },
];

export const TradeForm = () => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().slice(0, 16),
    simbolo: "",
    pnl_neto: "",
    entrada: "",
    salida: "",
    cantidad: "",
    notas: "",
    reglas_cumplidas: true,
    // Nuevos campos
    rr: "",
    ciclo_diario: "",
    induccion: "",
    liquidez: "",
    tipo_entrada: "",
    parcial_porcentaje: "",
    emocion: "", // Nuevo campo para emoción
    imagenes: [] as File[],
  });

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setFormData({ ...formData, imagenes: filesArray });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("Debes iniciar sesión");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("trades").insert({
      user_id: user.id,
      fecha: formData.fecha,
      simbolo: formData.simbolo.toUpperCase(),
      pnl_neto: parseFloat(formData.pnl_neto),
      entrada: formData.entrada ? parseFloat(formData.entrada) : null,
      salida: formData.salida ? parseFloat(formData.salida) : null,
      cantidad: formData.cantidad ? parseFloat(formData.cantidad) : null,
      notas: formData.notas || null,
      reglas_cumplidas: formData.reglas_cumplidas,
      // Nuevos campos
      rr: formData.rr || null,
      ciclo_diario: formData.ciclo_diario || null,
      induccion: formData.induccion || null,
      liquidez: formData.liquidez || null,
      tipo_entrada: formData.tipo_entrada || null,
      parcial_porcentaje: formData.parcial_porcentaje ? parseFloat(formData.parcial_porcentaje) : null,
      emocion: formData.emocion || null, // Nuevo campo para emoción
    });

    if (error) {
      toast.error("Error al registrar operación");
      console.error(error);
    } else {
      toast.success("Operación registrada");
      setFormData({
        fecha: new Date().toISOString().slice(0, 16),
        simbolo: "",
        pnl_neto: "",
        entrada: "",
        salida: "",
        cantidad: "",
        notas: "",
        reglas_cumplidas: true,
        // Nuevos campos
        rr: "",
        ciclo_diario: "",
        induccion: "",
        liquidez: "",
        tipo_entrada: "",
        parcial_porcentaje: "",
        emocion: "", // Reiniciar el campo de emoción
        imagenes: [],
      });
      queryClient.invalidateQueries({ queryKey: ["trades"] });
    }
    
    setLoading(false);
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>Registrar Operación</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha y Hora</Label>
              <Input
                id="fecha"
                type="datetime-local"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                required
                className="bg-secondary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="simbolo">Símbolo</Label>
              <Combobox
                options={simbolosOptions}
                value={formData.simbolo}
                onChange={(value) => setFormData({ ...formData, simbolo: value })}
                placeholder="Seleccionar símbolo..."
                emptyMessage="No se encontraron símbolos."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pnl">PnL Neto *</Label>
              <Input
                id="pnl"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.pnl_neto}
                onChange={(e) => setFormData({ ...formData, pnl_neto: e.target.value })}
                required
                className="bg-secondary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cantidad">Cantidad</Label>
              <Input
                id="cantidad"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.cantidad}
                onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                className="bg-secondary"
              />
            </div>

            {/* Campo RR modificado a Input normal */}
            <div className="space-y-2">
              <Label htmlFor="rr">RR (Risk/Reward)</Label>
              <Input
                id="rr"
                type="text"
                placeholder="ej. 1:3"
                value={formData.rr}
                onChange={(e) => setFormData({ ...formData, rr: e.target.value })}
                className="bg-secondary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ciclo_diario">Ciclo Diario</Label>
              <Combobox
                options={cicloDiarioOptions}
                value={formData.ciclo_diario}
                onChange={(value) => setFormData({ ...formData, ciclo_diario: value })}
                placeholder="Seleccionar ciclo..."
                emptyMessage="No se encontraron opciones."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="induccion">Inducción</Label>
              <Combobox
                options={induccionOptions}
                value={formData.induccion}
                onChange={(value) => setFormData({ ...formData, induccion: value })}
                placeholder="Seleccionar inducción..."
                emptyMessage="No se encontraron opciones."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="liquidez">Liquidez</Label>
              <Combobox
                options={liquidezOptions}
                value={formData.liquidez}
                onChange={(value) => setFormData({ ...formData, liquidez: value })}
                placeholder="Seleccionar liquidez..."
                emptyMessage="No se encontraron opciones."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_entrada">Tipo de Entrada</Label>
              <Combobox
                options={tipoEntradaOptions}
                value={formData.tipo_entrada}
                onChange={(value) => setFormData({ ...formData, tipo_entrada: value })}
                placeholder="Seleccionar tipo..."
                emptyMessage="No se encontraron opciones."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emocion">Emoción</Label>
              <Combobox
                options={emocionOptions}
                value={formData.emocion}
                onChange={(value) => setFormData({ ...formData, emocion: value })}
                placeholder="Seleccionar emoción..."
                emptyMessage="No se encontraron opciones."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parcial_porcentaje">% Parcial</Label>
              <Input
                id="parcial_porcentaje"
                type="number"
                step="1"
                placeholder="ej. 50"
                value={formData.parcial_porcentaje}
                onChange={(e) => setFormData({ ...formData, parcial_porcentaje: e.target.value })}
                className="bg-secondary"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea
              id="notas"
              placeholder="Observaciones de la operación..."
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              className="bg-secondary min-h-[80px]"
            />
          </div>

          {/* Nuevo campo para subir imágenes */}
          <div className="space-y-2">
            <Label htmlFor="imagenes">Imágenes</Label>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="imagenes"
                className="flex flex-col items-center justify-center w-full h-[80px] bg-secondary border-2 border-dashed rounded-md cursor-pointer hover:bg-secondary/80 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <p className="text-sm text-muted-foreground">
                    {formData.imagenes.length > 0 
                      ? `${formData.imagenes.length} archivo(s) seleccionado(s)` 
                      : "Adjuntar Imágenes del Trade"}
                  </p>
                </div>
                <input
                  id="imagenes"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="reglas"
              checked={formData.reglas_cumplidas}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, reglas_cumplidas: checked as boolean })
              }
            />
            <Label htmlFor="reglas" className="cursor-pointer">
              Cumplí mis reglas de trading
            </Label>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Guardando..." : "Registrar Operación"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
