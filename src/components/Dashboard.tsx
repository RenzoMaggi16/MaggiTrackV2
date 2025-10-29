import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity, Smile } from "lucide-react";
import { PnLCalendar } from "./PnLCalendar";
import { RecentTrades } from "./RecentTrades";
import EquityChart from "./EquityChart";
import { useMemo, useState } from "react";
import { WinRateDonutChart } from "@/components/charts/WinRateDonutChart";
import { EmotionalStateIndicator } from "@/components/EmotionalStateIndicator";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Trade {
  id: string;
  pnl_neto: number;
  entry_time: string;
  par: string;
  reglas_cumplidas?: boolean;
  emocion?: string;
}

export const Dashboard = () => {
  const getCssVar = (name: string, fallback: string) => {
    if (typeof window === "undefined") return fallback;
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  };

  const profitColor = getCssVar("--profit-color", "#22c55e");
  const lossColor = getCssVar("--loss-color", "#ef4444");

  const { data: trades = [] } = useQuery({
    queryKey: ["trades"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .order("entry_time", { ascending: true });
      
      if (error) throw error;
      return data as Trade[];
    },
  });

  const { data: overallStats } = useQuery({
    queryKey: ["overallStats"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("get_overall_stats");
      if (error) throw error;
      return data as { winning_trades: number; losing_trades: number; breakeven_trades: number; most_frequent_emotion?: string } | null;
    },
  });

  const { data: pnlByHourData = [] } = useQuery({
    queryKey: ["pnlByHour"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("get_pnl_by_hour");
      if (error) throw error;
      const hourlyMap = new Map((data || []).map((item: any) => [item.hour_of_day, item.total_pnl]));
      const fullHourlyData = Array.from({ length: 24 }, (_, i) => ({
        hour_of_day: i,
        total_pnl: hourlyMap.get(i) || 0,
      }));
      return fullHourlyData;
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
      new Date(a.entry_time).getTime() - new Date(b.entry_time).getTime()
    );

    let runningPnl = 0;
    return sortedTrades.map(trade => {
      runningPnl += Number(trade.pnl_neto);
      return {
        date: new Date(trade.entry_time).toLocaleDateString(),
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
        {/* Fila 1: Gráficos en grilla (NET P&L y PnL por Hora) */}
        <div className="grid grid-cols-1 gap-6">
          <EquityChart data={equityCurveData} />

          <Card>
            <CardHeader>
              <CardTitle>PnL por Hora (UTC)</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pnlByHourData as any} margin={{ top: 10, right: 0, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis
                    dataKey="hour_of_day"
                    tickFormatter={(hour) => `${hour}h`}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    domain={["dataMin", "dataMax"]}
                    width={60}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)" }}
                    itemStyle={{ color: "hsl(var(--foreground))" }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    cursor={{ fill: "hsl(var(--foreground))", fillOpacity: 0.08 }}
                    labelFormatter={(label) => `Hora ${label}:00`}
                    formatter={(value: number) => [Number(value).toFixed(2), "PnL Neto"]}
                  />
                  <Bar dataKey="total_pnl">
                    {(pnlByHourData as any[]).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.total_pnl >= 0 ? profitColor : lossColor} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        
        {/* Fila 2: El nuevo contenedor para las estadísticas */}
        <div className="stats-container grid grid-cols-1 md:grid-cols-3 gap-6">
          {overallStats && (
            <Card className="flex flex-col items-center justify-center p-4 min-h-[250px]">
              <CardHeader className="p-0 pb-2">
                <CardTitle className="text-sm font-medium text-center">Tasa de Acierto</CardTitle>
              </CardHeader>
              <CardContent className="w-full flex flex-col items-center justify-center p-0 pb-4">
                <WinRateDonutChart
                  wins={overallStats.winning_trades || 0}
                  losses={overallStats.losing_trades || 0}
                  breakeven={overallStats.breakeven_trades || 0}
                />
              </CardContent>
            </Card>
          )}

          <Card className="flex flex-col items-center justify-center p-4 min-h-[250px]">
            <CardHeader className="p-0 pb-2">
              <CardTitle className="text-sm font-medium text-center text-muted-foreground">
                Cumplimiento de Reglas
              </CardTitle>
            </CardHeader>
            <CardContent className="w-full flex flex-col items-center justify-center p-0">
              <div className="text-5xl font-bold">
                {metrics.ruleComplianceRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Disciplina de trading
              </p>
            </CardContent>
          </Card>

          <div className="flex flex-col">
            {overallStats && (
              <EmotionalStateIndicator emotion={overallStats.most_frequent_emotion || "Neutral"} className="min-h-[250px]" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
