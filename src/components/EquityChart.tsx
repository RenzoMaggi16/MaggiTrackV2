import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type EquityData = { 
  date: string; 
  cumulativePnl: number; 
}; 

interface EquityChartProps { 
  data: EquityData[]; 
} 

const EquityChart = ({ data }: EquityChartProps) => { 
  if (!data || data.length === 0) { 
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">NET P&L</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No hay datos para mostrar.
          </div>
        </CardContent>
      </Card>
    );
  } 

  const finalPnl = data[data.length - 1].cumulativePnl; 
  const currencyFormatter = new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD', 
  }); 

  const chartKey = `${data.length}-${finalPnl}`;

  return ( 
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm font-medium text-muted-foreground">NET P&L</CardTitle>
          <div className={`text-2xl font-bold ${finalPnl > 0 ? 'text-profit-custom' : 'text-loss-custom'}`}>
            {currencyFormatter.format(finalPnl)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer key={chartKey} width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <defs>
                <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-color)" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="var(--chart-color)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                fontSize={10}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                dataKey="cumulativePnl" 
                axisLine={false} 
                tickLine={false}
                domain={["dataMin", "dataMax"]}
                width={70}
                fontSize={10}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => currencyFormatter.format(value)}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '8px'
                }} 
                formatter={(value: number) => [currencyFormatter.format(value), 'Net P&L']} 
              />
              <Area 
                type="monotone" 
                dataKey="cumulativePnl" 
                stroke="var(--chart-color)" 
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#colorPnl)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  ); 
}; 

export default EquityChart;