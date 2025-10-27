import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Plus, Trash2, Filter, Download, FileText } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Tipos para la configuración del reporte
interface DateRange {
  start: string;
  end: string;
}

interface Filter {
  id: string;
  column: string;
  operator: string;
  value: string;
}

interface ReportConfig {
  date_range?: DateRange;
  columns: string[];
  filters?: Filter[];
  group_by?: string[];
  aggregations?: { column: string; function: string }[];
  order_by?: { column: string; direction: 'ASC' | 'DESC' };
}

// Columnas disponibles en la tabla trades
const AVAILABLE_COLUMNS = [
  { value: 'id', label: 'ID' },
  { value: 'entry_time', label: 'Fecha Entrada' },
  { value: 'exit_time', label: 'Fecha Salida' },
  { value: 'par', label: 'Par' },
  { value: 'pnl_neto', label: 'PnL Neto' },
  { value: 'riesgo', label: 'Riesgo' },
  { value: 'trade_type', label: 'Tipo de Trade' },
  { value: 'setup_rating', label: 'Calificación Setup' },
  { value: 'strategy_id', label: 'ID Estrategia' },
  { value: 'account_id', label: 'ID Cuenta' },
  { value: 'created_at', label: 'Fecha Creación' },
];

// Operadores disponibles para filtros
const OPERATORS = [
  { value: '=', label: 'Igual a' },
  { value: '!=', label: 'Diferente de' },
  { value: '>', label: 'Mayor que' },
  { value: '>=', label: 'Mayor o igual que' },
  { value: '<', label: 'Menor que' },
  { value: '<=', label: 'Menor o igual que' },
  { value: 'LIKE', label: 'Contiene' },
  { value: 'NOT LIKE', label: 'No contiene' },
  { value: 'IN', label: 'Está en' },
  { value: 'NOT IN', label: 'No está en' },
];

// Funciones de agregación disponibles
const AGGREGATION_FUNCTIONS = [
  { value: 'SUM', label: 'Suma' },
  { value: 'AVG', label: 'Promedio' },
  { value: 'COUNT', label: 'Contar' },
  { value: 'MIN', label: 'Mínimo' },
  { value: 'MAX', label: 'Máximo' },
];

export const ReportBuilder = () => {
  // Estados para la configuración del reporte
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(['par', 'pnl_neto', 'entry_time']);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [groupBy, setGroupBy] = useState<string[]>([]);
  const [aggregations, setAggregations] = useState<{ column: string; function: string }[]>([]);
  const [orderByColumn, setOrderByColumn] = useState<string>('');
  const [orderByDirection, setOrderByDirection] = useState<'ASC' | 'DESC'>('DESC');

  // Estados para los resultados
  const [reportData, setReportData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función para añadir un filtro
  const addFilter = () => {
    const newFilter: Filter = {
      id: Date.now().toString(),
      column: '',
      operator: '=',
      value: '',
    };
    setFilters([...filters, newFilter]);
  };

  // Función para eliminar un filtro
  const removeFilter = (filterId: string) => {
    setFilters(filters.filter(f => f.id !== filterId));
  };

  // Función para actualizar un filtro
  const updateFilter = (filterId: string, field: keyof Filter, value: string) => {
    setFilters(filters.map(f => 
      f.id === filterId ? { ...f, [field]: value } : f
    ));
  };

  // Función para añadir agregación
  const addAggregation = () => {
    setAggregations([...aggregations, { column: '', function: 'SUM' }]);
  };

  // Función para eliminar agregación
  const removeAggregation = (index: number) => {
    setAggregations(aggregations.filter((_, i) => i !== index));
  };

  // Función para actualizar agregación
  const updateAggregation = (index: number, field: 'column' | 'function', value: string) => {
    setAggregations(aggregations.map((agg, i) => 
      i === index ? { ...agg, [field]: value } : agg
    ));
  };

  // Función para generar el reporte
  const handleGenerateReport = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Construir la configuración del reporte
      const config: ReportConfig = {
        columns: selectedColumns,
      };

      // Añadir rango de fechas si está definido
      if (startDate && endDate) {
        config.date_range = {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        };
      }

      // Añadir filtros si existen
      if (filters.length > 0) {
        config.filters = filters.filter(f => f.column && f.value);
      }

      // Añadir agrupación si está definida
      if (groupBy.length > 0) {
        config.group_by = groupBy;
        if (aggregations.length > 0) {
          config.aggregations = aggregations.filter(agg => agg.column);
        }
      }

      // Añadir ordenamiento si está definido
      if (orderByColumn) {
        config.order_by = {
          column: orderByColumn,
          direction: orderByDirection,
        };
      }

      // Llamar a la función RPC
      const { data, error } = await supabase.rpc('create_custom_report', { 
        config: config 
      });

      if (error) {
        throw error;
      }

      setReportData(data || []);
      toast.success(`Reporte generado con ${data?.length || 0} registros`);
    } catch (err: any) {
      console.error('Error generando reporte:', err);
      setError(err.message || 'Error al generar el reporte');
      toast.error('Error al generar el reporte');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para exportar a CSV
  const exportToCSV = () => {
    if (reportData.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    // Obtener las columnas del primer objeto
    const columns = Object.keys(reportData[0]);
    
    // Crear el header CSV
    const headers = columns.join(',');
    
    // Crear las filas CSV
    const rows = reportData.map(row => 
      columns.map(col => {
        const value = row[col];
        // Escapar comillas y envolver en comillas si contiene comas
        const stringValue = String(value || '');
        return stringValue.includes(',') ? `"${stringValue.replace(/"/g, '""')}"` : stringValue;
      }).join(',')
    );
    
    // Combinar header y filas
    const csvContent = [headers, ...rows].join('\n');
    
    // Crear y descargar el archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Reporte exportado exitosamente');
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Constructor de Reportes</h1>
          <p className="text-muted-foreground mt-2">
            Crea reportes personalizados de tus trades con filtros y agrupaciones
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleGenerateReport} disabled={isLoading} className="gap-2">
            <FileText className="h-4 w-4" />
            {isLoading ? 'Generando...' : 'Generar Reporte'}
          </Button>
          {reportData.length > 0 && (
            <Button onClick={exportToCSV} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sección de Configuración */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Configuración del Reporte
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Rango de Fechas */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Rango de Fechas</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Desde</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "dd/MM/yyyy") : "Seleccionar fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">Hasta</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "dd/MM/yyyy") : "Seleccionar fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Columnas a Mostrar */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Columnas a Mostrar</Label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {AVAILABLE_COLUMNS.map((column) => (
                  <div key={column.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={column.value}
                      checked={selectedColumns.includes(column.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedColumns([...selectedColumns, column.value]);
                        } else {
                          setSelectedColumns(selectedColumns.filter(col => col !== column.value));
                        }
                      }}
                    />
                    <Label htmlFor={column.value} className="text-sm">
                      {column.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Filtros */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Filtros</Label>
                <Button onClick={addFilter} size="sm" variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Añadir Filtro
                </Button>
              </div>
              <div className="space-y-3">
                {filters.map((filter) => (
                  <div key={filter.id} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label htmlFor={`filter-column-${filter.id}`}>Columna</Label>
                      <Select
                        value={filter.column}
                        onValueChange={(value) => updateFilter(filter.id, 'column', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar columna" />
                        </SelectTrigger>
                        <SelectContent>
                          {AVAILABLE_COLUMNS.map((column) => (
                            <SelectItem key={column.value} value={column.value}>
                              {column.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <Label htmlFor={`filter-operator-${filter.id}`}>Operador</Label>
                      <Select
                        value={filter.operator}
                        onValueChange={(value) => updateFilter(filter.id, 'operator', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Operador" />
                        </SelectTrigger>
                        <SelectContent>
                          {OPERATORS.map((op) => (
                            <SelectItem key={op.value} value={op.value}>
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <Label htmlFor={`filter-value-${filter.id}`}>Valor</Label>
                      <Input
                        id={`filter-value-${filter.id}`}
                        value={filter.value}
                        onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                        placeholder="Valor del filtro"
                      />
                    </div>
                    <Button
                      onClick={() => removeFilter(filter.id)}
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Agrupación */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Agrupación (Opcional)</Label>
              <div className="space-y-2">
                <Label htmlFor="group-by">Agrupar por</Label>
                <Select
                  value={groupBy[0] || ''}
                  onValueChange={(value) => setGroupBy(value ? [value] : [])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar columna para agrupar" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_COLUMNS.map((column) => (
                      <SelectItem key={column.value} value={column.value}>
                        {column.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {groupBy.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Agregaciones</Label>
                    <Button onClick={addAggregation} size="sm" variant="outline" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Añadir
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {aggregations.map((agg, index) => (
                      <div key={index} className="flex gap-2 items-end">
                        <div className="flex-1">
                          <Label>Columna</Label>
                          <Select
                            value={agg.column}
                            onValueChange={(value) => updateAggregation(index, 'column', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar columna" />
                            </SelectTrigger>
                            <SelectContent>
                              {AVAILABLE_COLUMNS.map((column) => (
                                <SelectItem key={column.value} value={column.value}>
                                  {column.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex-1">
                          <Label>Función</Label>
                          <Select
                            value={agg.function}
                            onValueChange={(value) => updateAggregation(index, 'function', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Función" />
                            </SelectTrigger>
                            <SelectContent>
                              {AGGREGATION_FUNCTIONS.map((func) => (
                                <SelectItem key={func.value} value={func.value}>
                                  {func.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          onClick={() => removeAggregation(index)}
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Ordenamiento */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Ordenamiento</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="order-by-column">Columna</Label>
                  <Select value={orderByColumn} onValueChange={setOrderByColumn}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar columna" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_COLUMNS.map((column) => (
                        <SelectItem key={column.value} value={column.value}>
                          {column.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Dirección</Label>
                  <RadioGroup value={orderByDirection} onValueChange={(value: 'ASC' | 'DESC') => setOrderByDirection(value)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="ASC" id="asc" />
                      <Label htmlFor="asc">Ascendente</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="DESC" id="desc" />
                      <Label htmlFor="desc">Descendente</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sección de Resultados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Resultados del Reporte
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Generando reporte...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={handleGenerateReport} variant="outline">
                  Reintentar
                </Button>
              </div>
            ) : reportData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay datos para mostrar</p>
                <p className="text-sm">Configura y genera un reporte para ver los resultados</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="gap-2">
                    <FileText className="h-3 w-3" />
                    {reportData.length} registros
                  </Badge>
                </div>
                
                <div className="overflow-x-auto max-h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {Object.keys(reportData[0]).map((column) => (
                          <TableHead key={column} className="whitespace-nowrap">
                            {AVAILABLE_COLUMNS.find(col => col.value === column)?.label || column}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.map((row, index) => (
                        <TableRow key={index}>
                          {Object.values(row).map((value, cellIndex) => (
                            <TableCell key={cellIndex} className="whitespace-nowrap">
                              {value !== null && value !== undefined ? String(value) : '-'}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportBuilder;

