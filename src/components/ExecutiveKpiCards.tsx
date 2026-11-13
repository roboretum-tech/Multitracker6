import React from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  AlertOctagon, 
  ShieldAlert, 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity, 
  CheckCircle2, 
  Clock, 
  Layers,
  Sparkles,
  Zap,
  Target,
  Filter,
  SlidersHorizontal,
  RotateCcw,
  X,
  Check
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis
} from 'recharts';
import { Project, Task, Invoice } from '../types';

interface ExecutiveKpiCardsProps {
  projects: Project[];
  tasks: Task[];
  invoices: Invoice[];
  onFilterRisk?: () => void;
  allProjects?: Project[];
  selectedProjectId?: string;
  onSelectProject?: (id: string) => void;
  selectedStatusFilter?: string | null;
  onSelectStatus?: (status: string | null) => void;
  onResetFilters?: () => void;
}

export default function ExecutiveKpiCards({
  projects,
  tasks,
  invoices,
  onFilterRisk,
  allProjects,
  selectedProjectId = 'ALL',
  onSelectProject,
  selectedStatusFilter = null,
  onSelectStatus,
  onResetFilters,
}: ExecutiveKpiCardsProps) {
  const todayStr = new Date().toISOString().split('T')[0];
  const allProjectsList = allProjects || projects;
  const activeProjectObj = selectedProjectId !== 'ALL' 
    ? allProjectsList.find(p => p.id === selectedProjectId)
    : null;

  const hasActiveFilters = (selectedProjectId && selectedProjectId !== 'ALL') || Boolean(selectedStatusFilter);

  // 1. KPI PRESUPUESTO: Planificado vs Ejecutado
  const totalPlannedBudget = projects.reduce((acc, p) => acc + (Number(p.estimated_value) || 0), 0);
  const totalExecutedBudget = invoices
    .filter(i => i.status === 'Pagada')
    .reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
  const totalCommittedBudget = invoices
    .filter(i => i.status === 'Enviada' || i.status === 'Aún no enviado')
    .reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
  const totalPendingBalance = Math.max(0, totalPlannedBudget - totalExecutedBudget);
  
  const budgetExecutionRate = totalPlannedBudget > 0 
    ? Math.min(100, Math.round((totalExecutedBudget / totalPlannedBudget) * 100))
    : 0;

  // Mini Recharts Data for Budget KPI
  const budgetComparisonData = [
    { name: 'Planificado', monto: totalPlannedBudget, fill: '#1e293b' },
    { name: 'Ejecutado', monto: totalExecutedBudget, fill: '#D98236' },
    { name: 'Comprometido', monto: totalCommittedBudget, fill: '#0ea5e9' },
  ];

  const budgetProgressData = [
    { name: 'Ejecutado', value: totalExecutedBudget, color: '#D98236' },
    { name: 'Por Ejecutar', value: totalPendingBalance, color: '#e2e8f0' },
  ];

  // 2. KPI AVANCE DEL PORTAFOLIO
  const totalProjects = projects.length;
  const averageProgress = totalProjects > 0
    ? Math.round(projects.reduce((acc, p) => acc + (Number(p.progress_percentage) || 0), 0) / totalProjects)
    : 0;

  const completedProjects = projects.filter(p => p.status === 'Completado').length;
  const inProgressProjects = projects.filter(p => p.status === 'En curso').length;
  const onHoldProjects = projects.filter(p => p.status === 'En espera').length;
  const notStartedProjects = projects.filter(p => p.status === 'No iniciado').length;

  // Task execution rate
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.is_done || t.status === 'Completado').length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Portfolio Distribution Data for Recharts
  const portfolioDistributionData = [
    { name: 'Completadas', count: completedProjects, fill: '#0f766e' },
    { name: 'En curso', count: inProgressProjects, fill: '#1e3a8a' },
    { name: 'En espera', count: onHoldProjects, fill: '#D98236' },
    { name: 'No iniciadas', count: notStartedProjects, fill: '#94a3b8' },
  ];

  const radialProgressData = [
    { name: 'Avance', value: averageProgress, fill: '#0f766e' }
  ];

  // 3. KPI RIESGOS CRÍTICOS Y EXPOSICIÓN
  // Critical risks criteria:
  // - Projects with priority 'Urgente' or 'Dificil' and progress < 50% or deadline passed
  // - Overdue tasks
  // - Overdue invoices
  const urgentProjects = projects.filter(p => 
    (p.priority === 'Urgente' || p.priority === 'Dificil') && 
    p.status !== 'Completado'
  );

  const overdueTasks = tasks.filter(t => 
    !t.is_done && 
    t.status !== 'Completado' && 
    t.end_date && 
    t.end_date < todayStr
  );

  const overdueInvoices = invoices.filter(i => i.status === 'Atrasada');

  const delayedDeadlinesProjects = projects.filter(p => 
    p.status !== 'Completado' && 
    p.deadline && 
    p.deadline < todayStr
  );

  // Total Critical Risks Score / Count
  const criticalRiskCount = urgentProjects.length + overdueTasks.length + overdueInvoices.length + delayedDeadlinesProjects.length;

  const riskSeverityData = [
    { name: 'Plazos Vencidos', count: delayedDeadlinesProjects.length, fill: '#dc2626' },
    { name: 'Entregables Atrasados', count: overdueTasks.length, fill: '#ea580c' },
    { name: 'Iniciativas Complejas', count: urgentProjects.length, fill: '#f59e0b' },
    { name: 'Facturas Vencidas', count: overdueInvoices.length, fill: '#e11d48' },
  ];

  // Health index
  const healthScore = Math.max(0, Math.min(100, Math.round(100 - (criticalRiskCount * 4))));

  // Status counts for Power BI slicer
  const statusSummary = {
    all: allProjectsList.length,
    inProgress: allProjectsList.filter(p => p.status === 'En curso').length,
    completed: allProjectsList.filter(p => p.status === 'Completado').length,
    onHold: allProjectsList.filter(p => p.status === 'En espera').length,
    notStarted: allProjectsList.filter(p => p.status === 'No iniciado').length,
  };

  // Custom Mini Tooltip
  const MiniTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-slate-900 text-white px-2.5 py-1.5 rounded-md shadow-xl border border-slate-700 text-[11px]">
          <span className="font-semibold">{data.name}: </span>
          <span className="font-bold text-orange-400">
            {typeof data.value === 'number' && data.value > 1000
              ? `$${data.value.toLocaleString()}`
              : data.value}
          </span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-3">
      {/* Header bar of the Executive KPI section with Integrated Project Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-7 bg-[#D98236] rounded-xs shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600">Analítica C-Level</span>
              <span className="text-slate-300">•</span>
              <span className="text-[10px] text-slate-500 font-medium">Sincronización en Tiempo Real</span>
            </div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              Indicadores Clave de Rendimiento (KPIs Ejecutivos)
            </h2>
          </div>
        </div>

        {/* Project Selector (matching dashboard header) */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs hover:border-orange-300 transition-colors shadow-xs">
            <Filter className="w-3.5 h-3.5 text-orange-600 mr-2 shrink-0" />
            <select
              value={selectedProjectId || 'ALL'}
              onChange={(e) => onSelectProject?.(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer text-xs max-w-[200px] sm:max-w-[280px] truncate"
            >
              <option value="ALL">Portafolio Completo ({allProjectsList.length} Proyectos)</option>
              {allProjectsList.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.category || 'Estratégico'})</option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors cursor-pointer"
              title="Restablecer filtros a todo el portafolio"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Ver Todo</span>
            </button>
          )}
        </div>
      </div>

      {/* Power BI Interactive Slicer Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50/90 px-3.5 py-2 rounded-lg border border-slate-200 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-1 flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3 text-orange-600" />
            Segmentador Power BI:
          </span>
          {[
            { id: 'ALL', label: 'Todos', count: statusSummary.all },
            { id: 'En curso', label: 'En curso', count: statusSummary.inProgress },
            { id: 'Completado', label: 'Completado', count: statusSummary.completed },
            { id: 'En espera', label: 'En espera', count: statusSummary.onHold },
            { id: 'No iniciado', label: 'No iniciado', count: statusSummary.notStarted },
          ].map(item => {
            const isActive = item.id === 'ALL' ? (!selectedStatusFilter) : (selectedStatusFilter === item.id);
            return (
              <button
                key={item.id}
                onClick={() => onSelectStatus?.(item.id === 'ALL' ? null : (selectedStatusFilter === item.id ? null : item.id))}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>{item.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {item.count}
                </span>
              </button>
            );
          })}
        </div>

        {activeProjectObj && (
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 bg-orange-50/80 px-2.5 py-1 rounded-md border border-orange-200">
            <span className="text-orange-600 font-bold">Iniciativa:</span>
            <span className="max-w-[200px] truncate">{activeProjectObj.name}</span>
            <button
              onClick={() => onSelectProject?.('ALL')}
              className="text-slate-400 hover:text-orange-600 ml-1 cursor-pointer"
              title="Quitar filtro de proyecto"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Grid with the 3 Mandated KPIs + 1 Executive Health Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* KPI 1: Presupuesto Ejecutado vs Planificado */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow p-5 flex flex-col justify-between relative overflow-hidden">
          {/* Top highlight bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-900 via-orange-500 to-amber-500" />
          
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-slate-900 text-orange-400 rounded-lg shadow-xs">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Finanzas & Desembolsos</span>
                  <h3 className="text-xs font-bold text-slate-900 leading-tight">Presupuesto Ejecutado vs. Planificado</h3>
                </div>
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                budgetExecutionRate > 90 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                budgetExecutionRate > 50 ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                {budgetExecutionRate}% Realizado
              </span>
            </div>

            {/* Main Numbers */}
            <div className="grid grid-cols-2 gap-3 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500">Ejecutado (Pagado)</div>
                <div className="text-base font-extrabold text-[#D98236] tracking-tight">
                  ${totalExecutedBudget.toLocaleString()}
                </div>
              </div>
              <div className="border-l border-slate-200 pl-3">
                <div className="text-[10px] uppercase font-bold text-slate-500">Planificado (Total)</div>
                <div className="text-base font-extrabold text-slate-900 tracking-tight">
                  ${totalPlannedBudget.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Recharts Bar Chart: Planificado vs Ejecutado vs Comprometido */}
            <div className="h-28 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetComparisonData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} width={80} />
                  <RechartsTooltip content={<MiniTooltip />} />
                  <Bar dataKey="monto" radius={[0, 4, 4, 0]} barSize={12}>
                    {budgetComparisonData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Remanente: ${totalPendingBalance.toLocaleString()}
            </span>
            <span className="font-semibold text-slate-700">
              {invoices.filter(i => i.status === 'Pagada').length} Facturas liquidadas
            </span>
          </div>
        </div>

        {/* KPI 2: Avance Porcentual del Portafolio */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow p-5 flex flex-col justify-between relative overflow-hidden">
          {/* Top highlight bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-600 via-emerald-500 to-cyan-500" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#0f766e] text-white rounded-lg shadow-xs">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Progreso & Madurez</span>
                  <h3 className="text-xs font-bold text-slate-900 leading-tight">Avance Porcentual del Portafolio</h3>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1">
                <Target className="w-3 h-3 text-teal-600" />
                {averageProgress}% Global
              </span>
            </div>

            {/* Main Numbers & Circular / Donut representation */}
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500">Iniciativas Concluidas</div>
                <div className="text-base font-extrabold text-teal-800 tracking-tight">
                  {completedProjects} <span className="text-xs text-slate-400 font-normal">de {totalProjects} ({totalProjects > 0 ? Math.round((completedProjects/totalProjects)*100) : 0}%)</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {taskCompletionRate}% de {totalTasks} entregables concluidos
                </div>
              </div>

              {/* Mini Radial Gauge via Recharts */}
              <div className="w-16 h-16 shrink-0 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { value: averageProgress, fill: '#0f766e' },
                        { value: 100 - averageProgress, fill: '#e2e8f0' }
                      ]}
                      dataKey="value"
                      innerRadius={18}
                      outerRadius={28}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <Cell fill="#0f766e" />
                      <Cell fill="#e2e8f0" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <span className="absolute text-[10px] font-black text-slate-800">{averageProgress}%</span>
              </div>
            </div>

            {/* Recharts Horizontal Distribution Chart */}
            <div className="h-28 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={portfolioDistributionData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 9, fill: '#64748b' }} />
                  <RechartsTooltip content={<MiniTooltip />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={18}>
                    {portfolioDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1 font-medium text-slate-700">
              <Activity className="w-3.5 h-3.5 text-teal-600" />
              {inProgressProjects} iniciativas en desarrollo activo
            </span>
            <span className="font-semibold text-teal-700">
              {completedTasks}/{totalTasks} Tareas
            </span>
          </div>
        </div>

        {/* KPI 3: Contador de Riesgos Críticos */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow p-5 flex flex-col justify-between relative overflow-hidden">
          {/* Top highlight bar */}
          <div className={`absolute top-0 left-0 right-0 h-1 ${
            criticalRiskCount > 5 ? 'bg-rose-600' :
            criticalRiskCount > 0 ? 'bg-amber-500' :
            'bg-emerald-500'
          }`} />

          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg shadow-xs ${
                  criticalRiskCount > 0 ? 'bg-rose-900 text-rose-200' : 'bg-emerald-900 text-emerald-200'
                }`}>
                  <AlertOctagon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gobernanza & Alertas</span>
                  <h3 className="text-xs font-bold text-slate-900 leading-tight">Contador de Riesgos Críticos</h3>
                </div>
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                criticalRiskCount > 5 ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse' :
                criticalRiskCount > 0 ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}>
                <ShieldAlert className="w-3 h-3" />
                {criticalRiskCount} {criticalRiskCount === 1 ? 'Exposición' : 'Exposiciones'}
              </span>
            </div>

            {/* Main Numbers */}
            <div className="grid grid-cols-2 gap-3 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500">Índice de Exposición</div>
                <div className={`text-base font-extrabold tracking-tight ${
                  criticalRiskCount > 5 ? 'text-rose-600' :
                  criticalRiskCount > 0 ? 'text-amber-600' :
                  'text-emerald-600'
                }`}>
                  {criticalRiskCount > 5 ? 'Alto Riesgo' : criticalRiskCount > 0 ? 'Atención Moderada' : 'Bajo Control'}
                </div>
              </div>
              <div className="border-l border-slate-200 pl-3">
                <div className="text-[10px] uppercase font-bold text-slate-500">Salud de Ejecución</div>
                <div className="text-base font-extrabold text-slate-900 tracking-tight">
                  {healthScore}/100
                </div>
              </div>
            </div>

            {/* Recharts Breakdown Chart: Factores de Riesgo */}
            <div className="h-28 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskSeverityData} layout="vertical" margin={{ top: 5, right: 10, left: 15, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} width={95} />
                  <RechartsTooltip content={<MiniTooltip />} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={10}>
                    {riskSeverityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1 font-medium text-rose-700">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
              {overdueTasks.length} tareas vencidas
            </span>
            <span className="font-semibold text-slate-700">
              {urgentProjects.length} proyectos de alta prioridad
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
