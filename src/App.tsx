import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import TradeDetail from "./pages/TradeDetail";
import AnalisisIA from "./pages/AnalisisIA";
import MisReglas from "./pages/MisReglas";
import ManageStrategies from "./pages/ManageStrategies";
import ManageAccounts from "./pages/ManageAccounts";
import ReportBuilder from "./pages/ReportBuilder";
import StrategyReport from "./pages/StrategyReport";
import Settings from "./pages/Settings";
import { ThemeProvider } from "./context/ThemeProvider";
import { ColorProvider } from "./context/ColorProvider";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="dark">
    <ColorProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/trades/:id" element={<TradeDetail />} />
              <Route path="/analisis" element={<AnalisisIA />} />
              <Route path="/reglas" element={<MisReglas />} />
              <Route path="/estrategias" element={<ManageStrategies />} />
              <Route path="/reporte-estrategia/:strategyId" element={<StrategyReport />} />
              <Route path="/cuentas" element={<ManageAccounts />} />
              <Route path="/reportes" element={<ReportBuilder />} />
              <Route path="/configuracion" element={<Settings />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ColorProvider>
  </ThemeProvider>
);

export default App;
