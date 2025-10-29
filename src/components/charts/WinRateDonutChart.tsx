import { PieChart, Pie, Cell, ResponsiveContainer, Label } from 'recharts';

interface WinRateDonutChartProps {
  wins: number;
  losses: number;
  breakeven: number;
}

// Helper para obtener valores de variables CSS
const getCssVariableValue = (variableName: string) => {
  if (typeof window === 'undefined') return '#888888'; // Fallback for SSR
  return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim() || '#888888';
};

export const WinRateDonutChart = ({ wins = 0, losses = 0, breakeven = 0 }: WinRateDonutChartProps) => {
  const totalTrades = wins + losses + breakeven;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

  const data = [
    { name: 'Wins', value: wins },
    { name: 'Losses', value: losses },
    { name: 'BreakEven', value: breakeven },
  ];

  // Obtener colores de las variables CSS
  const profitColor = getCssVariableValue('--profit-color');
  const lossColor = getCssVariableValue('--loss-color');
  const neutralColor = '#888888'; // Color gris para break-even

  const COLORS = [profitColor, lossColor, neutralColor];

  if (totalTrades === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No hay trades
      </div>
    );
  }

  return (
    <div className="relative w-full h-[180px] flex flex-col items-center justify-between">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            fill="#8884d8"
            paddingAngle={totalTrades > 1 ? 5 : 0}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
            <Label
              value={`${winRate.toFixed(1)}%`}
              position="center"
              className="fill-foreground text-2xl font-bold"
              style={{ fontSize: '20px', fontWeight: 'bold' }}
            />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {/* Leyenda */}
      <div className="flex justify-center gap-12 text-xs mt-2 text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: profitColor }}></span>
          W: {wins}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: lossColor }}></span>
          L: {losses}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: neutralColor }}></span>
          BE: {breakeven}
        </span>
      </div>
    </div>
  );
};

