import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Wallet, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

// Usar tipos de Supabase
type Account = Tables<'accounts'>;

interface FormData {
  account_name: string;
  account_type: 'personal' | 'evaluation' | 'live';
  asset_class: 'futures' | 'forex' | 'crypto' | 'stocks' | 'other';
  initial_capital: number;
  funding_company: string;
  funding_phases: number; // 1 o 2 para evaluación
  funding_target_1: number; // objetivo fase 1
  funding_target_2: number; // objetivo fase 2 (opcional)
}

const ManageAccounts = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState<FormData>({
    account_name: '',
    account_type: 'personal',
    asset_class: 'futures',
    initial_capital: 0,
    funding_company: '',
    funding_phases: 1,
    funding_target_1: 0,
    funding_target_2: 0,
  });

  // Cargar cuentas al montar el componente
  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Usuario no autenticado");
        return;
      }

      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading accounts:', error);
        toast.error("Error al cargar las cuentas");
        return;
      }

      setAccounts(data || []);
    } catch (error) {
      console.error('Error loading accounts:', error);
      toast.error("Error al cargar las cuentas");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      account_name: '',
      account_type: 'personal',
      asset_class: 'futures',
      initial_capital: 0,
      funding_company: '',
      funding_phases: 1,
      funding_target_1: 0,
      funding_target_2: 0,
    });
  };

  const handleOpenDialog = (account?: Account) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        account_name: account.account_name,
        account_type: account.account_type === 'funded' ? 'evaluation' : 'personal',
        asset_class: account.asset_class,
        initial_capital: account.initial_capital,
        funding_company: account.funding_company || '',
        funding_phases: account.funding_phases || 1,
        funding_target_1: account.funding_target || 0,
        funding_target_2: 0,
      });
    } else {
      setEditingAccount(null);
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Usuario no autenticado");
        return;
      }

      // Validar campos requeridos
      if (!formData.account_name.trim()) {
        toast.error("El nombre de la cuenta es requerido");
        return;
      }

      if (formData.initial_capital <= 0) {
        toast.error("El capital inicial debe ser mayor a 0");
        return;
      }

      if (formData.account_type === 'evaluation') {
        if (!formData.funding_company.trim()) {
          toast.error("La empresa de funding es requerida para Evaluación");
          return;
        }
        if (formData.funding_phases !== 1 && formData.funding_phases !== 2) {
          toast.error("Selecciona 1 o 2 fases");
          return;
        }
        if (formData.funding_target_1 <= 0) {
          toast.error("Objetivo Fase 1 debe ser mayor a 0");
          return;
        }
        if (formData.funding_phases === 2 && formData.funding_target_2 <= 0) {
          toast.error("Objetivo Fase 2 debe ser mayor a 0");
          return;
        }
      }

      if (formData.account_type === 'live') {
        if (!formData.funding_company.trim()) {
          toast.error("La empresa de funding es requerida para Live");
          return;
        }
      }

      const accountData = {
        account_name: formData.account_name.trim(),
        account_type: (formData.account_type === 'evaluation' || formData.account_type === 'live') ? 'funded' : 'personal',
        asset_class: formData.asset_class,
        initial_capital: formData.initial_capital,
        funding_company: (formData.account_type === 'evaluation' || formData.account_type === 'live') ? formData.funding_company.trim() : null,
        funding_target: formData.account_type === 'evaluation' ? formData.funding_target_1 : null,
        funding_phases: formData.account_type === 'evaluation' ? formData.funding_phases : null,
      };

      if (editingAccount) {
        // Actualizar cuenta existente
        const { error } = await supabase
          .from('accounts')
          .update({
            ...accountData,
            current_capital: editingAccount.current_capital, // Mantener el capital actual
          })
          .eq('id', editingAccount.id);

        if (error) {
          console.error('Error updating account:', error);
          toast.error("Error al actualizar la cuenta");
          return;
        }

        toast.success("Cuenta actualizada correctamente");
      } else {
        // Crear nueva cuenta
        const { error } = await supabase
          .from('accounts')
          .insert({
            ...accountData,
            user_id: user.id,
            current_capital: formData.initial_capital, // Al crear, el capital actual = capital inicial
          });

        if (error) {
          console.error('Error creating account:', error);
          toast.error("Error al crear la cuenta");
          return;
        }

        toast.success("Cuenta creada correctamente");
      }

      setIsDialogOpen(false);
      resetForm();
      loadAccounts();
    } catch (error) {
      console.error('Error saving account:', error);
      toast.error("Error al guardar la cuenta");
    }
  };

  const handleDelete = async (accountId: string) => {
    try {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', accountId);

      if (error) {
        console.error('Error deleting account:', error);
        toast.error("Error al eliminar la cuenta");
        return;
      }

      toast.success("Cuenta eliminada correctamente");
      loadAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error("Error al eliminar la cuenta");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getAssetClassLabel = (assetClass: string) => {
    const labels = {
      futures: 'Futuros',
      forex: 'Forex',
      crypto: 'Criptomonedas',
      stocks: 'Acciones',
      other: 'Otros'
    };
    return labels[assetClass as keyof typeof labels] || assetClass;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando cuentas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Gestionar Cuentas</h1>
          <p className="text-muted-foreground mt-2">
            Administra tus cuentas de trading y su configuración
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Cuenta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingAccount ? 'Editar Cuenta' : 'Nueva Cuenta'}
              </DialogTitle>
              <DialogDescription>
                {editingAccount 
                  ? 'Modifica los datos de tu cuenta de trading.'
                  : 'Crea una nueva cuenta de trading para gestionar tus operaciones.'
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="account_name">Nombre de la Cuenta *</Label>
                <Input
                  id="account_name"
                  value={formData.account_name}
                  onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                  placeholder="Ej: Mi Cuenta Principal"
                />
              </div>

              <div className="grid gap-2">
                <Label>Tipo de Cuenta *</Label>
                <RadioGroup
                  value={formData.account_type}
                  onValueChange={(value: 'personal' | 'evaluation' | 'live') => 
                    setFormData({ ...formData, account_type: value })
                  }
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="personal" id="personal" />
                    <Label htmlFor="personal">Personal</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="evaluation" id="evaluation" />
                    <Label htmlFor="evaluation">Evaluación (Prueba)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="live" id="live" />
                    <Label htmlFor="live">Fondeada (Live)</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="asset_class">Clase de Activo *</Label>
                <Select
                  value={formData.asset_class}
                  onValueChange={(value: 'futures' | 'forex' | 'crypto' | 'stocks' | 'other') => 
                    setFormData({ ...formData, asset_class: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una clase de activo" />
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
                <Label htmlFor="initial_capital">Capital Inicial *</Label>
                <Input
                  id="initial_capital"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.initial_capital}
                  onChange={(e) => setFormData({ ...formData, initial_capital: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>

              {(formData.account_type === 'evaluation' || formData.account_type === 'live') && (
                <div className="grid gap-2">
                  <Label htmlFor="funding_company">Empresa de Fondeo *</Label>
                  <Input
                    id="funding_company"
                    value={formData.funding_company}
                    onChange={(e) => setFormData({ ...formData, funding_company: e.target.value })}
                    placeholder="Ej: Apex, Topstep"
                  />
                </div>
              )}

              {formData.account_type === 'evaluation' && (
                <>
                  <div className="grid gap-2">
                    <Label>Fases de Evaluación</Label>
                    <RadioGroup
                      value={formData.funding_phases.toString()}
                      onValueChange={(value) => setFormData({ ...formData, funding_phases: parseInt(value) })}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="1" id="fase1" />
                        <Label htmlFor="fase1">1 Fase</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="2" id="fase2" />
                        <Label htmlFor="fase2">2 Fases</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="funding_target_1">Objetivo Fase 1 ($)</Label>
                      <Input
                        id="funding_target_1"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.funding_target_1}
                        onChange={(e) => setFormData({ ...formData, funding_target_1: parseFloat(e.target.value) || 0 })}
                        placeholder="Ej: 6000"
                      />
                    </div>

                    {formData.funding_phases === 2 && (
                      <div className="grid gap-2">
                        <Label htmlFor="funding_target_2">Objetivo Fase 2 ($)</Label>
                        <Input
                          id="funding_target_2"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.funding_target_2}
                          onChange={(e) => setFormData({ ...formData, funding_target_2: parseFloat(e.target.value) || 0 })}
                          placeholder="Ej: 3000"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {editingAccount ? 'Actualizar' : 'Crear'} Cuenta
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mx-auto max-w-5xl">
      {accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tienes cuentas registradas</h3>
            <p className="text-muted-foreground text-center mb-4">
              Crea tu primera cuenta de trading para comenzar a gestionar tus operaciones.
            </p>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Crear Primera Cuenta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 justify-items-center">
          {accounts.map((account) => (
            <Card key={account.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{account.account_name}</CardTitle>
                    <CardDescription className="mt-1">
                      {getAssetClassLabel(account.asset_class)} • {account.account_type === 'personal' ? 'Personal' : 'Funded'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(account)}
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar cuenta?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente la cuenta "{account.account_name}" y todos sus datos asociados.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(account.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Capital Inicial:</span>
                    <span className="font-medium">{formatCurrency(account.initial_capital)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Capital Actual:</span>
                    <span className="font-medium">{formatCurrency(account.current_capital)}</span>
                  </div>
                  {account.account_type === 'funded' && (
                    <>
                      {account.funding_company && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Empresa:</span>
                          <span className="font-medium">{account.funding_company}</span>
                        </div>
                      )}
                      {account.funding_target && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Objetivo:</span>
                          <span className="font-medium">{formatCurrency(account.funding_target)}</span>
                        </div>
                      )}
                      {account.funding_phases && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Fases:</span>
                          <span className="font-medium">{account.funding_phases}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>

      <div className="mt-8 text-center">
        <Link to="/">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default ManageAccounts;
