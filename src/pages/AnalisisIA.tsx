import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BrainCircuit, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface AnalysisResult {
  resumen: string;
  fortalezas: string[];
  areas_mejora: string[];
  consejos: string[];
  patron_emocional: string;
}

const AnalisisIA = () => {
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const handleAnalyzeClick = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analisis-ia');
      
      if (error) {
        throw new Error(error.message);
      }
      
      setAnalysisResult(data as AnalysisResult);
      toast.success("Análisis completado con éxito");
    } catch (error) {
      console.error("Error al analizar operaciones:", error);
      toast.error("Error al analizar operaciones: " + (error.message || "Ocurrió un error desconocido"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link 
            to="/" 
            className="inline-flex items-center px-4 py-2 rounded-md bg-secondary text-foreground hover:bg-secondary/80 transition-colors duration-200"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Dashboard
          </Link>
        </div>
        
        <div className="flex items-center justify-center mb-8">
          <div className="p-3 rounded-xl bg-primary/10 mr-3">
            <BrainCircuit className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Análisis con Inteligencia Artificial</h1>
        </div>

        {!analysisResult && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Analiza tu historial de trading</CardTitle>
              <CardDescription>
                Nuestra IA analizará tus operaciones y te proporcionará insights valiosos para mejorar tu desempeño.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleAnalyzeClick} 
                disabled={loading} 
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analizando operaciones...
                  </>
                ) : (
                  "Analizar Mis Operaciones"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {analysisResult && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumen General</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{analysisResult.resumen}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>✅ Fortalezas</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-2">
                  {analysisResult.fortalezas.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>📈 Áreas de Mejora</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-2">
                  {analysisResult.areas_mejora.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>💡 Consejos Accionables</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-2">
                  {analysisResult.consejos.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>🧠 Patrón Emocional</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{analysisResult.patron_emocional}</p>
              </CardContent>
            </Card>

            <div className="flex justify-center">
              <Button onClick={() => setAnalysisResult(null)} variant="outline">
                Realizar nuevo análisis
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AnalisisIA;