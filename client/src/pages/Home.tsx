import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Car, TrendingUp, DollarSign, Users } from 'lucide-react';

// DADOS ESTÁTICOS (Simulando o backend para funcionar na Vercel/GitHub Pages)
import dashboardData from '../data/dashboard_data.json';

// IMAGENS EM DATA URI (SVG Inline) para garantir carregamento sem dependência de arquivos externos
const LOGO_SRC = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 60'%3E%3Ctext x='10' y='40' font-family='Arial' font-weight='bold' font-size='30' fill='%23d5001c'%3EPORSCHE%3C/text%3E%3Ctext x='10' y='55' font-family='Arial' font-size='10' fill='%23333'%3EDASHBOARD INTELIGÊNCIA%3C/text%3E%3C/svg%3E";

const HEADER_SRC = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 300' preserveAspectRatio='none'%3E%3Crect width='1200' height='300' fill='%231a1a1a'/%3E%3Cpath d='M0 200 Q 300 100 600 200 T 1200 200 L 1200 300 L 0 300 Z' fill='%23d5001c' opacity='0.8'/%3E%3Ccircle cx='900' cy='100' r='50' fill='%23333' opacity='0.5'/%3E%3Ctext x='50' y='150' font-family='Arial' font-weight='bold' font-size='40' fill='white'%3EVENDAS E PERFORMANCE%3C/text%3E%3C/svg%3E";

const CHART_SRC = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%23f9f9f9'/%3E%3Crect x='50' y='100' width='40' height='80' fill='%23d5001c'/%3E%3Crect x='110' y='60' width='40' height='120' fill='%23333'/%3E%3Crect x='170' y='140' width='40' height='40' fill='%23d5001c'/%3E%3Crect x='230' y='80' width='40' height='100' fill='%23333'/%3E%3Crect x='290' y='40' width='40' height='140' fill='%23d5001c'/%3E%3Cline x1='40' y1='180' x2='360' y2='180' stroke='%23ccc'/%3E%3C/svg%3E";

export default function Home() {
  // Estado para paginação da tabela de Vendas
  const [currentPageVendas, setCurrentPageVendas] = useState(1);
  const itemsPerPageVendas = 5;

  // Estado para paginação da tabela de Modelos/Cidade
  const [currentPageModelos, setCurrentPageModelos] = useState(1);
  const itemsPerPageModelos = 5;

  // Cálculos de Paginação Vendas
  const totalPagesVendas = Math.ceil((dashboardData?.recent_sales || []).length / itemsPerPageVendas);
  const startIndexVendas = (currentPageVendas - 1) * itemsPerPageVendas;
  const currentVendas = (dashboardData?.recent_sales || [])
    .slice(startIndexVendas, startIndexVendas + itemsPerPageVendas);

  // Cálculos de Paginação Modelos
  const totalPagesModelos = Math.ceil((dashboardData?.top_models_by_city || []).length / itemsPerPageModelos);
  const startIndexModelos = (currentPageModelos - 1) * itemsPerPageModelos;
  const currentModelos = (dashboardData?.top_models_by_city || [])
    .slice(startIndexModelos, startIndexModelos + itemsPerPageModelos);

  const kpis = dashboardData?.kpis || {};
  const revenueByModel = dashboardData?.revenue_by_model || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img src={LOGO_SRC} alt="Porsche Logo" className="h-10 w-auto" />
          </div>
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString('pt-BR')}
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="bg-gray-900 text-white py-12 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl font-bold mb-4">Dashboard de Vendas</h1>
              <p className="text-xl text-gray-300 mb-6">
                Análise inteligente de performance e distribuição de modelos Porsche.
              </p>
              <div className="flex space-x-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{kpis.total_revenue || 'R$ 0'}</div>
                  <div className="text-sm text-gray-400">Receita Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{kpis.total_units || 0}</div>
                  <div className="text-sm text-gray-400">Unidades Vendidas</div>
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <img src={HEADER_SRC} alt="Hero Banner" className="rounded-lg shadow-lg w-full h-48 object-cover" />
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Média</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.avg_ticket || 'R$ 0'}</div>
              <p className="text-xs text-muted-foreground">Por veículo vendido</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Modelo Mais Vendido</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.top_model || '-'}</div>
              <p className="text-xs text-muted-foreground">Líder de mercado</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cidade Top</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.top_city || '-'}</div>
              <p className="text-xs text-muted-foreground">Maior volume de vendas</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de Receita por Modelo (Imagem Estática) */}
        <Card>
          <CardHeader>
            <CardTitle>Receita por Modelo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-md">
              <img src={CHART_SRC} alt="Gráfico de Receita" className="max-h-full max-w-full" />
            </div>
            <div className="mt-4 space-y-2">
              {revenueByModel.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.model}</span>
                  <span className="text-gray-600">{item.revenue}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Vendas Recentes (COM PAGINAÇÃO) */}
        <Card>
          <CardHeader>
            <CardTitle>Vendas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentVendas.length > 0 ? (
                  currentVendas.map((sale: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell>{sale.date}</TableCell>
                      <TableCell>{sale.model}</TableCell>
                      <TableCell>{sale.city}</TableCell>
                      <TableCell className="text-right">{sale.value}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">Nenhuma venda registrada</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            
            {/* Controles de Paginação Vendas */}
            {totalPagesVendas > 1 && (
              <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPageVendas(p => Math.max(1, p - 1))}
                  disabled={currentPageVendas === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-500">
                  Página {currentPageVendas} de {totalPagesVendas}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPageVendas(p => Math.min(totalPagesVendas, p + 1))}
                  disabled={currentPageVendas === totalPagesVendas}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabela de Modelos por Cidade (COM PAGINAÇÃO) */}
        <Card>
          <CardHeader>
            <CardTitle>Principais Modelos por Cidade</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cidade</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead className="text-right">Qtd Vendida</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentModelos.length > 0 ? (
                  currentModelos.map((item: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell>{item.city}</TableCell>
                      <TableCell>{item.model}</TableCell>
                      <TableCell className="text-right">{item.units}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4">Nenhum dado registrado</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Controles de Paginação Modelos */}
            {totalPagesModelos > 1 && (
              <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPageModelos(p => Math.max(1, p - 1))}
                  disabled={currentPageModelos === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-500">
                  Página {currentPageModelos} de {totalPagesModelos}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPageModelos(p => Math.min(totalPagesModelos, p + 1))}
                  disabled={currentPageModelos === totalPagesModelos}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-8 border-t text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Porsche Dashboard. Todos os direitos reservados.
      </footer>
    </div>
  );
}