import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity, Smile } from "lucide-react";
import { PnLCalendar } from "./PnLCalendar";
import { RecentTrades } from "./RecentTrades";
import EquityChart from "./EquityChart";
import { useMemo } from "react";

interface Trade {
  id: string;
  pnl_neto: number;
  fecha: string;
  simbolo: string;
  reglas_cumplidas: boolean;
  emocion?: string;
}

export const Dashboard = () => {
  const { data: trades = [] } = useQuery({
    queryKey: ["trades"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .order("fecha", { ascending: true });
      
      if (error) throw error;
      return data as Trade[];
    },
  });

  const calculateMetrics = () => {
    const totalTrades = trades.length;
    const pnlTotal = trades.reduce((sum, t) => sum + Number(t.pnl_neto), 0);
    const winningTrades = trades.filter(t => Number(t.pnl_neto) > 0).length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const rulesComplied = trades.filter(t => t.reglas_cumplidas).length;
    const ruleComplianceRate = totalTrades > 0 ? (rulesComplied / totalTrades) * 100 : 0;
    
    // Calcular la emoción más frecuente
    const emocionesMap = new Map<string, number>();
    
    trades.forEach(trade => {
      if (trade.emocion) {
        const count = emocionesMap.get(trade.emocion) || 0;
        emocionesMap.set(trade.emocion, count + 1);
      }
    });
    
    let emocionFrecuente = "-";
    let maxCount = 0;
    
    emocionesMap.forEach((count, emocion) => {
      if (count > maxCount) {
        maxCount = count;
        emocionFrecuente = emocion;
      }
    });

    return { totalTrades, pnlTotal, winRate, ruleComplianceRate, emocionFrecuente };
  };

  // Procesar datos para el gráfico de equity curve
  const equityCurveData = useMemo(() => {
    if (!trades || trades.length === 0) return [];

    const sortedTrades = [...trades].sort((a, b) => 
      new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );

    let runningPnl = 0;
    return sortedTrades.map(trade => {
      runningPnl += Number(trade.pnl_neto);
      return {
        date: new Date(trade.fecha).toLocaleDateString(),
        cumulativePnl: runningPnl,
      };
    });
  }, [trades]);

  const metrics = calculateMetrics();
  const isProfitable = metrics.pnlTotal > 0;

  return (
    <div className="space-y-6">
      {/* Fila superior con dos columnas: Calendario y Trades Recientes */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Columna izquierda (principal): Calendario de PnL */}
        <div className="md:col-span-2">
          <PnLCalendar />
        </div>
        
        {/* Columna derecha (lateral): Trades Recientes */}
        <div className="md:col-span-1">
          <RecentTrades />
        </div>
      </div>
      
      {/* Sección inferior: Gráfico y estadísticas */}
      <div className="bottom-section-container flex flex-col gap-6">
        {/* Fila 1: El Gráfico */}
        <div className="chart-wrapper min-h-[300px]">
          <EquityChart data={equityCurveData} />
        </div>
        
        {/* Fila 2: El nuevo contenedor para las estadísticas */}
        <div className="stats-container flex justify-between items-stretch gap-5">
          <Card className="flex-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tasa de Acierto
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.winRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Win rate general
              </p>
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Cumplimiento de Reglas
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.ruleComplianceRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Disciplina de trading
              </p>
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Emoción Frecuente
              </CardTitle>
              <Smile className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.emocionFrecuente}
              </div>
              <p className="text-xs text-muted-foreground">
                Basado en tus trades
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
