import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Trash2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface Rule {
  id: string;
  rule_text: string;
  descripcion: string | null;
}

const MisReglas = () => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRule, setNewRule] = useState("");
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const { toast } = useToast();

  // Cargar reglas al iniciar
  useEffect(() => {
    fetchRules();
  }, []);

  // Función para obtener las reglas del usuario
  const fetchRules = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión para ver tus reglas",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("rules")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setRules(data || []);
    } catch (error) {
      console.error("Error al cargar las reglas:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar tus reglas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para añadir una nueva regla
  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newRule.trim()) {
      toast({
        title: "Error",
        description: "La regla no puede estar vacía",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      // 1. Obtener el usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("No hay un usuario autenticado.");
      }

      // 2. Construir el objeto con user_id y rule_text
      const { error } = await supabase.from("rules").insert({
        user_id: user.id,
        rule_text: newRule, // El campo rule_text almacena el texto de la regla
      });

      if (error) {
        // Este error viene de la API de Supabase
        throw error;
      }

      toast({
        title: "Éxito",
        description: "Regla añadida correctamente",
      });
      
      setNewRule("");
      fetchRules();
    } catch (error) {
      // 3. Mejorar el log del error para debugging
      console.error("Error detallado al añadir la regla:", error);
      toast({
        title: "Error",
        description: "No se pudo añadir la regla",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para actualizar una regla
  const handleUpdateRule = async () => {
    if (!editingRule || !editingRule.rule_text.trim()) {
      toast({
        title: "Error",
        description: "La regla no puede estar vacía",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from("rules")
        .update({ rule_text: editingRule.rule_text })
        .eq("id", editingRule.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Regla actualizada correctamente",
      });
      
      setEditingRule(null);
      fetchRules();
    } catch (error) {
      console.error("Error al actualizar la regla:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la regla",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar una regla
  const handleDeleteRule = async (id: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta regla?")) {
      try {
        setLoading(true);
        
        const { error } = await supabase
          .from("rules")
          .delete()
          .eq("id", id);

        if (error) throw error;

        toast({
          title: "Éxito",
          description: "Regla eliminada correctamente",
        });
        
        fetchRules();
      } catch (error) {
        console.error("Error al eliminar la regla:", error);
        toast({
          title: "Error",
          description: "No se pudo eliminar la regla",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <Link to="/" className="back-button">
          &larr; Volver al Dashboard
        </Link>
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Mis Reglas de Trading</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddRule} className="flex gap-2">
              <Input
                placeholder="Escribe una nueva regla de trading..."
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                disabled={loading}
                className="flex-1"
              />
              <Button type="submit" disabled={loading}>
                Añadir Regla
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mis Reglas</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && <p className="text-center py-4">Cargando...</p>}
            
            {!loading && rules.length === 0 && (
              <p className="text-center py-4 text-muted-foreground">
                No tienes reglas guardadas. ¡Añade tu primera regla!
              </p>
            )}

            <div className="space-y-4">
              {rules.map((rule) => (
                <div 
                  key={rule.id} 
                  className="p-4 border rounded-lg flex items-center justify-between"
                >
                  {editingRule?.id === rule.id ? (
                    <div className="flex-1 flex gap-2">
                      <Input
                        value={editingRule.rule_text}
                        onChange={(e) => setEditingRule({...editingRule, rule_text: e.target.value})}
                        className="flex-1"
                      />
                      <Button onClick={handleUpdateRule} size="icon">
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button 
                        onClick={() => setEditingRule(null)} 
                        variant="outline" 
                        size="icon"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1">{rule.rule_text}</span>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => setEditingRule(rule)} 
                          variant="ghost" 
                          size="icon"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          onClick={() => handleDeleteRule(rule.id)} 
                          variant="ghost" 
                          size="icon"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default MisReglas;