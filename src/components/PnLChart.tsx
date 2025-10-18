import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

interface Trade {
  pnl_neto: number;
  fecha: string;
}

interface PnLChartProps {
  trades: Trade[];
}

export const PnLChart = ({ trades }: PnLChartProps) => {
  const chartData = trades.reduce((acc, trade, index) => {
    const previousTotal = index > 0 ? acc[index - 1].total : 0;
    const total = previousTotal + Number(trade.pnl_neto);
    
    return [
      ...acc,
      {
        date: format(new Date(trade.fecha), "dd/MM"),
        total: Number(total.toFixed(2)),
      },
    ];
  }, [] as { date: string; total: number }[]);

  const maxValue = Math.max(...chartData.map(d => d.total), 0);
  const minValue = Math.min(...chartData.map(d => d.total), 0);

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>PnL Acumulado</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
                domain={[minValue * 1.1, maxValue * 1.1]}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No hay datos disponibles. Registra tu primera operación.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
