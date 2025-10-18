import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isThisMonth } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Trade {
  id: string;
  fecha: string;
  pnl_neto: number;
}

interface DayPnL {
  date: Date;
  pnl: number;
}

export const PnLCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dailyPnL, setDailyPnL] = useState<DayPnL[]>([]);

  const { data: trades = [] } = useQuery({
    queryKey: ["trades", format(currentMonth, "yyyy-MM")],
    queryFn: async () => {
      const startDate = startOfMonth(currentMonth);
      const endDate = endOfMonth(currentMonth);
      
      const { data, error } = await supabase
        .from("trades")
        .select("id, fecha, pnl_neto")
        .gte("fecha", startDate.toISOString())
        .lte("fecha", endDate.toISOString());
      
      if (error) throw error;
      return data as Trade[];
    },
  });

  useEffect(() => {
    // Calcular el PnL diario
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    
    const pnlByDay = days.map(day => {
      const dayTrades = trades.filter(trade => 
        isSameDay(new Date(trade.fecha), day)
      );
      
      const totalPnL = dayTrades.reduce(
        (sum, trade) => sum + Number(trade.pnl_neto), 
        0
      );
      
      return {
        date: day,
        pnl: totalPnL
      };
    });
    
    setDailyPnL(pnlByDay);
  }, [trades, currentMonth]);

  const goToPreviousMonth = () => {
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setCurrentMonth(prevMonth);
  };

  const goToNextMonth = () => {
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCurrentMonth(nextMonth);
  };

  const hasTrade = (day: Date) => {
    const dayPnL = dailyPnL.find(d => isSameDay(d.date, day));
    return dayPnL && dayPnL.pnl !== 0;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">
          {format(currentMonth, "MMMM yyyy", { locale: es })}
        </CardTitle>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={goToPreviousMonth}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={goToNextMonth}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          className="w-full"
          classNames={{
            head_row: "flex w-full",
            head_cell: "text-primary font-medium text-xs uppercase text-center flex-1",
            row: "flex w-full mt-2 gap-1", // Añadido gap-1 para aumentar ligeramente la separación
            cell: "flex-1 relative p-0 mx-0.2", // Añadido mx-0.5 para aumentar la separación horizontal
            day: "h-full w-full p-0 font-normal",
            day_today: "",
            day_outside: "day-outside",
          }}
          components={{
            DayContent: (props) => {
              const date = props.date;
              const dayPnL = dailyPnL.find(d => isSameDay(d.date, date));
              const hasPnL = dayPnL && dayPnL.pnl !== 0;
              const isProfitable = hasPnL && dayPnL.pnl > 0;
              const isLoss = hasPnL && dayPnL.pnl < 0;
              const isCurrentDay = isToday(date);
              const isCurrentMonth = isThisMonth(date);
              
              // Determinar los estilos condicionales
              let borderClass = "border border-border";
              let textClass = "text-muted-foreground";
              let glowClass = "";
              
              if (isProfitable) {
                borderClass = "border border-[hsl(var(--profit)_/_0.5)]";
                textClass = "text-[hsl(var(--profit))]";
                glowClass = "glow-profit-inner";
              } else if (isLoss) {
                borderClass = "border border-[hsl(var(--loss)_/_0.5)]";
                textClass = "text-[hsl(var(--loss))]";
                glowClass = "glow-loss-inner";
              }
              
              return (
                <div className={`rounded-md ${borderClass} ${glowClass} flex flex-col justify-between p-1 h-24 w-full ${hasPnL ? (dayPnL.pnl >= 0 ? 'bg-calendar-profit' : 'bg-calendar-loss') : 'bg-card'}`}>
                  {/* Número del día en la esquina superior derecha */}
                  <div className="self-end">
                    {isCurrentDay ? (
                      <span className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs">
                        {format(date, "d")}
                      </span>
                    ) : (
                      <span className="text-xs text-primary/70">
                        {format(date, "d")}
                      </span>
                    )}
                  </div>
                  
                  {/* Contenido del PnL */}
                  <div className="flex-grow flex items-center justify-center">
                    {hasPnL ? (
                      <span className={`text-sm font-medium ${textClass}`}>
                        ${Math.abs(dayPnL.pnl).toFixed(2)}
                      </span>
                    ) : (
                      isCurrentMonth && <span className="text-xs text-primary/30">Sin Trade</span>
                    )}
                  </div>
                </div>
              );
            }
          }}
        />
      </CardContent>
    </Card>
  );
};