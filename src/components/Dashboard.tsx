import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { 
  Briefcase, 
  CheckSquare, 
  AlertCircle, 
  Calendar, 
  DollarSign, 
  Activity, 
  Clock, 
  Database,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Download,
  Filter,
  Layers,
  Sparkles,
  BarChart2,
  CalendarDays,
  FileSpreadsheet,
  Building2,
  ChevronRight,
  RotateCcw,
  X,
  BookOpen
} from 'lucide-react';
import DashboardCharts from './DashboardCharts';
import ExecutiveKpiCards from './ExecutiveKpiCards';
import SqlSetupModal from './SqlSetupModal';
import AttentionEngine from './AttentionEngine';
import { useAuth } from '../context/AuthContext';
import { exportToCSV, exportToJSON } from '../utils/exportUtils';

interface DashboardProps {
  onNavigate?: (viewId: string, projectId?: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps = {}) {
  const { currentUser } = useAuth();
  const { projects, tasks, meetings, communications, invoices, teamMembers, summary, isUsingSupabase } = useData();
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [selectedGlobalProject, setSelectedGlobalProject] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string | null>(null);
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<string | null>(null);

  const handleResetAllFilters = () => {
    setSelectedGlobalProject('ALL');
    setSelectedStatusFilter(null);
    setSelectedMemberFilter(null);
  };

  // Filtered dataset considering project, status slicer, and consultant slicer (Power BI style)
  const filteredProjects = projects.filter(p => {
    if (selectedGlobalProject !== 'ALL' && p.id !== selectedGlobalProject) return false;
    if (selectedStatusFilter && p.status !== selectedStatusFilter) return false;
    if (selectedMemberFilter && p.responsible_id !== selectedMemberFilter && p.accountable_id !== selectedMemberFilter) return false;
    return true;
  });

  const filteredTasks = tasks.filter(t => {
    if (selectedGlobalProject !== 'ALL' && t.project_id !== selectedGlobalProject) return false;
    if (selectedStatusFilter) {
      const proj = projects.find(p => p.id === t.project_id);
      if (proj && proj.status !== selectedStatusFilter) return false;
    }
    if (selectedMemberFilter && t.owner_id !== selectedMemberFilter) return false;
    return true;
  });

  const filteredMeetings = meetings.filter(m => {
    if (selectedGlobalProject !== 'ALL' && m.project_id !== selectedGlobalProject) return false;
    return true;
  });

  const filteredInvoices = invoices.filter(i => {
    if (selectedGlobalProject !== 'ALL' && i.project_id !== selectedGlobalProject) return false;
    if (selectedStatusFilter) {
      const proj = projects.find(p => p.id === i.project_id);
      if (proj && proj.status !== selectedStatusFilter) return false;
    }
    return true;
  });

  // Side-by-side comparison state
  const defaultProj1 = projects[0]?.id || '';
  const defaultProj2 = projects[1]?.id || '';
  const defaultProj3 = projects[2]?.id || '';

  const [selectedP1, setSelectedP1] = useState(defaultProj1);
  const [selectedP2, setSelectedP2] = useState(defaultProj2);
  const [selectedP3, setSelectedP3] = useState(defaultProj3);

  const p1 = projects.find(p => p.id === (selectedP1 || defaultProj1));
  const p2 = projects.find(p => p.id === (selectedP2 || defaultProj2));
  const p3 = projects.find(p => p.id === (selectedP3 || defaultProj3));

  const todayStr = new Date().toISOString().split('T')[0];

  const getDaysRemaining = (deadline?: string) => {
    if (!deadline) return null;
    const diffTime = new Date(deadline).getTime() - new Date(todayStr).getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const urgentProjects = filteredProjects.filter(p => p.priority === 'Urgente' || p.priority === 'Dificil');
  const overdueTasks = filteredTasks.filter(t => !t.is_done && t.status !== 'Completado' && t.end_date && t.end_date < todayStr);
  const upcomingMeetings = filteredMeetings.filter(m => m.meeting_date >= todayStr || m.status === 'Reunión programada');
  const pendingInvoices = filteredInvoices.filter(i => i.status !== 'Pagada');

  const completedProjectsCount = filteredProjects.filter(p => p.status === 'Completado').length;
  const projectGoal = Math.max(filteredProjects.length, 10);
  const goalProgress = Math.min(100, Math.round((completedProjectsCount / projectGoal) * 100));

  const totalFilteredValue = filteredProjects.reduce((acc, p) => acc + (Number(p.estimated_value) || 0), 0);

  const statCards = [
    { label: 'Portafolio Activo', value: filteredProjects.length, icon: Briefcase, color: 'text-blue-900', bg: 'bg-blue-50' },
    { label: 'Entregables Totales', value: filteredTasks.length, icon: CheckSquare, color: 'text-slate-800', bg: 'bg-slate-100' },
    { label: 'Entregables Atrasados', value: overdueTasks.length, icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Comités & Sesiones', value: upcomingMeetings.length, icon: Calendar, color: 'text-slate-700', bg: 'bg-slate-100' },
    { label: 'Facturas por Liquidar', value: pendingInvoices.length, icon: DollarSign, color: 'text-amber-700', bg: 'bg-amber-50' },
    { label: 'Valor de Cartera', value: `$${totalFilteredValue.toLocaleString()}`, icon: TrendingUp, color: 'text-blue-900', bg: 'bg-blue-50' },
  ];

  // Export handlers
  const handleExportProjectsCSV = () => {
    exportToCSV('Reporte_Proyectos_Capricorn', projects);
  };

  const handleExportTasksCSV = () => {
    exportToCSV('Reporte_Entregables_Capricorn', tasks);
  };

  const handleExportFullJSON = () => {
    exportToJSON('Backup_Capricorn_Management', {
      projects,
      tasks,
      teamMembers,
      meetings,
      invoices,
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header & Controls Bar - Capricorn Corporate Design */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#0f172a] text-orange-500 rounded-lg shadow-xs">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600">Dirección Estratégica</span>
                <span className="text-slate-300">•</span>
                <span className="text-[10px] text-slate-500 font-medium">Supervisión Ejecutiva</span>
              </div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">
                Tablero de Control de Ejecución Estratégica
              </h1>
            </div>
          </div>
        </div>

        {/* Global Controls & Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Project Global Filter */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs hover:border-orange-300 transition-colors shadow-xs">
            <Filter className="w-3.5 h-3.5 text-orange-600 mr-2 shrink-0" />
            <select
              value={selectedGlobalProject}
              onChange={(e) => setSelectedGlobalProject(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer text-xs"
            >
              <option value="ALL">Portafolio Completo ({projects.length} Proyectos)</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {(selectedGlobalProject !== 'ALL' || selectedStatusFilter || selectedMemberFilter) && (
            <button
              onClick={handleResetAllFilters}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors cursor-pointer"
              title="Restablecer todos los filtros aplicados"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Restablecer</span>
            </button>
          )}

          {/* Export Dropdown / Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleExportProjectsCSV}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 border border-slate-200"
              title="Exportar base de proyectos a CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
              <span>Exportar CSV</span>
            </button>

            <button
              onClick={handleExportFullJSON}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 border border-slate-200"
              title="Descargar respaldo"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Backup</span>
            </button>

            {onNavigate && (
              <button
                onClick={() => onNavigate('analytics')}
                className="px-3 py-1.5 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer border border-slate-800"
                title="Abrir vista de Analíticas y Gráfico de Quemado (Burndown)"
              >
                <BarChart2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Analíticas & Burndown</span>
              </button>
            )}

            {onNavigate && (
              <button
                onClick={() => onNavigate('manual-csea')}
                className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-950 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 border border-orange-200 cursor-pointer shadow-xs"
                title="Consultar Manual de Referencia y Guía de Operaciones CSEA v4.0"
              >
                <BookOpen className="w-3.5 h-3.5 text-orange-600" />
                <span>Manual CSEA</span>
              </button>
            )}

            <button
              onClick={() => setIsSqlModalOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center gap-1.5 border cursor-pointer bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300"
              title="Estado de conexión con Firebase Firestore Multi-Tenant"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>Firebase Firestore</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </button>
          </div>
        </div>
      </div>

      {/* PM Attention Engine - Operational Control Tower (Phase 1) */}
      <AttentionEngine
        projects={filteredProjects}
        tasks={filteredTasks}
        meetings={filteredMeetings}
        communications={communications}
        invoices={filteredInvoices}
        teamMembers={teamMembers}
        currentUserName={currentUser?.name}
        onNavigate={onNavigate}
      />

      {/* Goal Progress Banner */}
      <div className="bg-white rounded-xl p-5 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-slate-100 rounded-lg text-blue-900 border border-slate-200">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Cumplimiento del Plan Operativo Anual
            </div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">
              {completedProjectsCount} de {filteredProjects.length} Iniciativas Concluidas ({goalProgress}%)
            </div>
          </div>
        </div>
        <div className="w-full md:w-64">
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
            <div 
              className="bg-orange-600 h-2.5 rounded-full transition-all duration-500" 
              style={{ width: `${goalProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Primary Executive KPI Cards with Recharts Real-Time Visualizations */}
      <ExecutiveKpiCards 
        projects={filteredProjects}
        tasks={filteredTasks}
        invoices={filteredInvoices}
        allProjects={projects}
        selectedProjectId={selectedGlobalProject}
        onSelectProject={setSelectedGlobalProject}
        selectedStatusFilter={selectedStatusFilter}
        onSelectStatus={setSelectedStatusFilter}
        onResetFilters={handleResetAllFilters}
      />

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {statCards.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-500 leading-tight">{stat.label}</span>
              <div className={`p-1.5 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
              </div>
            </div>
            <div className="text-lg font-bold text-slate-900 tracking-tight">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Visual Analytics & Charts Section (Recharts) */}
      <DashboardCharts 
        projects={filteredProjects}
        tasks={filteredTasks}
        teamMembers={teamMembers}
        invoices={filteredInvoices}
        allProjects={projects}
        allTasks={tasks}
        selectedProjectId={selectedGlobalProject}
        onSelectProject={setSelectedGlobalProject}
        selectedStatusFilter={selectedStatusFilter}
        onSelectStatus={setSelectedStatusFilter}
        selectedMemberFilter={selectedMemberFilter}
        onSelectMember={setSelectedMemberFilter}
        onResetFilters={handleResetAllFilters}
      />

      {/* 3 Side-by-Side Projects Comparison */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Layers className="w-4 h-4 text-orange-600" />
              Matriz Comparativa de Iniciativas Clave (3 en Paralelo)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Control cruzado de avances, plazos e indicadores</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { selectedId: selectedP1, setSelected: setSelectedP1, proj: p1, label: 'Iniciativa A' },
            { selectedId: selectedP2, setSelected: setSelectedP2, proj: p2, label: 'Iniciativa B' },
            { selectedId: selectedP3, setSelected: setSelectedP3, proj: p3, label: 'Iniciativa C' },
          ].map((col, idx) => (
            <div key={idx} className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col justify-between space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">{col.label}</label>
                <select
                  value={col.selectedId}
                  onChange={(e) => col.setSelected(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 shadow-xs focus:ring-1 focus:ring-orange-500 focus:outline-none"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.category || 'Estratégico'})</option>
                  ))}
                </select>
              </div>

              {col.proj ? (
                <div className="bg-white rounded-lg p-4 border border-slate-200 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Estatus:</span>
                    <span className="font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">{col.proj.status}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Fecha Inicio:</span>
                    <span className="font-medium text-slate-800">{col.proj.start_date || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Fecha Entrega:</span>
                    <span className="font-medium text-slate-800">{col.proj.deadline || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Holgura:</span>
                    <span className={`font-bold ${
                      getDaysRemaining(col.proj.deadline) !== null && (getDaysRemaining(col.proj.deadline) || 0) < 0
                        ? 'text-orange-600'
                        : 'text-emerald-700'
                    }`}>
                      {getDaysRemaining(col.proj.deadline) !== null ? `${getDaysRemaining(col.proj.deadline)} días` : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Progreso:</span>
                      <span className="font-bold text-slate-900">{col.proj.progress_percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-orange-600 h-2 rounded-full transition-all" 
                        style={{ width: `${col.proj.progress_percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <span className="font-bold text-slate-700 block mb-1.5 text-[11px]">Entregables Clave:</span>
                    <div className="space-y-1 max-h-28 overflow-y-auto">
                      {tasks.filter(t => t.project_id === col.proj?.id).slice(0, 3).map(t => (
                        <div key={t.id} className="flex items-center justify-between text-xs p-1.5 bg-slate-50 rounded border border-slate-100">
                          <span className="truncate pr-2 text-slate-800">{t.name}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                            t.is_done ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {t.status}
                          </span>
                        </div>
                      ))}
                      {tasks.filter(t => t.project_id === col.proj?.id).length === 0 && (
                        <p className="text-slate-400 italic text-[11px]">Sin entregables registrados</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* Grid of Operational Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Projects */}
        <div className="bg-white rounded-xl p-5 shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center">
              <AlertTriangle className="w-3.5 h-3.5 mr-2 text-orange-600" />
              Iniciativas de Atención Prioritaria
            </h2>
            <span className="text-[10px] bg-orange-50 text-orange-800 font-bold px-2 py-0.5 rounded border border-orange-200">
              {urgentProjects.length} Proyectos
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {urgentProjects.slice(0, 5).map(p => (
              <div key={p.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{p.name}</h4>
                  <p className="text-[11px] text-slate-500">{p.category} • Fecha límite: {p.deadline || 'N/A'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    p.priority === 'Urgente' ? 'bg-orange-100 text-orange-900 border border-orange-200' : 'bg-slate-100 text-slate-800'
                  }`}>
                    {p.priority}
                  </span>
                  <span className="text-xs text-slate-700 font-semibold">{p.progress_percentage}%</span>
                </div>
              </div>
            ))}
            {urgentProjects.length === 0 && (
              <div className="py-6 text-center text-xs text-slate-400">No hay proyectos catalogados como urgentes.</div>
            )}
          </div>
        </div>

        {/* Overdue Tasks */}
        <div className="bg-white rounded-xl p-5 shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center">
              <Clock className="w-3.5 h-3.5 mr-2 text-orange-600" />
              Entregables Fuera de Plazo
            </h2>
            <span className="text-[10px] bg-orange-50 text-orange-800 font-bold px-2 py-0.5 rounded border border-orange-200">
              {overdueTasks.length} Atrasadas
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {overdueTasks.slice(0, 5).map(t => {
              const proj = projects.find(p => p.id === t.project_id);
              return (
                <div key={t.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{t.name}</h4>
                    <p className="text-[11px] text-slate-500">Iniciativa: {proj?.name || 'General'} • Vencimiento: {t.end_date}</p>
                  </div>
                  <span className="text-[10px] font-bold text-orange-800 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                    Vencido
                  </span>
                </div>
              );
            })}
            {overdueTasks.length === 0 && (
              <div className="py-6 text-center text-xs text-emerald-700 font-medium">
                Sin entregables vencidos al día de hoy.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lower Row: Upcoming Meetings & Invoices Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Meetings */}
        <div className="bg-white rounded-xl p-5 shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-2 text-blue-900" />
              Sesiones de Gobernanza y Comités
            </h2>
            <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded">
              {upcomingMeetings.length} Programadas
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {upcomingMeetings.slice(0, 4).map(m => {
              const proj = projects.find(p => p.id === m.project_id);
              return (
                <div key={m.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{m.name}</h4>
                    <p className="text-[11px] text-slate-500">{proj?.name} • {new Date(m.meeting_date).toLocaleDateString()}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-medium border border-slate-200">
                    {m.meeting_type || 'Comité'}
                  </span>
                </div>
              );
            })}
            {upcomingMeetings.length === 0 && (
              <div className="py-6 text-center text-xs text-slate-400">No hay sesiones agendadas para el periodo.</div>
            )}
          </div>
        </div>

        {/* Invoices Status Overview */}
        <div className="bg-white rounded-xl p-5 shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center">
              <FileText className="w-3.5 h-3.5 mr-2 text-blue-900" />
              Seguimiento de Honorarios y Facturación
            </h2>
            <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded">
              {invoices.length} Folios
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {invoices.slice(0, 4).map(inv => {
              const proj = projects.find(p => p.id === inv.project_id);
              return (
                <div key={inv.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{inv.invoice_number} ({proj?.name})</h4>
                    <p className="text-[11px] text-slate-500">Vencimiento: {inv.due_date || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-900">${inv.amount.toLocaleString()}</div>
                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                      inv.status === 'Pagada' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                      inv.status === 'Atrasada' ? 'bg-orange-50 text-orange-800 border border-orange-200' : 'bg-slate-100 text-slate-800'
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              );
            })}
            {invoices.length === 0 && (
              <div className="py-6 text-center text-xs text-slate-400">No hay folios de facturación registrados.</div>
            )}
          </div>
        </div>
      </div>

      <SqlSetupModal isOpen={isSqlModalOpen} onClose={() => setIsSqlModalOpen(false)} />
    </div>
  );
}
