import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Search, Trash2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";

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

export const TradesTable = () => {
  const [symbolFilter, setSymbolFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: trades = [], isLoading } = useQuery({
  queryKey: ["trades"],
  queryFn: async (): Promise<Trade[]> => { // 1. Tipar el retorno de la función
    const { data, error } = await supabase
      .from("trades")
      .select<"*", Trade>("*") // 2. Usar genérico en el select
      .order("fecha", { ascending: false });
    
    if (error) throw error;
    
    return data ?? []; // 3. Retornar data o un array vacío (ya no se necesita 'as')
  },
});

  const handleRowClick = (trade: Trade) => {
    setSelectedTrade(trade);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm('¿Estás seguro de que quieres borrar esta operación?')) {
      try {
        const { error } = await supabase
          .from('trades')
          .delete()
          .eq('id', id);
        
        if (error) {
          console.error("Error al borrar el trade:", error);
          toast({
            title: "Error",
            description: "No se pudo borrar la operación: " + error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Éxito",
            description: "Operación borrada correctamente",
          });
          queryClient.invalidateQueries({ queryKey: ["trades"] });
        }
      } catch (error) {
        console.error("Error inesperado:", error);
        toast({
          title: "Error",
          description: "Ocurrió un error inesperado al borrar la operación",
          variant: "destructive",
        });
      }
    }
  };

  const filteredTrades = trades.filter((trade) => {
    const matchesSymbol = trade.simbolo.toLowerCase().includes(symbolFilter.toLowerCase());
    const tradeDate = new Date(trade.fecha);
    const matchesStartDate = !startDate || tradeDate >= new Date(startDate);
    const matchesEndDate = !endDate || tradeDate <= new Date(endDate);
    
    return matchesSymbol && matchesStartDate && matchesEndDate;
  });

  return (
    <>
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Mis Trades</CardTitle>
          <div className="grid gap-4 md:grid-cols-3 pt-4">
            <div className="space-y-2">
              <Label htmlFor="symbol-filter">Filtrar por Símbolo</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="symbol-filter"
                  placeholder="AAPL, BTC..."
                  value={symbolFilter}
                  onChange={(e) => setSymbolFilter(e.target.value)}
                  className="bg-secondary pl-9"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="start-date">Fecha Inicio</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-secondary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">Fecha Fin</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-secondary"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          ) : filteredTrades.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron operaciones
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Símbolo</TableHead>
                    <TableHead className="text-right">PnL</TableHead>
                    <TableHead className="text-right">Entrada</TableHead>
                    <TableHead className="text-right">Salida</TableHead>
                    <TableHead className="text-center">Reglas</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrades.map((trade) => (
                    <TableRow 
                      key={trade.id} 
                      className="cursor-pointer hover:bg-secondary/50"
                      onClick={() => handleRowClick(trade)}
                    >
                      <TableCell className="font-medium">
                        {format(new Date(trade.fecha), "dd/MM/yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{trade.simbolo}</Badge>
                      </TableCell>
                      <TableCell className={`font-medium ${Number(trade.pnl_neto) > 0 ? 'text-[hsl(var(--profit))]' : 'text-[hsl(var(--loss))]'}`}>
                        ${Number(trade.pnl_neto).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {trade.entrada ? `$${Number(trade.entrada).toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {trade.salida ? `$${Number(trade.salida).toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={trade.reglas_cumplidas ? "default" : "destructive"}>
                          {trade.reglas_cumplidas ? "✓" : "✗"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => handleDelete(trade.id, e)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Detalles del Trade</span>
              {selectedTrade && (
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {selectedTrade.simbolo}
                </Badge>
              )}
            </DialogTitle>
            <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-4 w-4" />
              <span className="sr-only">Cerrar</span>
            </DialogClose>
          </DialogHeader>
          
          {selectedTrade && (
            <div className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Fecha</h3>
                    <p className="text-lg">{format(new Date(selectedTrade.fecha), "dd/MM/yyyy HH:mm")}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">PnL</h3>
                    <p className={`text-lg font-semibold ${
                      Number(selectedTrade.pnl_neto) > 0 ? 'text-profit' : 'text-loss'
                    }`}>
                      ${Number(selectedTrade.pnl_neto).toFixed(2)}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Entrada</h3>
                    <p className="text-lg">{selectedTrade.entrada ? `$${Number(selectedTrade.entrada).toFixed(2)}` : '-'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Salida</h3>
                    <p className="text-lg">{selectedTrade.salida ? `$${Number(selectedTrade.salida).toFixed(2)}` : '-'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Cantidad</h3>
                    <p className="text-lg">{selectedTrade.cantidad ? selectedTrade.cantidad : '-'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Reglas Cumplidas</h3>
                    <Badge variant={selectedTrade.reglas_cumplidas ? "default" : "destructive"}>
                      {selectedTrade.reglas_cumplidas ? "Sí" : "No"}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">RR</h3>
                    <p className="text-lg">{selectedTrade.rr || '-'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Ciclo Diario</h3>
                    <p className="text-lg">{selectedTrade.ciclo_diario || '-'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Inducción</h3>
                    <p className="text-lg">{selectedTrade.induccion || '-'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Liquidez</h3>
                    <p className="text-lg">{selectedTrade.liquidez || '-'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Tipo de Entrada</h3>
                    <p className="text-lg">{selectedTrade.tipo_entrada || '-'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">% Parcial</h3>
                    <p className="text-lg">{selectedTrade.parcial_porcentaje ? `${selectedTrade.parcial_porcentaje}%` : '-'}</p>
                  </div>
                </div>
              </div>
              
              {selectedTrade.notas && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Notas</h3>
                  <div className="bg-secondary/50 p-4 rounded-md">
                    <p className="whitespace-pre-wrap">{selectedTrade.notas}</p>
                  </div>
                </div>
              )}
              
              {selectedTrade.imagenes_urls && selectedTrade.imagenes_urls.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Imágenes</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedTrade.imagenes_urls.map((url, index) => (
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
