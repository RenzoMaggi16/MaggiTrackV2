import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart } from "lucide-react";

const StrategySelectionPage = () => {
  const [strategies, setStrategies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStrategies = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('strategies')
        .select('id, name')
        .eq('user_id', user.id)
        .order('name');

      if (!error) setStrategies(data || []);
      setIsLoading(false);
    };
    fetchStrategies();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Selecciona una Estrategia para ver el Reporte</h1>
        {isLoading ? (
          <p className="text-muted-foreground">Cargando estrategias...</p>
        ) : strategies.length === 0 ? (
          <p className="text-muted-foreground">No tienes estrategias creadas. Ve a Configuración &gt; Gestionar Estrategias para añadir una.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {strategies.map((strategy) => (
              <Card key={strategy.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{strategy.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Link to={`/reporte-estrategia/${strategy.id}`} className="w-full">
                    <Button variant="outline" className="w-full">
                      <LineChart className="h-4 w-4 mr-2" />
                      Ver Reporte
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default StrategySelectionPage;


