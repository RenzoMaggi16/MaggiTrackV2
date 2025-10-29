import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface AccountFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveSuccess?: (newAccount?: { id: string; account_name: string }) => void;
}

export function AccountFormDialog({ isOpen, onOpenChange, onSaveSuccess }: AccountFormDialogProps) {
  const [saving, setSaving] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [assetClass, setAssetClass] = useState<'futures' | 'forex' | 'crypto' | 'stocks' | 'other'>("futures");
  const [initialCapital, setInitialCapital] = useState<number>(0);

  const handleCreate = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuario no autenticado");
        return;
      }

      if (!accountName.trim()) {
        toast.error("El nombre de la cuenta es requerido");
        return;
      }
      if (initialCapital <= 0) {
        toast.error("El capital inicial debe ser mayor a 0");
        return;
      }

      const { data, error } = await supabase
        .from('accounts')
        .insert({
          user_id: user.id,
          account_name: accountName.trim(),
          account_type: 'personal',
          asset_class: assetClass,
          initial_capital: initialCapital,
          current_capital: initialCapital,
          funding_company: null,
          funding_target: null,
          funding_phases: null,
        })
        .select('id, account_name')
        .single();

      if (error) throw error;

      toast.success("Cuenta creada correctamente");
      onSaveSuccess?.(data || undefined);
      onOpenChange(false);
      setAccountName("");
      setInitialCapital(0);
      setAssetClass('futures');
    } catch (e: any) {
      console.error(e);
      toast.error("Error al crear la cuenta");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Nueva Cuenta</DialogTitle>
          <DialogDescription>Crea rápidamente una cuenta para registrar tu operación.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="account_name_quick">Nombre de la Cuenta *</Label>
            <Input id="account_name_quick" value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Ej: Cuenta Rápida" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="asset_class_quick">Clase de Activo *</Label>
            <Select value={assetClass} onValueChange={(v) => setAssetClass(v as any)}>
              <SelectTrigger id="asset_class_quick">
                <SelectValue placeholder="Selecciona clase de activo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="futures">Futuros</SelectItem>
                <SelectItem value="forex">Forex</SelectItem>
                <SelectItem value="crypto">Criptomonedas</SelectItem>
                <SelectItem value="stocks">Acciones</SelectItem>
                <SelectItem value="other">Otros</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="initial_capital_quick">Capital Inicial *</Label>
            <Input id="initial_capital_quick" type="number" min="0" step="0.01" value={initialCapital} onChange={(e) => setInitialCapital(parseFloat(e.target.value) || 0)} placeholder="0.00" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleCreate} disabled={saving}>{saving ? 'Creando...' : 'Crear'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AccountFormDialog;


