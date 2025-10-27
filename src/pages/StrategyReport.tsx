import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, BrainCircuit, TrendingUp, AlertTriangle, Target, Activity } from 'lucide-react';
import { LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useToast } from "@/components/ui/use-toast";
import { PnLCalendar } from "@/components/PnLCalendar";

interface StrategyStats {
  realized_win_pct: number;
  rules_followed_win_pct: number;
  current_streak: number;
  most_broken_rule: string;
}

interface PerformanceData {
  date: string;
  cumulative_pnl: number;
}

interface RadarChartData {
  name: string;
  value: number;
}

interface BrokenRule {
  rule_id: string;
  rule_text: string;
  broken_count: number;
  total_trades: number;
  compliance_pct: number;
}

interface CalendarHeatmapData {
  date: Date;
  daily_pnl: number;
  rules_followed_pct: number;
  trade_count: number;
}

const StrategyReport = () => {
  const { strategyId } = useParams<{ strategyId: string }>();
  const [strategyName, setStrategyName] = useState('');
  const [stats, setStats] = useState<StrategyStats | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [radarData, setRadarData] = useState<RadarChartData[]>([]);
  const [brokenRules, setBrokenRules] = useState<BrokenRule[]>([]);
  const [calendarData, setCalendarData] = useState<CalendarHeatmapData[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      if (!strategyId) return;
      setIsLoading(true);
      
      try {
        // Obtener nombre de la estrategia
        const { data: stratData, error: stratError } = await supabase
          .from('strategies')
          .select('name')
          .eq('id', strategyId)
          .single();
        
        if (stratError) throw stratError;
        setStrategyName(stratData?.name || 'Estrategia Desconocida');

        // Obtener trades de la estrategia
        const { data: trades, error: tradesError } = await supabase
          .from('trades')
          .select('*')
          .eq('strategy_id', strategyId)
          .order('entry_time', { ascending: true });

        if (tradesError) throw tradesError;

        // Calcular estadísticas
        const calculatedStats = calculateStrategyStats(trades || []);
        setStats(calculatedStats);

        // Preparar datos de rendimiento para gráfico de línea
        const perfData = preparePerformanceData(trades || []);
        setPerformanceData(perfData);

        // Preparar datos para radar chart
        const radarChartData = prepareRadarData(trades || []);
        setRadarData(radarChartData);

        // Obtener reglas rotas
        const brokenRulesData = await fetchBrokenRules(trades || []);
        setBrokenRules(brokenRulesData);

        // Preparar datos para calendario
        const calendarData = prepareCalendarData(trades || []);
        setCalendarData(calendarData);

      } catch (error: any) {
        console.error("Error cargando datos del reporte:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos del reporte",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [strategyId, toast]);

  const calculateStrategyStats = (trades: any[]): StrategyStats => {
    if (trades.length === 0) {
      return {
        realized_win_pct: 0,
        rules_followed_win_pct: 0,
        current_streak: 0,
        most_broken_rule: 'N/A'
      };
    }

    const totalTrades = trades.length;
    const wins = trades.filter(t => t.pnl_neto > 0).length;
    const realizedWinPct = (wins / totalTrades) * 100;

    // Reglas seguidas
    const rulesFollowedTrades = trades.filter(t => t.reglas_cumplidas === true);
    const rulesFollowedWins = rulesFollowedTrades.filter(t => t.pnl_neto > 0).length;
    const rulesFollowedWinPct = rulesFollowedTrades.length > 0 
      ? (rulesFollowedWins / rulesFollowedTrades.length) * 100 
      : 0;

    // Racha actual
    let currentStreak = 0;
    if (trades.length > 0) {
      const lastTrade = trades[trades.length - 1];
      const isLastWin = lastTrade.pnl_neto > 0;
      
      for (let i = trades.length - 1; i >= 0; i--) {
        const trade = trades[i];
        if ((isLastWin && trade.pnl_neto > 0) || (!isLastWin && trade.pnl_neto < 0)) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Regla más rota
    const brokenRulesMap = new Map<string, number>();
    trades.forEach(trade => {
      if (!trade.reglas_cumplidas && trade.strategy_id) {
        brokenRulesMap.set(trade.strategy_id, (brokenRulesMap.get(trade.strategy_id) || 0) + 1);
      }
    });

    let mostBrokenRule = 'N/A';
    let maxBroken = 0;
    brokenRulesMap.forEach((count, ruleId) => {
      if (count > maxBroken) {
        maxBroken = count;
        mostBrokenRule = ruleId;
      }
    });

    return {
      realized_win_pct: realizedWinPct,
      rules_followed_win_pct: rulesFollowedWinPct,
      current_streak: currentStreak,
      most_broken_rule: mostBrokenRule
    };
  };

  const preparePerformanceData = (trades: any[]): PerformanceData[] => {
    let cumulativePnl = 0;
    return trades.map((trade) => {
      cumulativePnl += Number(trade.pnl_neto);
      return {
        date: trade.entry_time ? new Date(trade.entry_time).toLocaleDateString() : 'Unknown',
        cumulative_pnl: cumulativePnl
      };
    });
  };

  const prepareRadarData = (trades: any[]): RadarChartData[] => {
    const winCount = trades.filter(t => t.pnl_neto > 0).length;
    const lossCount = trades.filter(t => t.pnl_neto < 0).length;
    const rulesFollowedCount = trades.filter(t => t.reglas_cumplidas === true).length;
    const totalPnl = trades.reduce((sum, t) => sum + Number(t.pnl_neto), 0);
    const avgPnL = trades.length > 0 ? totalPnl / trades.length : 0;

    return [
      { name: 'Win Rate', value: (winCount / trades.length) * 100 },
      { name: 'Win/Loss Ratio', value: lossCount > 0 ? winCount / lossCount : winCount },
      { name: 'Consistency', value: (rulesFollowedCount / trades.length) * 100 },
      { name: 'Avg PnL', value: Math.abs(avgPnL) },
      { name: 'Total Trades', value: trades.length },
    ];
  };

  const fetchBrokenRules = async (trades: any[]): Promise<BrokenRule[]> => {
    if (!strategyId) return [];
    
    // Obtener reglas de la estrategia
    const { data: rules, error } = await supabase
      .from('rules')
      .select('id, nombre, descripcion')
      .eq('strategy_id', strategyId);

    if (error || !rules) return [];

    return rules.map(rule => {
      const ruleTrades = trades.filter(t => t.strategy_id === strategyId);
      const brokenTrades = trades.filter(t => !t.reglas_cumplidas);
      const brokenCount = brokenTrades.length;
      const total = ruleTrades.length;
      const compliancePct = total > 0 ? ((total - brokenCount) / total) * 100 : 100;

      return {
        rule_id: rule.id,
        rule_text: rule.nombre || rule.id,
        broken_count: brokenCount,
        total_trades: total,
        compliance_pct: compliancePct
      };
    });
  };

  const prepareCalendarData = (trades: any[]): CalendarHeatmapData[] => {
    const dailyData = new Map<string, { pnl: number; rules_followed: number; total: number }>();

    trades.forEach(trade => {
      const date = trade.entry_time ? new Date(trade.entry_time).toISOString().split('T')[0] : '';
      if (!date) return;

      if (!dailyData.has(date)) {
        dailyData.set(date, { pnl: 0, rules_followed: 0, total: 0 });
      }

      const dayData = dailyData.get(date)!;
      dayData.pnl += Number(trade.pnl_neto);
      dayData.total += 1;
      if (trade.reglas_cumplidas) {
        dayData.rules_followed += 1;
      }
    });

    return Array.from(dailyData.entries()).map(([date, data]) => ({
      date: new Date(date),
      daily_pnl: data.pnl,
      rules_followed_pct: data.total > 0 ? (data.rules_followed / data.total) * 100 : 0,
      trade_count: data.total
    }));
  };

  const handleAiAnalysis = async () => {
    if (!strategyId) return;
    
    setIsAnalyzing(true);
    try {
      // Por ahora, usar la función de análisis general
      const { data, error } = await supabase.functions.invoke('analisis-ia');
      
      if (error) throw error;
      
      setAiAnalysis(JSON.stringify(data, null, 2));
      
      toast({
        title: "Análisis completado",
        description: "El análisis de IA se ha generado correctamente",
      });
    } catch (error: any) {
      console.error("Error en análisis de IA:", error);
      toast({
        title: "Error",
        description: "No se pudo completar el análisis de IA",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-80 w-full" />
              <Skeleton className="h-80 w-full" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!strategyId) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4">Error</h1>
            <p className="text-muted-foreground">ID de estrategia no encontrado.</p>
            <Link to="/estrategias" className="inline-flex items-center mt-4 text-primary hover:underline">
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Estrategias
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link to="/estrategias" className="inline-flex items-center text-primary hover:underline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Estrategias
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold mb-6">Reporte: {strategyName}</h1>

        {/* Métricas Clave - Grid de 4 columnas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Realized Win %</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats?.realized_win_pct.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">Tasa de acierto general</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rules Followed Win %</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats?.rules_followed_win_pct.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">Win rate con disciplina</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.current_streak || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Racha actual</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Most Broken Rule</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xs font-medium truncate">
                {brokenRules[0]?.rule_text || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{brokenRules[0]?.broken_count || 0} veces</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos - 2 columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento Acumulado</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'PnL Acumulado']} />
                  <Line 
                    type="monotone" 
                    dataKey="cumulative_pnl" 
                    stroke="#3b82f6" 
                    strokeWidth={2} 
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Análisis de Rendimiento</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 'auto']} tick={{ fontSize: 10 }} />
                  <Radar 
                    name="Métrica" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.6}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Análisis de Reglas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Reglas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {brokenRules.length > 0 ? (
                brokenRules.map((rule, index) => (
                  <div key={rule.rule_id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{rule.rule_text}</span>
                      <span className="text-xs text-muted-foreground">
                        {rule.compliance_pct.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={rule.compliance_pct} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {rule.broken_count} rotura(s) de {rule.total_trades} trades
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No hay reglas definidas para esta estrategia.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BrainCircuit className="mr-2 h-5 w-5" />
                Análisis con IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleAiAnalysis} 
                className="w-full mb-4"
                disabled={isAnalyzing}
              >
                <BrainCircuit className="mr-2 h-4 w-4"/>
                {isAnalyzing ? 'Analizando...' : 'Analizar ahora'}
              </Button>
              {aiAnalysis && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-64">
                    {aiAnalysis}
                  </pre>
                </div>
              )}
              {!aiAnalysis && (
                <p className="text-sm text-muted-foreground">
                  Haz clic en "Analizar ahora" para obtener insights de la IA sobre esta estrategia.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Mapa de Calor - Full Width */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Mapa de Calor - PnL Diario</CardTitle>
          </CardHeader>
          <CardContent>
            <PnLCalendar />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default StrategyReport;
