import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip as RechartsTooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Legend, 
  AreaChart, 
  Area 
} from 'recharts';
import { Project, Task, TeamMember, Invoice } from '../types';
import { 
  PieChart as PieIcon, 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Filter,
  SlidersHorizontal,
  RotateCcw,
  X,
  Sparkles,
  Info
} from 'lucide-react';

interface DashboardChartsProps {
  projects: Project[];
  tasks: Task[];
  teamMembers: TeamMember[];
  invoices: Invoice[];
  allProjects?: Project[];
  allTasks?: Task[];
  selectedProjectId?: string;
  onSelectProject?: (id: string) => void;
  selectedStatusFilter?: string | null;
  onSelectStatus?: (status: string | null) => void;
  selectedMemberFilter?: string | null;
  onSelectMember?: (memberId: string | null) => void;
  onResetFilters?: () => void;
}

export default function DashboardCharts({ 
  projects, 
  tasks, 
  teamMembers, 
  invoices,
  allProjects,
  allTasks,
  selectedProjectId = 'ALL',
  onSelectProject,
  selectedStatusFilter = null,
  onSelectStatus,
  selectedMemberFilter = null,
  onSelectMember,
  onResetFilters,
}: DashboardChartsProps) {
  const [chartView, setChartView] = useState<'all' | 'portfolio' | 'financial' | 'team'>('all');
  const allProjectsList = allProjects || projects;
  const activeProjectObj = selectedProjectId !== 'ALL' 
    ? allProjectsList.find(p => p.id === selectedProjectId)
    : null;
  const activeMemberObj = selectedMemberFilter
    ? teamMembers.find(m => m.id === selectedMemberFilter)
    : null;

  const hasActiveFilters = (selectedProjectId && selectedProjectId !== 'ALL') || Boolean(selectedStatusFilter) || Boolean(selectedMemberFilter);

  // 1. Portfolio by Status Data (Pie / Donut) with Capricorn palette
  const statusCounts: Record<string, number> = {
    'En curso': 0,
    'Completado': 0,
    'En espera': 0,
    'No iniciado': 0,
  };

  projects.forEach(p => {
    if (statusCounts[p.status] !== undefined) {
      statusCounts[p.status] += 1;
    } else {
      statusCounts['En curso'] += 1;
    }
  });

  const portfolioStatusData = [
    { name: 'En curso', value: statusCounts['En curso'], color: '#1e3a8a' }, // Deep Corporate Blue
    { name: 'Completado', value: statusCounts['Completado'], color: '#0f766e' }, // Deep Teal / Emerald
    { name: 'En espera', value: statusCounts['En espera'], color: '#ea580c' }, // Capricorn Orange
    { name: 'No iniciado', value: statusCounts['No iniciado'], color: '#64748b' }, // Slate Gray
  ].filter(d => d.value > 0);

  // 2. Team Workload Data (Bar Chart)
  const teamWorkloadData = teamMembers.map(member => {
    const memberTasks = tasks.filter(t => t.owner_id === member.id);
    const activeTasks = memberTasks.filter(t => !t.is_done && t.status !== 'Completado').length;
    const completedTasks = memberTasks.filter(t => t.is_done || t.status === 'Completado').length;
    const leadProjects = projects.filter(p => p.responsible_id === member.id || p.accountable_id === member.id).length;

    return {
      id: member.id,
      name: member.name.split(' ')[0] || member.name,
      fullName: member.name,
      role: member.role,
      activas: activeTasks,
      completadas: completedTasks,
      proyectos: leadProjects,
    };
  }).slice(0, 7);

  // 3. Financial & Invoicing Breakdown
  const totalBudget = projects.reduce((acc, p) => acc + (Number(p.estimated_value) || 0), 0);
  const paidInvoicesAmount = invoices
    .filter(i => i.status === 'Pagada')
    .reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
  const pendingInvoicesAmount = invoices
    .filter(i => i.status === 'Enviada' || i.status === 'Aún no enviado')
    .reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
  const overdueInvoicesAmount = invoices
    .filter(i => i.status === 'Atrasada')
    .reduce((acc, i) => acc + (Number(i.amount) || 0), 0);

  // 4. Project Progress & Health Bars
  const topProjectsProgress = (selectedProjectId !== 'ALL' && activeProjectObj ? [activeProjectObj] : projects.slice(0, 6)).map(p => ({
    id: p.id,
    name: p.name.length > 20 ? p.name.slice(0, 20) + '…' : p.name,
    fullName: p.name,
    progreso: p.progress_percentage || 0,
    status: p.status,
    priority: p.priority,
  }));

  // Custom Recharts Tooltip styling
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0f172a] text-white p-3 rounded-lg shadow-xl border border-slate-700 text-xs space-y-1">
          <p className="font-bold text-slate-100">{label || payload[0].name}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="flex items-center gap-2 font-medium text-slate-300">
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: entry.color || entry.fill }}></span>
              <span>{entry.name}:</span>
              <span className="font-bold text-white">
                {typeof entry.value === 'number' && (entry.name.toLowerCase().includes('presupuesto') || entry.name.toLowerCase().includes('cobrado') || entry.name.toLowerCase().includes('pendiente') || entry.name.toLowerCase().includes('atrasado'))
                  ? `$${entry.value.toLocaleString()}`
                  : entry.value}
                {entry.name.toLowerCase().includes('progreso') ? '%' : ''}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Chart View Selection Tabs & Project Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center">
            <BarChart3 className="w-4 h-4 mr-2 text-orange-600" />
            Analítica de Ejecución Estratégica
          </h2>
          <p className="text-xs text-slate-500">Métricas cuantitativas del portafolio con interactividad Power BI</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Project Selector inside Charts Header */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs hover:border-orange-300 transition-colors shadow-xs">
            <Filter className="w-3.5 h-3.5 text-orange-600 mr-2 shrink-0" />
            <select
              value={selectedProjectId || 'ALL'}
              onChange={(e) => onSelectProject?.(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer text-xs max-w-[200px] truncate"
            >
              <option value="ALL">Portafolio Completo ({allProjectsList.length} Proyectos)</option>
              {allProjectsList.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* View Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-semibold text-slate-600">
            <button
              onClick={() => setChartView('all')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                chartView === 'all' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Vista Integral
            </button>
            <button
              onClick={() => setChartView('portfolio')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                chartView === 'portfolio' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Estado de Iniciativas
            </button>
            <button
              onClick={() => setChartView('team')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                chartView === 'team' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Carga de Consultores
            </button>
            <button
              onClick={() => setChartView('financial')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                chartView === 'financial' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Finanzas
            </button>
          </div>
        </div>
      </div>

      {/* Power BI Interactive Filter Slicer Status Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-3 rounded-xl border border-slate-700 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-orange-500/20 text-orange-400 rounded-lg border border-orange-500/30 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-[11px] uppercase tracking-wider">Interactividad Dinámica (Power BI)</span>
              <span className="text-slate-400 hidden sm:inline">•</span>
              <span className="text-[11px] text-slate-300 hidden sm:inline">Haz clic en rebanadas o barras para filtrar el tablero en tiempo real</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeProjectObj && (
            <div className="flex items-center gap-1.5 bg-slate-800/90 text-orange-300 px-2.5 py-1 rounded-md border border-orange-500/40 text-[11px]">
              <span className="text-slate-400 font-medium">Iniciativa:</span>
              <span className="font-bold max-w-[150px] truncate">{activeProjectObj.name}</span>
              <button 
                onClick={() => onSelectProject?.('ALL')} 
                className="text-slate-400 hover:text-white cursor-pointer ml-0.5"
                title="Quitar filtro de proyecto"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {selectedStatusFilter && (
            <div className="flex items-center gap-1.5 bg-slate-800/90 text-emerald-300 px-2.5 py-1 rounded-md border border-emerald-500/40 text-[11px]">
              <span className="text-slate-400 font-medium">Estatus:</span>
              <span className="font-bold">{selectedStatusFilter}</span>
              <button 
                onClick={() => onSelectStatus?.(null)} 
                className="text-slate-400 hover:text-white cursor-pointer ml-0.5"
                title="Quitar filtro de estatus"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {activeMemberObj && (
            <div className="flex items-center gap-1.5 bg-slate-800/90 text-blue-300 px-2.5 py-1 rounded-md border border-blue-500/40 text-[11px]">
              <span className="text-slate-400 font-medium">Consultor:</span>
              <span className="font-bold">{activeMemberObj.name}</span>
              <button 
                onClick={() => onSelectMember?.(null)} 
                className="text-slate-400 hover:text-white cursor-pointer ml-0.5"
                title="Quitar filtro de consultor"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="flex items-center gap-1 px-2.5 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded-md text-[11px] font-bold transition-colors cursor-pointer shadow-xs"
              title="Restablecer todos los filtros"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restablecer Filtros</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Status Donut / Pie Chart */}
        {(chartView === 'all' || chartView === 'portfolio') && (
          <div className="bg-white rounded-xl p-5 shadow-xs border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <PieIcon className="w-3.5 h-3.5 text-blue-900" />
                  Distribución del Portafolio por Estatus
                </h3>
                <p className="text-[11px] text-slate-500">Haz clic en un segmento para filtrar todo el tablero</p>
              </div>
              <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                {projects.length} Iniciativas
              </span>
            </div>

            <div className="h-56 w-full flex items-center justify-center">
              {portfolioStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={portfolioStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      onClick={(entry: any) => onSelectStatus?.(selectedStatusFilter === entry.name ? null : entry.name)}
                    >
                      {portfolioStatusData.map((entry, index) => {
                        const isSelected = selectedStatusFilter === entry.name;
                        const isAnySelected = Boolean(selectedStatusFilter);
                        return (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color} 
                            cursor="pointer"
                            opacity={isAnySelected ? (isSelected ? 1 : 0.25) : 1}
                            stroke={isSelected ? '#ea580c' : '#ffffff'}
                            strokeWidth={isSelected ? 3 : 1}
                          />
                        );
                      })}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-slate-400 italic">No hay proyectos registrados</div>
              )}
            </div>

            {/* Legend & Summary Badges (Interactive Buttons) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-100 text-xs">
              {portfolioStatusData.map((item, idx) => {
                const isSelected = selectedStatusFilter === item.name;
                return (
                  <button
                    key={idx}
                    onClick={() => onSelectStatus?.(isSelected ? null : item.name)}
                    className={`flex items-center gap-2 p-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-orange-50 border-orange-400 ring-2 ring-orange-200 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-100'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <div className="truncate">
                      <span className="text-[10px] text-slate-500 block truncate">{item.name}</span>
                      <span className="font-bold text-slate-900">{item.value} ({Math.round((item.value / projects.length) * 100 || 0)}%)</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. Team Workload Bar Chart */}
        {(chartView === 'all' || chartView === 'team') && (
          <div className="bg-white rounded-xl p-5 shadow-xs border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-900" />
                  Carga de Trabajo por Consultor
                </h3>
                <p className="text-[11px] text-slate-500">Haz clic en una barra para filtrar por consultor</p>
              </div>
              <span className="text-[11px] font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md">
                {teamMembers.length} Consultores
              </span>
            </div>

            <div className="h-56 w-full">
              {teamWorkloadData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={teamWorkloadData} 
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    onClick={(state: any) => {
                      if (state && state.activePayload && state.activePayload.length) {
                        const item = state.activePayload[0].payload;
                        if (item && item.id) {
                          onSelectMember?.(selectedMemberFilter === item.id ? null : item.id);
                        }
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Bar dataKey="activas" name="Tareas Activas" fill="#1e3a8a" radius={[3, 3, 0, 0]}>
                      {teamWorkloadData.map((entry, index) => (
                        <Cell
                          key={`act-${index}`}
                          fill="#1e3a8a"
                          cursor="pointer"
                          opacity={selectedMemberFilter ? (entry.id === selectedMemberFilter ? 1 : 0.35) : 1}
                        />
                      ))}
                    </Bar>
                    <Bar dataKey="completadas" name="Entregadas" fill="#0f766e" radius={[3, 3, 0, 0]}>
                      {teamWorkloadData.map((entry, index) => (
                        <Cell
                          key={`comp-${index}`}
                          fill="#0f766e"
                          cursor="pointer"
                          opacity={selectedMemberFilter ? (entry.id === selectedMemberFilter ? 1 : 0.35) : 1}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                  No hay integrantes registrados
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#1e3a8a]"></span> En Proceso</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#0f766e]"></span> Entregadas</span>
              </div>
              <span className="text-[10px] text-slate-400">💡 Clic para segmentar</span>
            </div>
          </div>
        )}

        {/* 3. Project Progress Curves */}
        {(chartView === 'all' || chartView === 'portfolio') && (
          <div className="bg-white rounded-xl p-5 shadow-xs border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-orange-600" />
                  Avance Real por Iniciativa (%)
                </h3>
                <p className="text-[11px] text-slate-500">Haz clic en una barra para fijar la iniciativa en el tablero</p>
              </div>
            </div>

            <div className="h-56 w-full">
              {topProjectsProgress.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={topProjectsProgress} 
                    layout="vertical" 
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    onClick={(state: any) => {
                      if (state && state.activePayload && state.activePayload.length) {
                        const item = state.activePayload[0].payload;
                        if (item && item.id) {
                          onSelectProject?.(selectedProjectId === item.id ? 'ALL' : item.id);
                        }
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#475569' }} unit="%" axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#1e293b' }} width={90} axisLine={false} tickLine={false} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Bar dataKey="progreso" name="Progreso" fill="#ea580c" radius={[0, 3, 3, 0]}>
                      {topProjectsProgress.map((entry, index) => (
                        <Cell
                          key={`proj-${index}`}
                          fill="#ea580c"
                          cursor="pointer"
                          opacity={selectedProjectId !== 'ALL' ? (entry.id === selectedProjectId ? 1 : 0.35) : 1}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                  No hay proyectos activos
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                <span>💡 Clic para fijar iniciativa</span>
              </span>
              <span className="font-bold text-slate-900">
                Promedio: {Math.round(projects.reduce((acc, p) => acc + (p.progress_percentage || 0), 0) / (projects.length || 1))}%
              </span>
            </div>
          </div>
        )}

        {/* 4. Financial & Invoicing Overview */}
        {(chartView === 'all' || chartView === 'financial') && (
          <div className="bg-white rounded-xl p-5 shadow-xs border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-blue-900" />
                  Control Financiero y Honorarios
                </h3>
                <p className="text-[11px] text-slate-500">Ejecución presupuestal y cobranza</p>
              </div>
              <span className="text-[11px] font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md">
                ${totalBudget.toLocaleString()} Total
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 py-2">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Presupuesto Portafolio</span>
                <span className="text-base font-extrabold text-slate-900 mt-0.5 block">${totalBudget.toLocaleString()}</span>
                <span className="text-[10px] text-slate-500">{projects.length} proyectos contratados</span>
              </div>

              <div className="p-3 bg-emerald-50/70 rounded-lg border border-emerald-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">Honorarios Cobrados</span>
                <span className="text-base font-extrabold text-emerald-950 mt-0.5 block">${paidInvoicesAmount.toLocaleString()}</span>
                <span className="text-[10px] text-emerald-700 font-bold">
                  {totalBudget > 0 ? Math.round((paidInvoicesAmount / totalBudget) * 100) : 0}% recaudado
                </span>
              </div>

              <div className="p-3 bg-amber-50/70 rounded-lg border border-amber-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">Facturas en Trámite</span>
                <span className="text-base font-extrabold text-amber-950 mt-0.5 block">${pendingInvoicesAmount.toLocaleString()}</span>
                <span className="text-[10px] text-amber-700">Por liquidar</span>
              </div>

              <div className="p-3 bg-orange-50/70 rounded-lg border border-orange-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-800 block">Facturas Vencidas</span>
                <span className="text-base font-extrabold text-orange-950 mt-0.5 block">${overdueInvoicesAmount.toLocaleString()}</span>
                <span className="text-[10px] text-orange-700 font-bold">Gestión de Cobranza</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Recaudación efectiva</span>
              <span className="font-semibold text-slate-900">
                {invoices.filter(i => i.status === 'Pagada').length} de {invoices.length} facturas liquidadas
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
