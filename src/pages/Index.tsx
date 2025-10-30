import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Auth } from "@/components/Auth";
import { Dashboard } from "@/components/Dashboard";
import { TradeForm } from "@/components/TradeForm";
import { TradesTable } from "@/components/TradesTable";
import { Navbar } from "@/components/Navbar";
import { WelcomeMessage } from "@/components/WelcomeMessage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Plus, Table, FileBarChart } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-4">
            <TabsTrigger value="dashboard" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="add" className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Table className="h-4 w-4" />
              Trades
            </TabsTrigger>
            <TabsTrigger value="reportes" className="gap-2" asChild>
              <Link to="/reportes">
                <span className="inline-flex items-center gap-2"><FileBarChart className="h-4 w-4" /> Reportes</span>
              </Link>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <WelcomeMessage />
            <Dashboard />
          </TabsContent>

          <TabsContent value="add">
            <div className="max-w-2xl mx-auto">
              <TradeForm />
            </div>
          </TabsContent>

          <TabsContent value="history">
            <TradesTable />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
