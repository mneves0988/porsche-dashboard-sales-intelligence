import { useState, useEffect, useMemo, useRef } from "react";
import { useDashboardData } from "@/hooks/useDashboardData";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell,
  AreaChart, Area,
  ResponsiveContainer, Legend,
} from "recharts";
import { Calendar } from "@/components/ui/calendar";
import { MapView } from "@/components/Map";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, X } from "lucide-react";
import { format, parseISO } from "date-fns";

const LOGO = "/manus-storage/logo_427673ed.svg";
const HEADER_IMG = "/manus-storage/header_4d825a6d.svg";
const SECAO1_IMG = "/manus-storage/secao_89bfffd1.svg";
const SECAO2_IMG = "/manus-storage/secao2_686f3189.svg";

const FAMILY_COLORS: Record<string, string> = {
  "911": "#da291c", "Taycan": "#c0a060", "Cayenne": "#4a90a4",
  "Macan": "#6b8e6b", "Panamera": "#8b6b8b", "718": "#c4a862",
};

const PAY_COLORS = ["#da291c", "#c0a060", "#4a90a4", "#6b8e6b", "#8b6b8b", "#c4a862", "#a0a0a0", "#5a5a5a", "#7a4a3a"];

const STATUS_COLORS: Record<string, string> = {
  "Delivered": "#4a90a4", "Pending": "#c0a060", "In Transit": "#8f8f8f",
  "Cancelled": "#da291c", "Shipped": "#c4a862", "Pending Approval": "#a0a0a0",
  "Awaiting Delivery": "#6b8e6b", "Awaiting Pickup": "#8b6b8b", "Pending Review": "#5a5a5a",
};

function formatCurrency(v: number): string {
  if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `$${(v / 1000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function formatNumber(v: number): string { return v.toLocaleString("en-US"); }

/* ─── Slicer (Power BI style) ─── */
function SlicerFilter({ label, options, selected, onChange }: {
  label: string; options: string[]; selected: string[]; onChange: (val: string[]) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => options.filter(o => o.toLowerCase().includes(search.toLowerCase())), [options, search]);
  const allSelected = selected.length === 0;

  const toggleItem = (item: string) => {
    if (selected.includes(item)) {
      onChange(selected.filter(s => s !== item));
    } else {
      onChange([...selected, item]);
    }
    setSearch("");
  };

  const removeItem = (item: string) => onChange(selected.filter(s => s !== item));

  return (
    <div>
      <label className="block text-[11px] tracking-[0.091em] uppercase text-[#8f8f8f] mb-2">{label}</label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between bg-[#111111] border border-[#303030] text-[12px] tracking-[0.083em] uppercase text-white hover:border-[#555] focus:border-[#da291c] min-h-[42px] rounded-none">
            <span className="truncate">{allSelected ? `Todos (${options.length})` : `${selected.length} selecionado${selected.length > 1 ? "s" : ""}`}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 bg-[#111111] border border-[#303030] rounded-none p-0 max-h-72 overflow-hidden flex flex-col">
          {/* Selected chips */}
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1 p-3 border-b border-[#303030] max-h-20 overflow-y-auto">
              {selected.map(item => (
                <span key={item} className="inline-flex items-center gap-1 bg-[#da291c]/20 text-[#da291c] text-[10px] uppercase tracking-wider px-2 py-0.5 border border-[#da291c]/40">
                  {item}
                  <X size={12} className="cursor-pointer hover:text-white" onClick={() => removeItem(item)} />
                </span>
              ))}
            </div>
          )}
          {/* Search */}
          <div className="px-3 py-2 border-b border-[#303030]">
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar..." className="w-full bg-[#0a0a0a] border border-[#303030] text-[11px] text-white px-2 py-1.5 focus:border-[#da291c] focus:outline-none placeholder:text-[#555]"
            />
          </div>
          {/* Items */}
          <div className="overflow-y-auto flex-1">
            {filtered.map(item => (
              <div key={item}
                onClick={() => toggleItem(item)}
                className={`flex items-center gap-2 px-3 py-2 text-[11px] uppercase tracking-wider cursor-pointer transition-colors ${
                  selected.includes(item) ? "bg-[#da291c]/10 text-[#da291c]" : "text-white hover:bg-[#1a1a1a]"
                }`}>
                <div className={`w-3 h-3 border flex items-center justify-center shrink-0 ${selected.includes(item) ? "border-[#da291c] bg-[#da291c]" : "border-[#555]"}`}>
                  {selected.includes(item) && <span className="text-white text-[8px]">&#10003;</span>}
                </div>
                <span className="truncate">{item}</span>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

/* ─── Date Range Picker ─── */
function DateRangePicker({ dateStart, dateEnd, dateRange, onChange }: {
  dateStart: string; dateEnd: string; dateRange: { min: string; max: string }; onChange: (start: string, end: string) => void;
}) {
  return (
    <div>
      <label className="block text-[11px] tracking-[0.091em] uppercase text-[#8f8f8f] mb-2">Período</label>
      <div className="flex gap-2 items-end">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="bg-[#111111] border border-[#303030] text-[11px] text-[#8f8f8f] hover:border-[#555] focus:border-[#da291c] min-h-[42px] rounded-none justify-start gap-2">
              <CalendarIcon size={14} />
              {dateStart ? format(parseISO(dateStart), "dd/MM/yyyy") : "Início"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-[#111111] border border-[#303030] rounded-none">
            <Calendar mode="single" selected={dateStart ? parseISO(dateStart) : undefined}
              onSelect={(d) => d && onChange(format(d, "yyyy-MM-dd"), dateEnd)}
              disabled={(d) => d < parseISO(dateRange.min) || d > parseISO(dateRange.max)}
              className="bg-[#111111] text-white [&_.rdp-button_selected]:bg-[#da291c]" />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="bg-[#111111] border border-[#303030] text-[11px] text-[#8f8f8f] hover:border-[#555] focus:border-[#da291c] min-h-[42px] rounded-none justify-start gap-2">
              <CalendarIcon size={14} />
              {dateEnd ? format(parseISO(dateEnd), "dd/MM/yyyy") : "Fim"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-[#111111] border border-[#303030] rounded-none">
            <Calendar mode="single" selected={dateEnd ? parseISO(dateEnd) : undefined}
              onSelect={(d) => d && onChange(dateStart, format(d, "yyyy-MM-dd"))}
              disabled={(d) => d < parseISO(dateRange.min) || d > parseISO(dateRange.max)}
              className="bg-[#111111] text-white [&_.rdp-button_selected]:bg-[#da291c]" />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

/* ─── Custom Legend for Pie Charts ─── */
function PieLegend({ data, colors }: { data: { name: string; value: number }[]; colors: string[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex flex-col gap-1 mt-2">
      {data.map((entry, i) => (
        <div key={entry.name} className="flex items-center gap-2 text-[11px]">
          <div className="w-3 h-3 shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
          <span className="text-[#8f8f8f]">{entry.name}</span>
          <span className="text-white ml-auto">{entry.value} ({total > 0 ? ((entry.value / total) * 100).toFixed(1) : 0}%)</span>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const { rawData, filters, aggregated, loading, updateFilter, clearFilters } = useDashboardData();
  const [loadingScreen, setLoadingScreen] = useState(true);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setLoadingScreen(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const kpis = aggregated?.kpis ?? { total_sales: 0, total_revenue: 0, avg_ticket: 0, unique_cities: 0, unique_states: 0, top_model: "", top_city: "", top_year: 0, top_pay_method: "" };

  const modelChartData = useMemo(() => {
    if (!aggregated?.salesByModel) return [];
    return Object.entries(aggregated.salesByModel).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([name, value]) => ({ name, value }));
  }, [aggregated?.salesByModel]);

  const familyChartData = useMemo(() => {
    if (!aggregated?.salesByFamily) return [];
    return Object.entries(aggregated.salesByFamily).map(([name, value]) => ({ name, value }));
  }, [aggregated?.salesByFamily]);

  const yearChartData = useMemo(() => {
    if (!aggregated?.salesByYear) return [];
    return Object.entries(aggregated.salesByYear).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([year, sales]) => ({ year: String(year), sales }));
  }, [aggregated?.salesByYear]);

  const payChartData = useMemo(() => {
    if (!aggregated?.salesByPay) return [];
    return Object.entries(aggregated.salesByPay).map(([name, value]) => ({ name, value }));
  }, [aggregated?.salesByPay]);

  const cityChartData = useMemo(() => {
    if (!aggregated?.topCitiesRevenue) return [];
    return Object.entries(aggregated.topCitiesRevenue).sort(([, a], [, b]) => b.revenue - a.revenue).map(([city, data]) => ({
      city: city.length > 12 ? city.substring(0, 12) + "..." : city,
      fullName: city, revenue: Math.round(data.revenue)
    }));
  }, [aggregated?.topCitiesRevenue]);

  const statusChartData = useMemo(() => {
    if (!aggregated?.statusDist) return [];
    return Object.entries(aggregated.statusDist).map(([name, value]) => ({ name, value }));
  }, [aggregated?.statusDist]);

  const statesChartData = useMemo(() => {
    if (!aggregated?.topStates) return [];
    return Object.entries(aggregated.topStates).map(([state, value]) => ({ state, value }));
  }, [aggregated?.topStates]);

  const chartTooltipStyle = { backgroundColor: "#181818", border: "1px solid #303030", borderRadius: 0, padding: "8px 12px", fontSize: "11px", fontFamily: "Inter, sans-serif", color: "#fff" };

  if (loadingScreen || loading) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <div className="text-center">
          <div className="text-[#da291c] text-2xl font-light tracking-[0.091em] uppercase animate-pulse">PORSCHE</div>
          <div className="mt-4 w-48 h-[1px] bg-[#303030] mx-auto overflow-hidden">
            <div className="h-full bg-[#da291c] animate-[loading_2s_ease-in-out_infinite]" style={{ width: "60%" }} />
          </div>
        </div>
      </div>
    );
  }

  if (!aggregated) return null;

  return (
    <div className="min-h-screen bg-[#000000] text-white">
      {/* Header */}
      <header className="border-b border-[#303030] bg-[#000000]">
        <div className="max-w-[1440px] mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={LOGO} alt="Porsche" className="h-12 w-auto" />
            <div>
              <h1 className="text-[16px] font-medium tracking-[0.005em] uppercase text-white">PORSCHE SALES INTELLIGENCE</h1>
              <p className="text-[11px] tracking-[0.083em] uppercase text-[#8f8f8f] mt-1">Luxury Automotive Analytics</p>
            </div>
          </div>
          <div />
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative w-full h-[340px] overflow-hidden">
        <img src={HEADER_IMG} alt="Porsche 911 Turbo S" className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#000000] via-[#000000]/70 to-transparent" />
        <div className="absolute inset-0 flex items-end pb-10 px-8">
          <div>
            <div className="w-12 h-[1px] bg-[#da291c] mb-4" />
            <h2 className="text-[32px] font-light tracking-[0.005em] text-white uppercase">Sales Intelligence</h2>
            <p className="text-[12px] tracking-[0.083em] uppercase text-[#8f8f8f] mt-2">Performance Analytics Dashboard</p>
          </div>
        </div>
      </section>

      {/* Filters - Power BI Style Slicers */}
      <section className="border-b border-[#303030] bg-[#0a0a0a]">
        <div className="max-w-[1440px] mx-auto px-6 py-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <SlicerFilter label="Modelo" options={aggregated.validModels} selected={filters.models} onChange={(v) => updateFilter("models", v)} />
            <div>
              <label className="block text-[11px] tracking-[0.091em] uppercase text-[#8f8f8f] mb-2">Model Year</label>
              <select value={filters.year} onChange={(e) => updateFilter("year", e.target.value)}
                className="w-full bg-[#111111] border border-[#303030] text-[12px] tracking-[0.083em] uppercase text-white px-3 py-2.5 focus:border-[#da291c] focus:outline-none appearance-none cursor-pointer hover:border-[#555] rounded-none">
                <option value="all">Todos os Anos</option>
                {aggregated.validYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <SlicerFilter label="Cidade" options={aggregated.validCities} selected={filters.cities} onChange={(v) => updateFilter("cities", v)} />
            <SlicerFilter label="Pagamento" options={aggregated.validPayMethods} selected={filters.payMethods} onChange={(v) => updateFilter("payMethods", v)} />
            <DateRangePicker dateStart={filters.dateStart} dateEnd={filters.dateEnd} dateRange={aggregated.dateRange} onChange={(s, e) => { updateFilter("dateStart", s); updateFilter("dateEnd", e); }} />
          </div>
          <div className="mt-3 flex items-center gap-2">
            {(filters.models.length > 0 || filters.cities.length > 0 || filters.payMethods.length > 0 || filters.year !== "all" || filters.dateStart || filters.dateEnd) && (
              <button onClick={clearFilters} className="px-4 py-1.5 border border-[#303030] text-[10px] tracking-[0.083em] uppercase text-[#8f8f8f] hover:text-[#da291c] hover:border-[#da291c] transition-colors duration-200">
                Limpar todos
              </button>
            )}
            {(filters.models.length > 0 || filters.cities.length > 0 || filters.payMethods.length > 0) && (
              <span className="text-[10px] text-[#555] tracking-wider uppercase">
                {filters.models.length + filters.cities.length + filters.payMethods.length} filtro(s) ativo(s)
              </span>
            )}
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="bg-[#000000]">
        <div className="max-w-[1440px] mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
            {[
              { label: "Vendas Totais", value: formatNumber(kpis.total_sales), sub: "veiculos comercializados" },
              { label: "Receita Total", value: formatCurrency(kpis.total_revenue), sub: "faturamento bruto" },
              { label: "Ticket Medio", value: formatCurrency(kpis.avg_ticket), sub: "por veiculo" },
              { label: "Cidades Atendidas", value: formatNumber(kpis.unique_cities), sub: `${kpis.unique_states} estados` },
            ].map((kpi, i) => (
              <div key={i} className="p-6 border-l border-[#303030] first:border-l-0">
                <p className="text-[11px] tracking-[0.091em] uppercase text-[#8f8f8f]">{kpi.label}</p>
                <p className="text-[32px] font-light text-white mt-2">{kpi.value}</p>
                <p className="text-[10px] tracking-[0.083em] uppercase text-[#555] mt-1">{kpi.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Executive Overview */}
      <section className="bg-[#0a0a0a] border-t border-[#303030] border-b border-[#303030]">
        <div className="max-w-[1440px] mx-auto px-6 py-8">
          <div className="flex items-start gap-6">
            <div className="w-[2px] bg-[#da291c] shrink-0 self-stretch" />
            <div>
              <p className="text-[11px] tracking-[0.091em] uppercase text-[#da291c] mb-3">Executive Overview</p>
              <p className="text-[13px] leading-[1.78] text-[#d2d2d2] max-w-[800px]">{aggregated.executiveSummary}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Charts Row 1 */}
      <section className="bg-[#000000]">
        <div className="max-w-[1440px] mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="border border-[#303030] p-6">
              <p className="text-[11px] tracking-[0.091em] uppercase text-[#8f8f8f] mb-1">Vendas por Modelo</p>
              <p className="text-[13px] text-white mb-6">Distribuicao de unidades por modelo</p>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={modelChartData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#303030" />
                  <XAxis type="number" stroke="#8f8f8f" fontSize={10} tickLine={false} />
                  <YAxis type="category" dataKey="name" stroke="#fff" fontSize={10} tickLine={false} width={100} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar dataKey="value" fill="#da291c" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="border border-[#303030] p-6">
              <p className="text-[11px] tracking-[0.091em] uppercase text-[#8f8f8f] mb-1">Familias de Modelo</p>
              <p className="text-[13px] text-white mb-6">Participacao de cada familia</p>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={familyChartData} cx="35%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={2} dataKey="value" label={false}>
                    {familyChartData.map((entry, index) => (
                      <Cell key={index} fill={FAMILY_COLORS[entry.name] || "#da291c"} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(value: number, name: string) => [value, name]} />
                </PieChart>
              </ResponsiveContainer>
              <PieLegend data={familyChartData} colors={familyChartData.map(e => FAMILY_COLORS[e.name] || "#da291c")} />
            </div>
          </div>
        </div>
      </section>

      {/* City Revenue with section image */}
      <section className="relative bg-[#0a0a0a] border-t border-[#303030] overflow-hidden">
        <img src={SECAO1_IMG} alt="" className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none" />
        <div className="absolute inset-0 bg-[#0a0a0a]/80" />
        <div className="relative max-w-[1440px] mx-auto px-6 py-8">
          <p className="text-[11px] tracking-[0.091em] uppercase text-[#8f8f8f] mb-1">Top 15 Cidades por Receita</p>
          <p className="text-[13px] text-white mb-6">Faturamento gerado nas principais cidades</p>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={cityChartData} margin={{ top: 5, right: 30, left: 10, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#303030" />
              <XAxis dataKey="city" stroke="#8f8f8f" fontSize={9} tickLine={false} angle={-30} textAnchor="end" height={60} />
              <YAxis stroke="#8f8f8f" fontSize={10} tickLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(value: number) => [`$${value.toLocaleString()}`, "Receita"]} />
              <Bar dataKey="revenue" fill="#c0a060" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Charts Row 2 */}
      <section className="bg-[#000000] border-t border-[#303030]">
        <div className="max-w-[1440px] mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="border border-[#303030] p-6">
              <p className="text-[11px] tracking-[0.091em] uppercase text-[#8f8f8f] mb-1">Tendencia Anual</p>
              <p className="text-[13px] text-white mb-6">Evolucao das vendas por ano</p>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={yearChartData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#da291c" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#da291c" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#303030" />
                  <XAxis dataKey="year" stroke="#8f8f8f" fontSize={10} tickLine={false} />
                  <YAxis stroke="#8f8f8f" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Area type="monotone" dataKey="sales" stroke="#da291c" strokeWidth={2} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="border border-[#303030] p-6">
              <p className="text-[11px] tracking-[0.091em] uppercase text-[#8f8f8f] mb-1">Formas de Pagamento</p>
              <p className="text-[13px] text-white mb-6">Distribuicao por metodo (unificados)</p>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={payChartData} cx="35%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={2} dataKey="value" label={false}>
                    {payChartData.map((entry, index) => (
                      <Cell key={index} fill={PAY_COLORS[index % PAY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(value: number, name: string) => [value, name]} />
                </PieChart>
              </ResponsiveContainer>
              <PieLegend data={payChartData} colors={PAY_COLORS} />
            </div>
          </div>
        </div>
      </section>

      {/* Charts Row 3 + Map */}
      <section className="bg-[#0a0a0a] border-t border-[#303030]">
        <div className="max-w-[1440px] mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="border border-[#303030] p-6">
              <p className="text-[11px] tracking-[0.091em] uppercase text-[#8f8f8f] mb-1">Status de Entrega</p>
              <p className="text-[13px] text-white mb-6">Distribuicao dos status</p>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={statusChartData} cx="35%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" label={false}>
                    {statusChartData.map((entry, index) => (
                      <Cell key={index} fill={STATUS_COLORS[entry.name] || "#8f8f8f"} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(value: number, name: string) => [value, name]} />
                </PieChart>
              </ResponsiveContainer>
              <PieLegend data={statusChartData} colors={statusChartData.map(e => STATUS_COLORS[e.name] || "#8f8f8f")} />
            </div>
            <div className="border border-[#303030] p-6">
              <p className="text-[11px] tracking-[0.091em] uppercase text-[#8f8f8f] mb-1">Top Estados</p>
              <p className="text-[13px] text-white mb-6">Vendas por estado</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statesChartData} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#303030" />
                  <XAxis dataKey="state" stroke="#8f8f8f" fontSize={10} tickLine={false} />
                  <YAxis stroke="#8f8f8f" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar dataKey="value" fill="#c0a060" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Interactive Map */}
          <div className="mt-8 border border-[#303030]">
            <div className="p-6 border-b border-[#303030]">
              <p className="text-[11px] tracking-[0.091em] uppercase text-[#8f8f8f] mb-1">Mapa de Vendas</p>
              <p className="text-[13px] text-white">Distribuicao geografica das cidades com vendas</p>
            </div>
            <div className="h-[500px] bg-[#0a0a0a]">
              <MapView
                initialCenter={{ lat: 39.8283, lng: -98.5795 }}
                initialZoom={4}
                onMapReady={(map) => {
                  // Add markers for each city
                  aggregated.cityDataForMap.forEach(cityData => {
                    if (window.google?.maps?.marker?.AdvancedMarkerElement) {
                      const marker = new window.google.maps.marker.AdvancedMarkerElement({
                        map,
                        position: { lat: cityData.lat, lng: cityData.lng },
                        title: `${cityData.city}, ${cityData.state} - ${cityData.count} vendas ($${(cityData.revenue / 1000).toFixed(0)}K)`,
                      });
                    }
                  });
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Luxury Insights */}
      <section className="bg-[#000000] border-t border-[#303030]">
        <div className="max-w-[1440px] mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
            <div className="border-r border-[#303030] pr-6 last:border-r-0 last:pr-0">
              <p className="text-[11px] tracking-[0.091em] uppercase text-[#da291c] mb-4">Modelos Mais Vendidos</p>
              {Object.entries(aggregated.top5Models).map(([model, count]) => (
                <div key={model} className="flex justify-between py-2 border-b border-[#1a1a1a]">
                  <span className="text-[12px] text-white">{model}</span>
                  <span className="text-[12px] text-[#8f8f8f]">{count} un.</span>
                </div>
              ))}
            </div>
            <div className="border-r border-[#303030] px-6 last:border-r-0 last:pr-0">
              <p className="text-[11px] tracking-[0.091em] uppercase text-[#da291c] mb-4">Top 5 Cidades</p>
              {Object.entries(aggregated.top5Cities).map(([city, count]) => (
                <div key={city} className="flex justify-between py-2 border-b border-[#1a1a1a]">
                  <span className="text-[12px] text-white">{city}</span>
                  <span className="text-[12px] text-[#8f8f8f]">{count} vendas</span>
                </div>
              ))}
            </div>
            <div className="px-6">
              <p className="text-[11px] tracking-[0.091em] uppercase text-[#da291c] mb-4">Formas de Pagamento</p>
              {Object.entries(aggregated.top5Pay).map(([pay, count]) => (
                <div key={pay} className="flex justify-between py-2 border-b border-[#1a1a1a]">
                  <span className="text-[12px] text-white">{pay}</span>
                  <span className="text-[12px] text-[#8f8f8f]">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Models by City Table */}
      <section className="bg-[#0a0a0a] border-t border-[#303030]">
        <div className="max-w-[1440px] mx-auto px-6 py-8">
          <p className="text-[11px] tracking-[0.091em] uppercase text-[#da291c] mb-2">Principais Modelos por Cidade</p>
          <p className="text-[12px] text-[#8f8f8f] mb-6">Qual modelo mais vendeu em cada cidade</p>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] tracking-[0.083em] uppercase">
              <thead>
                <tr className="border-b border-[#303030]">
                  <th className="text-left py-3 text-[#8f8f8f] font-normal">Cidade</th>
                  <th className="text-left py-3 text-[#8f8f8f] font-normal">Modelo Top</th>
                  <th className="text-right py-3 text-[#8f8f8f] font-normal">Vendas</th>
                  <th className="text-right py-3 text-[#8f8f8f] font-normal">Receita</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(aggregated.modelsByCity).sort(([, a], [, b]) => b.sales - a.sales).slice(0, 20).map(([city, data]) => (
                  <tr key={city} className="border-b border-[#1a1a1a] hover:bg-[#111] transition-colors">
                    <td className="py-3 text-white">{city}</td>
                    <td className="py-3 text-white">{data.model}</td>
                    <td className="py-3 text-right text-[#8f8f8f]">{data.sales}</td>
                    <td className="py-3 text-right text-[#8f8f8f]">${formatNumber(Math.round(data.revenue))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Full-bleed Image Break */}
      <section className="relative w-full h-[300px] overflow-hidden">
        <img src={SECAO2_IMG} alt="Porsche 911 Turbo" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[#000000]/50" />
      </section>

      {/* Records Table */}
      <section className="bg-[#000000]">
        <div className="max-w-[1440px] mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[16px] font-light tracking-[0.005em] uppercase text-white">Registro de Vendas</p>
              <p className="text-[11px] tracking-[0.083em] uppercase text-[#8f8f8f] mt-1">
                Mostrando {aggregated.filteredRecords.length} registros validos
              </p>
            </div>
          </div>
          <div className="overflow-x-auto border border-[#303030]">
            <table className="w-full text-[11px] tracking-[0.083em] uppercase">
              <thead>
                <tr className="bg-[#0a0a0a] border-b border-[#303030]">
                  {["ID", "Data", "Modelo", "Ano", "Preco", "Quilometragem", "Pagamento", "Cidade", "Vendedor", "Status"].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-[#8f8f8f] font-normal whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {aggregated.filteredRecords.slice(0, 50).map((record, i) => (
                  <tr key={i} className="border-b border-[#1a1a1a] hover:bg-[#0a0a0a] transition-colors">
                    <td className="py-3 px-4 text-[#8f8f8f]">{record.sale_id}</td>
                    <td className="py-3 px-4 text-[#8f8f8f]">{record.SaleDate}</td>
                    <td className="py-3 px-4 text-white">{record.Model}</td>
                    <td className="py-3 px-4 text-[#8f8f8f]">{record.ModelYear}</td>
                    <td className="py-3 px-4 text-white">${record.Price ? formatNumber(parseInt(record.Price)) : "—"}</td>
                    <td className="py-3 px-4 text-[#8f8f8f]">{record.Mileage ? `${record.Mileage} mi` : "—"}</td>
                    <td className="py-3 px-4 text-[#8f8f8f]">{record.PayMethod}</td>
                    <td className="py-3 px-4 text-[#8f8f8f]">{record.City}, {record.State}</td>
                    <td className="py-3 px-4 text-[#8f8f8f]">{record.salesperson}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 text-[9px] tracking-[0.091em] uppercase border ${
                        record.Status === "Delivered" ? "text-[#4a90a4] border-[#4a90a4]" :
                        record.Status === "Pending" ? "text-[#c0a060] border-[#c0a060]" :
                        record.Status === "In Transit" ? "text-[#8f8f8f] border-[#8f8f8f]" :
                        record.Status === "Shipped" ? "text-[#c4a862] border-[#c4a862]" :
                        "text-[#da291c] border-[#da291c]"
                      }`}>{record.Status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Full-bleed Image Break */}
      <section className="relative w-full h-[200px] overflow-hidden">
        <img src={SECAO1_IMG} alt="Porsche GT3" className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-[#000000]/40" />
      </section>

      {/* Footer */}
      <footer className="bg-[#181818] border-t border-[#303030]">
        <div className="max-w-[1440px] mx-auto px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={LOGO} alt="Porsche" className="h-8 w-auto opacity-60" />
          </div>
          <p className="text-[11px] tracking-[0.083em] uppercase text-[#8f8f8f]">
            Porsche Sales Intelligence Dashboard &copy; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
