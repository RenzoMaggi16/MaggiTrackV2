import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface Trade {
  id: string;
  fecha: string;
  simbolo: string;
  pnl_neto: number;
}

export const RecentTrades = () => {
  const { data: trades = [], isLoading } = useQuery({
    queryKey: ["recent-trades"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trades")
        .select("id, fecha, simbolo, pnl_neto")
        .order("fecha", { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data as Trade[];
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Operaciones Recientes</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">Cargando...</div>
        ) : trades.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No hay operaciones recientes
          </div>
        ) : (
          <div className="space-y-3">
            {trades.map((trade) => (
              <div 
                key={trade.id} 
                className={`p-3 rounded-lg border ${
                  Number(trade.pnl_neto) > 0 
                    ? 'border-[hsl(var(--profit)_/_0.3)] bg-[hsl(var(--profit)_/_0.05)]' 
                    : 'border-[hsl(var(--loss)_/_0.3)] bg-[hsl(var(--loss)_/_0.05)]'
                }`}
              >
                <div className="flex justify-between items-center">
                  <Badge variant="outline">{trade.simbolo}</Badge>
                  <span className={`font-semibold ${
                    Number(trade.pnl_neto) > 0 ? 'text-[hsl(var(--profit))]' : 'text-[hsl(var(--loss))]'
                  }`}>
                    ${Number(trade.pnl_neto).toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {format(new Date(trade.fecha), "dd/MM/yyyy HH:mm")}
                </div>
              </div>
            ))}
            <div className="text-center pt-2">
              <a href="#" className="text-xs text-primary hover:underline hover:text-primary/80">
                Ver Más
              </a>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};