import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export const WelcomeMessage = () => {
  const [userName, setUserName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [tempName, setTempName] = useState(""); // Para el input del formulario
  const { toast } = useToast();

  const messages = [
    "¿listo para guardar tus trades?",
    "¿qué tal va ese análisis?",
    "¡a por esos pips!",
    "la disciplina es la clave.",
    "¡que tengas un gran día de trading!"
  ];

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          throw error;
        }

        if (data.user && data.user.user_metadata.first_name) {
          setUserName(data.user.user_metadata.first_name);
          // Elige un mensaje aleatorio
          const randomMsg = messages[Math.floor(Math.random() * messages.length)];
          setWelcomeMessage(randomMsg);
        } else {
          setUserName(null);
        }
      } catch (error) {
        console.error("Error al obtener datos del usuario:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos del usuario",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempName.trim()) return;

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.updateUser({
        data: { first_name: tempName } // Así se guarda en user_metadata
      });

      if (error) {
        throw error;
      } else if (data.user) {
        setUserName(data.user.user_metadata.first_name);
        // Elige un mensaje aleatorio
        const randomMsg = messages[Math.floor(Math.random() * messages.length)];
        setWelcomeMessage(randomMsg);
        
        toast({
          title: "¡Nombre guardado!",
          description: "Tu nombre se ha guardado correctamente",
        });
      }
    } catch (error) {
      console.error("Error al guardar el nombre:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar tu nombre",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-6  rounded-lg">
      {isLoading ? (
        <p className="text-center py-2">Cargando...</p>
      ) : userName ? (
        <h2 className="welcome-title">
          Hola de nuevo, <span className="highlighted-name">{userName}</span>. {welcomeMessage}
        </h2>
      ) : (
        <form onSubmit={handleSaveName} className="space-y-4">
          <h3 className="text-xl font-medium">¡Bienvenido! ¿Cómo te llamas?</h3>
          <Input
            type="text"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            placeholder="Escribe tu nombre..."
            className="max-w-md"
          />
          <Button type="submit">Guardar</Button>
        </form>
      )}
    </div>
  );
};