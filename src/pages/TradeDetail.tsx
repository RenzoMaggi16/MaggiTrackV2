import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/Navbar";

interface Trade {
  id: string;
  fecha: string;
  simbolo: string;
  pnl_neto: number;
  entrada: number | null;
  salida: number | null;
  cantidad: number | null;
  notas: string | null;
  reglas_cumplidas: boolean;
  rr: string | null;
  ciclo_diario: string | null;
  induccion: string | null;
  liquidez: string | null;
  tipo_entrada: string | null;
  parcial_porcentaje: number | null;
  imagenes_urls: string[] | null;
}

const TradeDetail = () => {
  const params = useParams();
  const id = params.id;
  const [trade, setTrade] = useState<Trade | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrade = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
    .from('trades')
    .select<"*", Trade>('*') // <-- CAMBIO AQUÍ
    .eq('id', id)
    .single();

      if (error) {
        console.error("Error al obtener el trade:", error);
      } else {
        setTrade(data as Trade || null);
      }
      setLoading(false);
    };

    fetchTrade();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-8 text-muted-foreground">Cargando...</div>
        </main>
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-8 text-muted-foreground">
            No se encontró la operación
          </div>
          <div className="flex justify-center mt-4">
            <Button asChild>
              <Link to="/">Volver al inicio</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="outline" asChild className="gap-2">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Link>
          </Button>
        </div>

        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Detalles del Trade</CardTitle>
              <Badge variant="outline" className="text-lg px-3 py-1">
                {trade.simbolo}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Fecha</h3>
                  <p className="text-lg">{format(new Date(trade.fecha), "dd/MM/yyyy HH:mm")}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">PnL</h3>
                  <p className={`text-lg font-semibold ${
                    Number(trade.pnl_neto) > 0 ? 'text-profit' : 'text-loss'
                  }`}>
                    ${Number(trade.pnl_neto).toFixed(2)}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Entrada</h3>
                  <p className="text-lg">{trade.entrada ? `$${Number(trade.entrada).toFixed(2)}` : '-'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Salida</h3>
                  <p className="text-lg">{trade.salida ? `$${Number(trade.salida).toFixed(2)}` : '-'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Cantidad</h3>
                  <p className="text-lg">{trade.cantidad ? trade.cantidad : '-'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Reglas Cumplidas</h3>
                  <Badge variant={trade.reglas_cumplidas ? "default" : "destructive"}>
                    {trade.reglas_cumplidas ? "Sí" : "No"}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">RR</h3>
                  <p className="text-lg">{trade.rr || '-'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Ciclo Diario</h3>
                  <p className="text-lg">{trade.ciclo_diario || '-'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Inducción</h3>
                  <p className="text-lg">{trade.induccion || '-'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Liquidez</h3>
                  <p className="text-lg">{trade.liquidez || '-'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Tipo de Entrada</h3>
                  <p className="text-lg">{trade.tipo_entrada || '-'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">% Parcial</h3>
                  <p className="text-lg">{trade.parcial_porcentaje ? `${trade.parcial_porcentaje}%` : '-'}</p>
                </div>
              </div>
            </div>
            
            {trade.notas && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Notas</h3>
                <div className="bg-secondary/50 p-4 rounded-md">
                  <p className="whitespace-pre-wrap">{trade.notas}</p>
                </div>
              </div>
            )}
            
            {trade.imagenes_urls && trade.imagenes_urls.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Imágenes</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {trade.imagenes_urls.map((url, index) => (
                    <div key={index} className="overflow-hidden rounded-md border border-border">
                      <img 
                        src={url} 
                        alt={`Imagen ${index + 1} del trade`} 
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TradeDetail;