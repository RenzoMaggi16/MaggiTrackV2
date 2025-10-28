"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type ColorPreferences = {
  profit: string;
  loss: string;
  chart: string;
};

type ColorProviderState = {
  colors: ColorPreferences;
  setColors: (colors: ColorPreferences) => void;
  isLoading: boolean;
};

const defaultColors: ColorPreferences = {
  profit: '#28a745',
  loss: '#dc3545',
  chart: '#28a745'
};

const ColorProviderContext = createContext<ColorProviderState>({
  colors: defaultColors,
  setColors: () => null,
  isLoading: true,
});

export function ColorProvider({ children }: { children: React.ReactNode }) {
  const [colors, setColors] = useState<ColorPreferences>(defaultColors);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserColors = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          // Si no hay usuario, usar colores por defecto
          setColors(defaultColors);
          setIsLoading(false);
          return;
        }

        const { data: preferences, error } = await supabase
          .from('user_preferences')
          .select('profit_color_hex, loss_color_hex, chart_color_hex')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 = row not found, que es normal si el usuario no tiene preferencias
          console.error('Error loading user colors:', error);
          setColors(defaultColors);
        } else if (preferences) {
          // Usar colores guardados o colores por defecto si no están definidos
          const userColors = {
            profit: preferences.profit_color_hex || defaultColors.profit,
            loss: preferences.loss_color_hex || defaultColors.loss,
            chart: preferences.chart_color_hex || defaultColors.chart
          };
          setColors(userColors);
        } else {
          // Si no hay preferencias, usar colores por defecto
          setColors(defaultColors);
        }
      } catch (error) {
        console.error('Error loading user colors:', error);
        setColors(defaultColors);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserColors();

    // Escuchar cambios de autenticación para recargar colores
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        loadUserColors(); // Recarga colores si el usuario inicia/cierra sesión
      }
    });

    // Limpiar listener al desmontar
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Función para convertir HEX a RGBA
    const hexToRgba = (hex: string, alpha: number): string => {
      try {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      } catch (e) {
        return `rgba(0, 0, 0, ${alpha})`; // Fallback seguro
      }
    };

    // Aplicar colores como variables CSS
    const root = document.documentElement;
    root.style.setProperty('--profit-color', colors.profit);
    root.style.setProperty('--loss-color', colors.loss);
    root.style.setProperty('--chart-color', colors.chart);
    
    // Colores de fondo del calendario (siguen derivados)
    root.style.setProperty('--calendar-profit-bg', hexToRgba(colors.profit, 0.3));
    root.style.setProperty('--calendar-loss-bg', hexToRgba(colors.loss, 0.3));
  }, [colors]);

  const value = {
    colors,
    setColors,
    isLoading,
  };

  return (
    <ColorProviderContext.Provider value={value}>
      {children}
    </ColorProviderContext.Provider>
  );
}

export const useColors = () => {
  const context = useContext(ColorProviderContext);

  if (context === undefined)
    throw new Error("useColors must be used within a ColorProvider");

  return context;
};
