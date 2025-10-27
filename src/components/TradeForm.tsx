import { useState, useEffect, ChangeEvent, FormEvent } from "react"; // Added FormEvent
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner"; // Assuming you use sonner for toasts
import { useQueryClient } from "@tanstack/react-query";
import { Combobox } from "@/components/ui/combobox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// --- Types (Define these properly if you have them elsewhere) ---
interface Strategy {
  id: string;
  name: string;
}
interface Rule {
  id: string;
  rule_text: string;
  strategy_id: string;
}
// --- End Types ---


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

  // Estados para fecha y hora
  const [tradeDate, setTradeDate] = useState<Date | undefined>(new Date());
  const [entryTimeString, setEntryTimeString] = useState<string>('09:00:00');
  const [exitTimeString, setExitTimeString] = useState<string>('10:00:00');

  // Estados para notas y calificación
  const [preTradeNotes, setPreTradeNotes] = useState<string>('');
  const [postTradeNotes, setPostTradeNotes] = useState<string>('');
  const [setupRating, setSetupRating] = useState<string>(''); // Estado para Setup Rating

  // Estados para estrategias y reglas
  const [strategies, setStrategies] = useState<Strategy[]>([]); // Usar el tipo Strategy
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);
  const [rulesForStrategy, setRulesForStrategy] = useState<Rule[]>([]); // Usar el tipo Rule
  const [brokenRuleIds, setBrokenRuleIds] = useState<string[]>([]);
  const [loadingRules, setLoadingRules] = useState(false);

  // Estados para cuentas
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>(undefined);

  // Estado unificado para otros campos del formulario
  const [formData, setFormData] = useState({
    par: "", // Renombrado de simbolo
    pnl_neto: "",
    riesgo: "", // Nuevo campo, reemplaza cantidad
    emocion: "",
    trade_type: "buy" as "buy" | "sell",
    reglas_cumplidas: true, // Renombrado de broken_rules? Mejor mantenerlo simple
    imagenes: [] as File[], // Estado para imágenes
  });

  // --- Handlers ---
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleComboboxChange = (id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleRadioChange = (value: "buy" | "sell") => {
    setFormData((prev) => ({ ...prev, trade_type: value }));
  };

  const handleCheckboxChange = (checked: boolean | 'indeterminate') => {
     // Si necesitas hacer algo específico con el checkbox 'reglas_cumplidas'
     // Aunque ahora se maneja con brokenRuleIds, mantenemos este por si acaso
    setFormData((prev) => ({ ...prev, reglas_cumplidas: !!checked }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData((prev) => ({ ...prev, imagenes: Array.from(e.target.files!) }));
    }
  };
  // --- Fin Handlers ---


  // Efecto para cargar las estrategias
  useEffect(() => {
    const fetchStrategies = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return; // Salir si no hay usuario

      const { data, error } = await supabase
        .from('strategies')
        .select('id, name')
        .eq('user_id', user.id)
        .order('name'); // Ordenar por nombre

      if (error) {
        console.error("Error fetching strategies:", error);
        toast.error("No se pudieron cargar las estrategias");
      } else {
        setStrategies(data || []);
      }
    };
    fetchStrategies();
  }, []); // Dependencia vacía para ejecutar solo al montar

  // Efecto para cargar las cuentas del usuario
  useEffect(() => {
    const fetchAccounts = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data, error } = await supabase
        .from('accounts')
        .select('id, account_name')
        .eq('user_id', user.id)
        .order('account_name');

      if (error) {
        console.error("Error fetching accounts:", error);
        toast.error("No se pudieron cargar las cuentas");
      } else {
        setAccounts(data || []);
      }
    };
    fetchAccounts();
  }, []);

  // Efecto para cargar las reglas cuando cambia la estrategia seleccionada
  useEffect(() => {
    const fetchRules = async () => {
      if (!selectedStrategyId) {
        setRulesForStrategy([]);
        setBrokenRuleIds([]);
        return;
      }
      setLoadingRules(true);
      const { data, error } = await supabase
        .from('rules')
        .select('id, rule_text') // Seleccionar solo lo necesario
        .eq('strategy_id', selectedStrategyId)
        .order('created_at'); // Ordenar por creación

      if (error) {
        console.error("Error fetching rules:", error);
        toast.error("No se pudieron cargar las reglas para esta estrategia");
        setRulesForStrategy([]);
      } else {
        setRulesForStrategy(data || []);
      }
      setBrokenRuleIds([]); // Limpiar selección al cambiar estrategia
      setLoadingRules(false);
    };
    fetchRules();
  }, [selectedStrategyId]); // Se ejecuta cuando selectedStrategyId cambia

  // --- handleSubmit Corregido ---
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Debes iniciar sesión para registrar una operación.");
        setLoading(false);
        return;
      }

      // Validación de cuenta seleccionada
      if (!selectedAccountId) {
        toast.error("Debes seleccionar una cuenta.");
        setLoading(false);
        return;
      }

      // Validación de fecha y hora
      if (!tradeDate || !entryTimeString || !exitTimeString) {
        toast.error("Faltan datos de fecha/hora.");
        setLoading(false);
        return;
      }

      // Combinar Fecha y Hora de Entrada
      const [entryHours, entryMinutes, entrySeconds] = entryTimeString.split(':').map(Number);
      const entryTimestamp = new Date(tradeDate);
      entryTimestamp.setHours(entryHours, entryMinutes, entrySeconds || 0);

      // Combinar Fecha y Hora de Salida
      const [exitHours, exitMinutes, exitSeconds] = exitTimeString.split(':').map(Number);
      const exitTimestamp = new Date(tradeDate);
      exitTimestamp.setHours(exitHours, exitMinutes, exitSeconds || 0);

      if (exitTimestamp < entryTimestamp) {
        exitTimestamp.setDate(exitTimestamp.getDate() + 1);
      }

      const riskAmount = parseFloat(formData.riesgo);
      const pnlAmount = parseFloat(formData.pnl_neto);

      // 1. Insertar el Trade Principal
      const { data: tradeData, error: tradeError } = await supabase
        .from('trades')
        .insert({
          user_id: user.id,
          account_id: selectedAccountId, // Guardar la cuenta
          entry_time: entryTimestamp.toISOString(),
          exit_time: exitTimestamp.toISOString(),
          par: formData.par.toUpperCase() || null, // Guardar par (renombrado de simbolo)
          pnl_neto: !isNaN(pnlAmount) ? pnlAmount : 0,
          riesgo: !isNaN(riskAmount) ? riskAmount : null, // Guardar riesgo
          emocion: formData.emocion || null,
          trade_type: formData.trade_type,
          setup_rating: setupRating || null,
          pre_trade_notes: preTradeNotes || null,
          post_trade_notes: postTradeNotes || null,
          strategy_id: selectedStrategyId || null,
          // Eliminados: cantidad, rr, parcial_porcentaje
        })
        .select('id') // Seleccionar solo el ID
        .single();    // Esperar un solo objeto

      if (tradeError) throw tradeError;
      if (!tradeData?.id) throw new Error("No se pudo obtener el ID del trade creado.");

      const newTradeId = tradeData.id;

      // 2. Actualizar Current Capital de la cuenta
      const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .select('current_capital')
        .eq('id', selectedAccountId)
        .single();

      if (accountError) throw new Error("No se pudo obtener el capital actual de la cuenta.");
      
      const newCapital = (accountData?.current_capital || 0) + pnlAmount;

      const { error: updateError } = await supabase
        .from('accounts')
        .update({ current_capital: newCapital })
        .eq('id', selectedAccountId);
        
      if (updateError) throw new Error("Error al actualizar el capital de la cuenta.");

      // 3. Insertar las Reglas Rotas (si hay alguna)
      if (brokenRuleIds.length > 0) {
        const brokenRulesToInsert = brokenRuleIds.map(ruleId => ({
          trade_id: newTradeId,
          rule_id: ruleId,
          user_id: user.id // Importante para RLS
        }));

        const { error: brokenRulesError } = await supabase
          .from('broken_rules_by_trade')
          .insert(brokenRulesToInsert);

        if (brokenRulesError) {
          // Podrías intentar borrar el trade si falla aquí, o solo notificar
          console.error("Error al guardar reglas rotas:", brokenRulesError);
          toast.error("Trade guardado, pero hubo un error al guardar las reglas rotas.");
          // No lanzar error para que el flujo continúe, pero notificar
        }
      }
      
      // TODO: Lógica para subir imágenes a Supabase Storage y guardar URLs en `trades`
      // Esta parte es más compleja y requiere `supabase.storage`

      toast.success("Operación registrada y cuenta actualizada con éxito");

      // Resetear formulario a valores iniciales
      setTradeDate(new Date());
      setEntryTimeString('09:00:00');
      setExitTimeString('10:00:00');
      setPreTradeNotes('');
      setPostTradeNotes('');
      setSetupRating('');
      setSelectedStrategyId(null); // Esto limpiará las reglas y checkboxes
      setBrokenRuleIds([]);
      setSelectedAccountId(undefined); // Resetear cuenta seleccionada
      setFormData({
        par: "",
        pnl_neto: "",
        riesgo: "",
        emocion: "",
        trade_type: "buy",
        reglas_cumplidas: true,
        imagenes: [],
      });

      queryClient.invalidateQueries({ queryKey: ["trades"] }); // Refrescar datos

    } catch (error: any) {
      toast.error("Error al registrar la operación: " + error.message);
      console.error("Error detallado:", error);
    } finally {
      setLoading(false);
    }
  };
  // --- Fin handleSubmit ---


  // --- JSX del Componente ---
  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>Registrar Operación</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selector de Cuenta */}
          <div className="space-y-2">
            <Label htmlFor="account-select">Cuenta *</Label>
            <Select
              value={selectedAccountId}
              onValueChange={(value) => setSelectedAccountId(value)}
              required
            >
              <SelectTrigger id="account-select" className="bg-secondary">
                <SelectValue placeholder="Seleccionar cuenta..." />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.account_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fila Fecha y Horas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="trade-date">Fecha del Trade</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} id="trade-date" className="w-full justify-start text-left font-normal bg-secondary">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {tradeDate ? format(tradeDate, "PPP") : <span>Elige fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={tradeDate} onSelect={setTradeDate} initialFocus /></PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="entry-time">Hora Entrada</Label>
              <Input id="entry-time" type="time" step="1" value={entryTimeString} onChange={(e) => setEntryTimeString(e.target.value)} required className="bg-secondary" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exit-time">Hora Salida</Label>
              <Input id="exit-time" type="time" step="1" value={exitTimeString} onChange={(e) => setExitTimeString(e.target.value)} required className="bg-secondary" />
            </div>
          </div>

          {/* Fila Par y PnL Neto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label htmlFor="par">Par</Label>
               <Combobox
                 options={simbolosOptions}
                 value={formData.par}
                 onChange={(value) => handleComboboxChange('par', value)}
                 placeholder="Seleccionar par..."
                 emptyMessage="No se encontraron pares."
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="pnl_neto">PnL Neto *</Label>
               <Input id="pnl_neto" type="number" step="0.01" placeholder="0.00" value={formData.pnl_neto} onChange={handleInputChange} required className="bg-secondary" />
             </div>
          </div>

          {/* Fila Dirección y Riesgo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Dirección</Label>
              <RadioGroup value={formData.trade_type} onValueChange={handleRadioChange} className="flex space-x-4 pt-2">
                <div className="flex items-center space-x-2"><RadioGroupItem value="buy" id="buy" /><Label htmlFor="buy">Compra</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="sell" id="sell" /><Label htmlFor="sell">Venta</Label></div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="riesgo">Riesgo ($) *</Label>
              <Input id="riesgo" type="number" step="0.01" placeholder="Ej. 100" value={formData.riesgo} onChange={handleInputChange} required className="bg-secondary" />
            </div>
          </div>

          {/* Fila RR Calculado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rr-calculated">RR (Calculado)</Label>
              <Input
                id="rr-calculated"
                type="text"
                value={(() => {
                  const risk = parseFloat(formData.riesgo);
                  const pnl = parseFloat(formData.pnl_neto);
                  if (risk > 0 && !isNaN(pnl)) {
                    const ratio = pnl / risk;
                    return `1 : ${ratio.toFixed(2)}`;
                  }
                  return 'N/A';
                })()}
                readOnly
                className="bg-secondary/50 border-dashed text-muted-foreground"
              />
            </div>
            <div className="space-y-2">
              {/* Campo vacío para mantener el layout */}
            </div>
          </div>

           {/* Fila Estrategia y Emoción */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label htmlFor="strategy-select">Estrategia Aplicada</Label>
               <Select value={selectedStrategyId || ''} onValueChange={(value) => setSelectedStrategyId(value || null)}>
                 <SelectTrigger id="strategy-select" className="bg-secondary">
                   <SelectValue placeholder="Seleccionar estrategia..." />
                 </SelectTrigger>
                 <SelectContent>
                   {strategies.map((strategy) => (
                     <SelectItem key={strategy.id} value={strategy.id}>
                       {strategy.name}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
             <div className="space-y-2">
               <Label htmlFor="emocion">Emoción</Label>
               <Combobox
                 options={emocionOptions}
                 value={formData.emocion}
                 onChange={(value) => handleComboboxChange('emocion', value)}
                 placeholder="Seleccionar emoción..."
                 emptyMessage="No se encontraron emociones."
               />
             </div>
           </div>

          {/* Sección Reglas Rotas (Dinámica) */}
          {selectedStrategyId && (
            <div className="space-y-3 pt-4">
              <Label className="font-semibold text-lg">Reglas de la Estrategia (Marca las que rompiste)</Label>
              {loadingRules ? (
                <p>Cargando reglas...</p>
              ) : rulesForStrategy.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay reglas definidas para esta estrategia.</p>
              ) : (
                <div className="space-y-2 rounded-md border p-4 bg-secondary/30">
                  {rulesForStrategy.map((rule) => (
                    <div key={rule.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={`rule-${rule.id}`}
                        checked={brokenRuleIds.includes(rule.id)}
                        onCheckedChange={(checked) => {
                          setBrokenRuleIds((prev) =>
                            checked ? [...prev, rule.id] : prev.filter((id) => id !== rule.id)
                          );
                        }}
                      />
                      <Label htmlFor={`rule-${rule.id}`} className="font-normal cursor-pointer leading-snug">
                        {rule.rule_text}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

           {/* Calificación del Setup */}
           <div className="space-y-3 pt-4">
             <Label className="font-semibold text-lg">Calificación del Setup</Label>
             <ToggleGroup type="single" value={setupRating} onValueChange={(value) => { if (value) setSetupRating(value); }} className="grid grid-cols-5 gap-3">
               {['F', 'D', 'C', 'B', 'A'].map((rating) => (
                 <ToggleGroupItem key={rating} value={rating} aria-label={`Calificación ${rating}`}
                   className="h-14 w-full p-2 border border-neutral-700 bg-neutral-900 text-xl font-bold text-white data-[state=on]:bg-primary data-[state=on]:border-primary/80 data-[state=on]:text-primary-foreground hover:bg-neutral-800 transition-colors">
                   {rating}
                 </ToggleGroupItem>
               ))}
             </ToggleGroup>
           </div>

           {/* Notas Pre y Post Trade */}
           <div className="space-y-4 pt-4 col-span-1 md:col-span-2"> {/* Ocupa todo el ancho */}
             <Label className="font-semibold text-lg">Análisis (Pre y Post Trade)</Label>
             <div className="space-y-2 p-4 rounded-lg border border-neutral-800 bg-neutral-950/50">
               <Label htmlFor="pre-trade-notes" className="text-primary font-medium">Análisis Pre-Trade</Label>
               <Textarea id="pre-trade-notes" placeholder="¿Por qué estoy tomando este trade? ¿Qué confirmaciones veo?" value={preTradeNotes} onChange={(e) => setPreTradeNotes(e.target.value)} className="bg-transparent border-0 p-0 focus:ring-0 focus-visible:ring-offset-0 focus-visible:ring-0 min-h-[80px]" />
             </div>
             <div className="space-y-2 p-4 rounded-lg border border-neutral-800 bg-neutral-950/50">
               <Label htmlFor="post-trade-notes" className="text-primary font-medium">Reflexión Post-Trade</Label>
               <Textarea id="post-trade-notes" placeholder="¿Qué salió bien/mal? ¿Seguí el plan? ¿Cómo me sentí?" value={postTradeNotes} onChange={(e) => setPostTradeNotes(e.target.value)} className="bg-transparent border-0 p-0 focus:ring-0 focus-visible:ring-offset-0 focus-visible:ring-0 min-h-[80px]" />
             </div>
           </div>

           {/* Subida de Imágenes */}
           <div className="space-y-2 pt-4 col-span-1 md:col-span-2">
             <Label htmlFor="imagenes" className="font-semibold text-lg">Imágenes</Label>
             <div className="flex items-center justify-center w-full">
               <label htmlFor="imagenes" className="flex flex-col items-center justify-center w-full h-[80px] bg-secondary border-2 border-dashed rounded-md cursor-pointer hover:bg-secondary/80 transition-colors">
                 <div className="flex flex-col items-center justify-center pt-5 pb-6">
                   <p className="text-sm text-muted-foreground">
                     {formData.imagenes.length > 0 ? `${formData.imagenes.length} archivo(s) seleccionado(s)` : "Adjuntar Imágenes del Trade"}
                   </p>
                 </div>
                 <input id="imagenes" type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
               </label>
             </div>
           </div>
           
           {/* Botón de Enviar */}
          <Button type="submit" className="w-full text-lg py-6 mt-6" disabled={loading}>
            {loading ? "Guardando..." : "Registrar Operación"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default TradeForm;
