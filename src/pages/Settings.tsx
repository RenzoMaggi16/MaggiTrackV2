import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings as SettingsIcon, Save, Palette } from "lucide-react";
import { ChromePicker } from 'react-color';
import { useToast } from "@/components/ui/use-toast";

interface UserPreferences {
  profit_color_hex: string;
  loss_color_hex: string;
  chart_color_hex: string;
  calendar_profit_text_hex: string;
  calendar_loss_text_hex: string;
}

const Settings = () => {
  const [profitColor, setProfitColor] = useState('#28a745');
  const [lossColor, setLossColor] = useState('#dc3545');
  const [chartColor, setChartColor] = useState('#28a745');
  const [calendarProfitText, setCalendarProfitText] = useState('#FFFFFF');
  const [calendarLossText, setCalendarLossText] = useState('#FFFFFF');
  const [initialColors, setInitialColors] = useState({ 
    profit: '', 
    loss: '', 
    chart: '',
    calendarProfitText: '',
    calendarLossText: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadUserPreferences = async () => {
      try {
        setIsLoading(true);
        
        // Obtener el usuario actual
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          toast({
            title: "Error",
            description: "Debes iniciar sesión para acceder a la configuración",
            variant: "destructive",
          });
          return;
        }

        setUserId(user.id);

        // Buscar preferencias del usuario
        const { data: preferences, error: prefError } = await supabase
          .from('user_preferences')
          .select('profit_color_hex, loss_color_hex, chart_color_hex, calendar_profit_text_hex, calendar_loss_text_hex')
          .eq('user_id', user.id)
          .single();

        if (prefError && prefError.code !== 'PGRST116') { // PGRST116 = no rows found
          console.error('Error loading preferences:', prefError);
          toast({
            title: "Error",
            description: "No se pudieron cargar las preferencias",
            variant: "destructive",
          });
        }

        if (preferences) {
          setProfitColor(preferences.profit_color_hex || '#28a745');
          setLossColor(preferences.loss_color_hex || '#dc3545');
          setChartColor(preferences.chart_color_hex || '#28a745');
          setCalendarProfitText(preferences.calendar_profit_text_hex || '#FFFFFF');
          setCalendarLossText(preferences.calendar_loss_text_hex || '#FFFFFF');
          setInitialColors({
            profit: preferences.profit_color_hex || '#28a745',
            loss: preferences.loss_color_hex || '#dc3545',
            chart: preferences.chart_color_hex || '#28a745',
            calendarProfitText: preferences.calendar_profit_text_hex || '#FFFFFF',
            calendarLossText: preferences.calendar_loss_text_hex || '#FFFFFF'
          });
        } else {
          // Usar colores por defecto
          setInitialColors({
            profit: '#28a745',
            loss: '#dc3545',
            chart: '#28a745',
            calendarProfitText: '#FFFFFF',
            calendarLossText: '#FFFFFF'
          });
        }

      } catch (error) {
        console.error('Error loading user preferences:', error);
        toast({
          title: "Error",
          description: "Error inesperado al cargar las preferencias",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadUserPreferences();
  }, [toast]);

  const handleSave = async () => {
    if (!userId) return;
    
    // Verificar si hay cambios
    if (profitColor === initialColors.profit && 
        lossColor === initialColors.loss && 
        chartColor === initialColors.chart &&
        calendarProfitText === initialColors.calendarProfitText &&
        calendarLossText === initialColors.calendarLossText) {
      toast({
        title: "Información",
        description: "No hay cambios para guardar",
      });
      return;
    }

    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('user_preferences')
        .upsert({ 
          user_id: userId,
          profit_color_hex: profitColor,
          loss_color_hex: lossColor,
          chart_color_hex: chartColor,
          calendar_profit_text_hex: calendarProfitText,
          calendar_loss_text_hex: calendarLossText,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) {
        throw error;
      }

      toast({
        title: "Éxito",
        description: "Preferencias guardadas correctamente",
      });

      // Actualizar colores iniciales
      setInitialColors({ 
        profit: profitColor, 
        loss: lossColor, 
        chart: chartColor,
        calendarProfitText: calendarProfitText,
        calendarLossText: calendarLossText
      });

      // Aplicar colores inmediatamente
      applyColorsToDocument();

    } catch (error: any) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "Error al guardar las preferencias: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const applyColorsToDocument = () => {
    const root = document.documentElement;
    root.style.setProperty('--profit-color', profitColor);
    root.style.setProperty('--loss-color', lossColor);
    root.style.setProperty('--chart-color', chartColor);
    root.style.setProperty('--calendar-profit-text-color', calendarProfitText);
    root.style.setProperty('--calendar-loss-text-color', calendarLossText);
  };

  const ColorPicker = ({ 
    color, 
    onChange, 
    label, 
    description 
  }: { 
    color: string; 
    onChange: (color: string) => void; 
    label: string; 
    description: string; 
  }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <p className="text-xs text-muted-foreground">{description}</p>
      <div className="flex items-center space-x-3">
        <div 
          className="w-12 h-12 rounded-md border-2 border-border"
          style={{ backgroundColor: color }}
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Palette className="h-4 w-4 mr-2" />
              Cambiar Color
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <ChromePicker
              color={color}
              onChangeComplete={(color) => onChange(color.hex)}
              disableAlpha
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
            <Skeleton className="h-12 w-32" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center space-x-3 mb-8">
          <SettingsIcon className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Configuración de Apariencia</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <div 
                  className="w-4 h-4 rounded mr-2"
                  style={{ backgroundColor: profitColor }}
                />
                Color de Ganancia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ColorPicker
                color={profitColor}
                onChange={setProfitColor}
                label="Color de Ganancia (Profit)"
                description="Este color se usará para mostrar ganancias positivas"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <div 
                  className="w-4 h-4 rounded mr-2"
                  style={{ backgroundColor: lossColor }}
                />
                Color de Pérdida
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ColorPicker
                color={lossColor}
                onChange={setLossColor}
                label="Color de Pérdida (Loss)"
                description="Este color se usará para mostrar pérdidas"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <div 
                  className="w-4 h-4 rounded mr-2"
                  style={{ backgroundColor: chartColor }}
                />
                Color de Gráficos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ColorPicker
                color={chartColor}
                onChange={setChartColor}
                label="Color de Gráficos"
                description="Este color se usará en los gráficos y visualizaciones"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <div 
                  className="w-4 h-4 rounded mr-2"
                  style={{ backgroundColor: calendarProfitText }}
                />
                Texto Ganancia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ColorPicker
                color={calendarProfitText}
                onChange={setCalendarProfitText}
                label="Color Texto Ganancia (Calendario)"
                description="Color del texto para días con ganancia en el calendario"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <div 
                  className="w-4 h-4 rounded mr-2"
                  style={{ backgroundColor: calendarLossText }}
                />
                Texto Pérdida
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ColorPicker
                color={calendarLossText}
                onChange={setCalendarLossText}
                label="Color Texto Pérdida (Calendario)"
                description="Color del texto para días con pérdida en el calendario"
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Los cambios se aplicarán inmediatamente después de guardar
          </div>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="min-w-[140px]"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>

        {/* Vista previa de los colores */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Vista Previa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-md space-y-2 border bg-card">
              <div className="flex justify-between items-center">
                <span style={{ color: 'hsl(var(--foreground))' }}>Ganancia:</span> 
                <span style={{ color: calendarProfitText, fontWeight: 'bold' }}>+$1,250.00</span> 
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: 'hsl(var(--foreground))' }}>Pérdida:</span> 
                <span style={{ color: calendarLossText, fontWeight: 'bold' }}>-$750.00</span> 
              </div>
              <div className="flex justify-between items-center mt-4">
                <span style={{ color: 'hsl(var(--foreground))' }}>Color de Gráficos:</span>
                <div className="w-6 h-6 rounded border" style={{ backgroundColor: chartColor }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Settings;
