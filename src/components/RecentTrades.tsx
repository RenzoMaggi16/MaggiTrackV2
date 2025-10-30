import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

interface Trade {
  id: string;
  entry_time: string;
  par: string;
  pnl_neto: number;
}

export const RecentTrades = () => {
  const { data: trades = [], isLoading } = useQuery({
    queryKey: ["recent-trades"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trades")
        .select("id, entry_time, par, pnl_neto")
        .order("entry_time", { ascending: false })
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
                    ? 'border-profit-custom bg-[var(--profit-color)]/5' 
                    : 'border-loss-custom bg-[var(--loss-color)]/5'
                }`}
              >
                <div className="flex justify-between items-center">
                  <Badge variant="outline">{trade.par}</Badge>
                  <span className={`font-semibold ${
                    Number(trade.pnl_neto) > 0 ? 'text-profit-custom' : 'text-loss-custom'
                  }`}>
                    ${Number(trade.pnl_neto).toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {format(new Date(trade.entry_time), "dd/MM/yyyy HH:mm")}
                </div>
              </div>
            ))}
            <div className="text-center pt-2">
              <Link to="/trades" className="text-xs text-primary hover:underline hover:text-primary/80">
                Ver Más
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};