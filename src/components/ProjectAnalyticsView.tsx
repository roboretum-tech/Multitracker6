import React, { useState, useMemo, useEffect } from 'react';
import { 
  Project, 
  Task, 
  ProjectStatus 
} from '../types';
import { 
  BarChart3, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  Layers, 
  ArrowUpRight, 
  Filter,
  Activity,
  Flame,
  Info,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Zap,
  ShieldAlert,
  BrainCircuit,
  Target
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine
} from 'recharts';

interface ProjectAnalyticsViewProps {
  projects: Project[];
  tasks: Task[];
  initialProjectId?: string;
  onNavigateToTasks?: () => void;
  onNavigateToGantt?: () => void;
}

interface ForecastPoint {
  date: string;
  label: string;
  forecast: number;
}

interface ForecastResult {
  success: boolean;
  estimatedCompletionDate: string;
  projectedVarianceDays: number;
  velocityPerDay: number;
  requiredVelocityPerDay: number;
  confidenceLevel: 'Alta' | 'Media' | 'Baja';
  executiveSummary: string;
  keyObservations: string[];
  mitigationRecommendations: string[];
  forecastPoints: ForecastPoint[];
  isAiGenerated: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  'Completado': '#10b981', // Emerald
  'En curso': '#3b82f6',    // Blue
  'No iniciado': '#94a3b8',// Slate
  'En espera': '#f59e0b',  // Amber
  'En pausa': '#f59e0b',   // Amber
};

export const ProjectAnalyticsView: React.FC<ProjectAnalyticsViewProps> = ({
  projects,
  tasks,
  initialProjectId,
  onNavigateToTasks,
  onNavigateToGantt,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || 'ALL');
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [forecastError, setForecastError] = useState<string | null>(null);

  // Reiniciar pronóstico al cambiar de proyecto
  useEffect(() => {
    setForecast(null);
    setForecastError(null);
  }, [selectedProjectId]);

  // Filtrado de proyectos y tareas
  const activeProject = useMemo(() => {
    if (selectedProjectId === 'ALL') return null;
    return projects.find(p => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  const scopedTasks = useMemo(() => {
    if (selectedProjectId === 'ALL') return tasks;
    return tasks.filter(t => t.project_id === selectedProjectId);
  }, [tasks, selectedProjectId]);

  // -------------------------------------------------------------
  // 1. Distribución de Tareas por Estado (Pie / Donut)
  // -------------------------------------------------------------
  const taskStatusDistribution = useMemo(() => {
    const counts: Record<string, number> = {
      'Completado': 0,
      'En curso': 0,
      'No iniciado': 0,
      'En espera': 0,
    };

    scopedTasks.forEach(t => {
      const st = t.status || (t.is_done ? 'Completado' : 'No iniciado');
      if (st === 'Completado') counts['Completado']++;
      else if (st === 'En curso') counts['En curso']++;
      else if (st === 'En espera' || st === 'En pausa') counts['En espera']++;
      else counts['No iniciado']++;
    });

    return [
      { name: 'Completado', value: counts['Completado'], color: STATUS_COLORS['Completado'] },
      { name: 'En curso', value: counts['En curso'], color: STATUS_COLORS['En curso'] },
      { name: 'No iniciado', value: counts['No iniciado'], color: STATUS_COLORS['No iniciado'] },
      { name: 'En espera', value: counts['En espera'], color: STATUS_COLORS['En espera'] },
    ].filter(item => item.value > 0);
  }, [scopedTasks]);

  // -------------------------------------------------------------
  // 2. Métricas Ejecutivas / KPIs
  // -------------------------------------------------------------
  const kpis = useMemo(() => {
    const total = scopedTasks.length;
    const completed = scopedTasks.filter(t => t.is_done || t.status === 'Completado').length;
    const inProgress = scopedTasks.filter(t => t.status === 'En curso').length;
    const pending = total - completed;

    const todayStr = new Date().toISOString().split('T')[0];
    const overdue = scopedTasks.filter(t => !t.is_done && t.end_date && t.end_date < todayStr).length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const targetProject = activeProject;
    let daysRemaining = 0;
    if (targetProject && targetProject.deadline) {
      const now = new Date();
      const end = new Date(targetProject.deadline);
      const diffTime = end.getTime() - now.getTime();
      daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    return {
      total,
      completed,
      inProgress,
      pending,
      overdue,
      completionRate,
      daysRemaining
    };
  }, [scopedTasks, activeProject]);

  // -------------------------------------------------------------
  // 3. Gráfico de Quemado (Burndown Chart) Base
  // -------------------------------------------------------------
  const burndownData = useMemo(() => {
    if (scopedTasks.length === 0) return [];

    let minDateStr = activeProject?.start_date;
    let maxDateStr = activeProject?.deadline;

    if (!minDateStr) {
      const taskStarts = scopedTasks.map(t => t.start_date).filter(Boolean) as string[];
      minDateStr = taskStarts.sort()[0] || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    }
    if (!maxDateStr) {
      const taskEnds = scopedTasks.map(t => t.end_date).filter(Boolean) as string[];
      maxDateStr = taskEnds.sort().reverse()[0] || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    }

    const startDate = new Date(minDateStr);
    const endDate = new Date(maxDateStr);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const totalDays = Math.max(7, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const stepDays = Math.max(1, Math.round(totalDays / 8));

    const totalTasksCount = scopedTasks.length;
    const points: Array<{
      date: string;
      label: string;
      ideal: number;
      actual: number | null;
      forecast?: number | null;
      isToday?: boolean;
    }> = [];

    const completedTasksWithDates = scopedTasks
      .filter(t => t.is_done || t.status === 'Completado')
      .map(t => ({
        date: t.end_date || (t.updated_at ? t.updated_at.split('T')[0] : minDateStr),
      }));

    for (let dayOffset = 0; dayOffset <= totalDays; dayOffset += stepDays) {
      const pointDate = new Date(startDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);
      const pointDateStr = pointDate.toISOString().split('T')[0];

      const fraction = dayOffset / totalDays;
      const idealRemaining = Math.max(0, Math.round((1 - fraction) * totalTasksCount * 10) / 10);

      let actualRemaining: number | null = null;
      if (pointDateStr <= todayStr) {
        const completedBeforeOrAt = completedTasksWithDates.filter(t => t.date <= pointDateStr).length;
        actualRemaining = Math.max(0, totalTasksCount - completedBeforeOrAt);
      }

      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const label = `${pointDate.getUTCDate()} ${monthNames[pointDate.getUTCMonth()]}`;

      points.push({
        date: pointDateStr,
        label,
        ideal: idealRemaining,
        actual: actualRemaining,
        forecast: null,
        isToday: pointDateStr === todayStr,
      });
    }

    if (points.length > 0 && points[points.length - 1].date < maxDateStr) {
      const finalMonth = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      points.push({
        date: maxDateStr,
        label: `${endDate.getUTCDate()} ${finalMonth[endDate.getUTCMonth()]}`,
        ideal: 0,
        actual: maxDateStr <= todayStr ? Math.max(0, totalTasksCount - completedTasksWithDates.length) : null,
        forecast: null,
      });
    }

    return points;
  }, [scopedTasks, activeProject]);

  // -------------------------------------------------------------
  // 4. Integración del Pronóstico Predictivo en la serie Recharts
  // -------------------------------------------------------------
  const chartPointsWithForecast = useMemo(() => {
    if (!forecast || !forecast.forecastPoints || forecast.forecastPoints.length === 0) {
      return burndownData;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const currentPending = kpis.pending;

    // Clonamos los puntos existentes
    const merged = burndownData.map(p => {
      // Conectar la línea de pronóstico desde el punto actual
      const isAnchorPoint = p.date === todayStr || (p.actual !== null && p.date <= todayStr);
      return {
        ...p,
        forecast: p.date === todayStr ? currentPending : null,
      };
    });

    // Si hoy no estaba explícitamente en los puntos, aseguramos el ancla
    const hasToday = merged.some(p => p.date === todayStr);
    if (!hasToday) {
      const now = new Date();
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      merged.push({
        date: todayStr,
        label: `${now.getUTCDate()} ${monthNames[now.getUTCMonth()]}`,
        ideal: 0,
        actual: currentPending,
        forecast: currentPending,
        isToday: true,
      });
    }

    // Agregar puntos futuros proyectados por Gemini
    forecast.forecastPoints.forEach(fp => {
      if (fp.date > todayStr) {
        const existing = merged.find(p => p.date === fp.date);
        if (existing) {
          existing.forecast = fp.forecast;
        } else {
          merged.push({
            date: fp.date,
            label: fp.label,
            ideal: 0,
            actual: null,
            forecast: fp.forecast,
          });
        }
      }
    });

    return merged.sort((a, b) => a.date.localeCompare(b.date));
  }, [burndownData, forecast, kpis.pending]);

  // -------------------------------------------------------------
  // 5. Invocación de la API de Gemini (Server Route)
  // -------------------------------------------------------------
  const handleGenerateForecast = async () => {
    if (scopedTasks.length === 0) return;

    setLoadingForecast(true);
    setForecastError(null);

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const payload = {
        projectName: activeProject?.name || 'Portafolio Global',
        category: activeProject?.category || 'Consolidado',
        startDate: activeProject?.start_date || (scopedTasks[0]?.start_date || todayStr),
        targetDeadline: activeProject?.deadline || (scopedTasks[scopedTasks.length - 1]?.end_date || todayStr),
        totalTasks: kpis.total,
        completedTasks: kpis.completed,
        remainingTasks: kpis.pending,
        overdueTasks: kpis.overdue,
        burndownPoints: burndownData.map(p => ({
          date: p.date,
          label: p.label,
          ideal: p.ideal,
          actual: p.actual,
        })),
      };

      const res = await fetch('/api/gemini/burndown-forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Respuesta no satisfactoria del servidor: ${res.status}`);
      }

      const result: ForecastResult = await res.json();
      setForecast(result);
    } catch (err) {
      console.warn('Error al obtener el pronóstico de Gemini:', err);
      setForecastError('No se pudo completar el análisis con Gemini. Por favor intenta nuevamente.');
    } finally {
      setLoadingForecast(false);
    }
  };

  // -------------------------------------------------------------
  // 6. Avance Porcentual Acumulado del Portafolio
  // -------------------------------------------------------------
  const cumulativePortfolioProgress = useMemo(() => {
    const list = selectedProjectId === 'ALL' ? projects : (activeProject ? [activeProject] : []);
    if (list.length === 0) return [];

    const sortedProjects = [...list].sort((a, b) => (a.start_date || '').localeCompare(b.start_date || ''));
    
    return sortedProjects.map(p => {
      const pTasks = tasks.filter(t => t.project_id === p.id);
      const compTasks = pTasks.filter(t => t.is_done || t.status === 'Completado').length;
      const calcProgress = pTasks.length > 0 ? Math.round((compTasks / pTasks.length) * 100) : p.progress_percentage;

      return {
        project: p.name.length > 18 ? p.name.slice(0, 18) + '...' : p.name,
        name: p.name,
        progresoReal: calcProgress,
        esperadoPlan: Math.min(100, Math.round(calcProgress * 1.15)),
      };
    });
  }, [projects, tasks, selectedProjectId, activeProject]);

  return (
    <div className="space-y-6">
      {/* Encabezado y Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  Analíticas de Proyecto & Burndown
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    CSEA Executive Metrix
                  </span>
                </h1>
                <p className="text-sm text-slate-400 mt-0.5">
                  Monitoreo de curva de quemado, distribución operativa, velocidad real y pronóstico predictivo con Gemini.
                </p>
              </div>
            </div>
          </div>

          {/* Selector de Proyecto / Portafolio */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300">
              <Filter className="w-4 h-4 text-amber-500" />
              <label htmlFor="project-filter" className="text-xs text-slate-400 uppercase font-semibold">
                Alcance:
              </label>
              <select
                id="project-filter"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer pr-2"
              >
                <option value="ALL" className="bg-slate-900 text-white">
                  Portafolio Global (Todos los proyectos)
                </option>
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id} className="bg-slate-900 text-white">
                    {proj.name}
                  </option>
                ))}
              </select>
            </div>

            {activeProject && onNavigateToGantt && (
              <button
                onClick={onNavigateToGantt}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors cursor-pointer"
                title="Ver cronograma Gantt de este proyecto"
              >
                <span>Ver Gantt</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards Ejecutivos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Entregables */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Tareas / Hitos</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-white">{kpis.total}</span>
              <span className="text-xs text-slate-500">entregables</span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <Layers className="w-3 h-3 text-slate-400" />
              {activeProject ? activeProject.category || 'Proyecto individual' : 'Consolidado global'}
            </p>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* Tasa de Ejecución */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Avance de Ejecución</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-emerald-400">{kpis.completionRate}%</span>
              <span className="text-xs text-emerald-500/80 font-medium">({kpis.completed}/{kpis.total})</span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Tareas finalizadas a la fecha
            </p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Pendientes por Quemar */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Restantes por Quemar</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-amber-400">{kpis.pending}</span>
              <span className="text-xs text-slate-500">pendientes</span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-400" />
              {kpis.inProgress} en curso actualmente
            </p>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl">
            <Flame className="w-6 h-6" />
          </div>
        </div>

        {/* Desviación / Vencidas */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Exposición de Plazo</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl font-bold ${kpis.overdue > 0 ? 'text-rose-400' : 'text-slate-200'}`}>
                {kpis.overdue}
              </span>
              <span className="text-xs text-rose-400 font-medium">vencidas</span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              {kpis.overdue > 0 ? (
                <>
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                  Requiere mitigación inmediata
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Cronograma en ruta sin retrasos
                </>
              )}
            </p>
          </div>
          <div className={`p-3 rounded-xl border ${kpis.overdue > 0 ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Grid Central: Burndown Chart & Distribución de Tareas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GRÁFICO 1: Burndown Chart con Proyección Predictiva IA (2 Columnas) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-400" />
                  Gráfico de Quemado (Burndown Chart)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Evolución de tareas pendientes. Comparativa de la trayectoria ideal, avance real y proyección predictiva Gemini.
                </p>
              </div>

              {/* Botón de Invocación Gemini IA */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleGenerateForecast}
                  disabled={loadingForecast || scopedTasks.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 hover:text-white border border-amber-500/30 rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  title="Ejecutar análisis de velocidad real con la API gratuita de Gemini"
                >
                  {loadingForecast ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      <span>Analizando con Gemini...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>{forecast ? 'Actualizar Pronóstico IA' : 'Pronóstico IA (Gemini)'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Leyenda de Referencia de Curvas */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-medium pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-t-2 border-dashed border-slate-400"></span>
                <span className="text-slate-400">Trayectoria Ideal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-amber-500 rounded-full"></span>
                <span className="text-amber-400">Progreso Real</span>
              </div>
              {forecast && (
                <div className="flex items-center gap-1.5 animate-fade-in">
                  <span className="w-3 h-0.5 border-t-2 border-dashed border-sky-400"></span>
                  <span className="text-sky-400 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-sky-400" />
                    Proyección Predictiva Gemini
                  </span>
                </div>
              )}
            </div>

            {chartPointsWithForecast.length > 0 ? (
              <div className="h-72 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartPointsWithForecast}
                    margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis 
                      dataKey="label" 
                      stroke="#94a3b8" 
                      fontSize={11} 
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      fontSize={11} 
                      tickLine={false}
                      domain={[0, 'auto']}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0f172a', 
                        borderColor: '#334155',
                        borderRadius: '0.5rem',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                        fontSize: '12px'
                      }}
                      itemStyle={{ color: '#f8fafc' }}
                      formatter={(value: any, name: string) => {
                        const valNum = Number(value);
                        if (name === 'ideal') return [`${valNum} tareas`, 'Ideal planificado'];
                        if (name === 'actual') return [valNum !== null ? `${valNum} tareas` : 'Sin datos pasados', 'Restantes reales'];
                        if (name === 'forecast') return [valNum !== null ? `${valNum} tareas` : 'Proyectado', 'Proyección Gemini'];
                        return [value, name];
                      }}
                      labelFormatter={(label) => `Fecha: ${label}`}
                    />
                    {/* Línea Ideal */}
                    <Line 
                      type="linear" 
                      dataKey="ideal" 
                      name="ideal"
                      stroke="#94a3b8" 
                      strokeWidth={2} 
                      strokeDasharray="5 5" 
                      dot={false}
                    />
                    {/* Línea Real */}
                    <Line 
                      type="monotone" 
                      dataKey="actual" 
                      name="actual"
                      stroke="#f59e0b" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#f59e0b', strokeWidth: 1, stroke: '#0f172a' }}
                      activeDot={{ r: 6, fill: '#fbbf24' }}
                      connectNulls={false}
                    />
                    {/* Línea Proyección Predictiva IA */}
                    {forecast && (
                      <Line 
                        type="monotone" 
                        dataKey="forecast" 
                        name="forecast"
                        stroke="#38bdf8" 
                        strokeWidth={2.5} 
                        strokeDasharray="4 4" 
                        dot={{ r: 4, fill: '#38bdf8', strokeWidth: 1, stroke: '#0f172a' }}
                        activeDot={{ r: 6, fill: '#7dd3fc' }}
                        connectNulls={false}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center text-slate-500 text-sm">
                No hay suficientes datos de fechas para proyectar el gráfico de quemado.
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-500" />
              {forecast 
                ? `Pronóstico estimado: Cierre proyectado el ${forecast.estimatedCompletionDate} (${forecast.projectedVarianceDays > 0 ? `+${forecast.projectedVarianceDays} días` : 'A tiempo'}).`
                : 'Pulsa "Pronóstico IA (Gemini)" para calcular la fecha estimada de cierre según la velocidad del equipo.'
              }
            </span>
            {onNavigateToTasks && (
              <button
                onClick={onNavigateToTasks}
                className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Administrar tareas</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* GRÁFICO 2: Distribución de Tareas por Estado (1 Columna) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-400" />
                  Distribución por Estado
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Desglose de entregables según su ciclo de vida actual.
                </p>
              </div>
            </div>

            {taskStatusDistribution.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={taskStatusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={88}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {taskStatusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0f172a', 
                        borderColor: '#334155',
                        borderRadius: '0.5rem',
                        fontSize: '12px'
                      }}
                      itemStyle={{ color: '#f8fafc' }}
                      formatter={(val: any) => [`${val} tareas (${Math.round((Number(val) / kpis.total) * 100)}%)`, 'Cantidad']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
                No hay tareas registradas para el alcance seleccionado.
              </div>
            )}
          </div>

          {/* Leyenda interactiva inferior */}
          <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
            {taskStatusDistribution.map((item) => {
              const pct = kpis.total > 0 ? Math.round((item.value / kpis.total) * 100) : 0;
              return (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                    <span className="text-slate-300">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-white font-medium">{item.value}</span>
                    <span className="text-slate-500 text-[11px]">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* PANEL DESTACADO: Reporte Ejecutivo de Pronóstico Gemini (CSEA Velocity Engine) */}
      {forecast && (
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-sky-500/30 rounded-xl p-6 shadow-md animate-fade-in space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-sky-500/10 text-sky-400 rounded-lg border border-sky-500/20">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Pronóstico de Finalización por Velocidad Real
                  <span className="text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full font-semibold">
                    {forecast.isAiGenerated ? 'Gemini 3.8 Flash' : 'CSEA Velocity Engine'}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Proyección basada en el ritmo empírico de quema de tareas y compromisos de entrega.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Confianza:</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                forecast.confidenceLevel === 'Alta'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : forecast.confidenceLevel === 'Media'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
              }`}>
                {forecast.confidenceLevel}
              </span>
            </div>
          </div>

          {/* Comparativa de Plazos y Velocidad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Fecha Pronosticada */}
            <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Fecha Estimada de Cierre
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-lg font-bold text-sky-400 font-mono">
                  {forecast.estimatedCompletionDate}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Meta pactada: {activeProject?.deadline || 'Sin fecha definida'}
              </span>
            </div>

            {/* Variación de Cronograma */}
            <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Desviación Proyectada
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-lg font-bold font-mono ${
                  forecast.projectedVarianceDays > 0 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {forecast.projectedVarianceDays > 0 ? `+${forecast.projectedVarianceDays} días` : 'A tiempo'}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                {forecast.projectedVarianceDays > 0 ? 'Exposición sobre el plazo original' : 'En línea con la meta'}
              </span>
            </div>

            {/* Velocidad Real */}
            <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Velocidad Real del Equipo
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-lg font-bold text-white font-mono">
                  {forecast.velocityPerDay}
                </span>
                <span className="text-[11px] text-slate-400">tareas / día</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Ritmo empírico consolidado
              </span>
            </div>

            {/* Velocidad Requerida */}
            <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Velocidad Requerida
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-lg font-bold text-amber-300 font-mono">
                  {forecast.requiredVelocityPerDay}
                </span>
                <span className="text-[11px] text-slate-400">tareas / día</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Tasa requerida para plazo meta
              </span>
            </div>
          </div>

          {/* Diagnóstico Ejecutivo */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-sky-400" />
              Diagnóstico Ejecutivo Consultivo (CSEA v4.0)
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {forecast.executiveSummary}
            </p>
          </div>

          {/* Recomendaciones Estratégicas de Mitigación */}
          {forecast.mitigationRecommendations && forecast.mitigationRecommendations.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Intervenciones Estratégicas Recomendadas
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {forecast.mitigationRecommendations.map((rec, idx) => (
                  <div key={idx} className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-lg flex items-start gap-2.5 text-slate-300">
                    <span className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {forecastError && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{forecastError}</span>
        </div>
      )}

      {/* GRÁFICO 3: Avance Porcentual Acumulado del Portafolio */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Avance Porcentual Acumulado del Portafolio
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Curva comparativa de avance real ponderado versus la expectativa de línea base planificada.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-emerald-500 rounded-full"></span>
              <span className="text-emerald-400">Avance Real Logrado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-blue-400/60 rounded-full"></span>
              <span className="text-slate-400">Meta Planificada</span>
            </div>
          </div>
        </div>

        {cumulativePortfolioProgress.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={cumulativePortfolioProgress}
                margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorPlan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis 
                  dataKey="project" 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false}
                  domain={[0, 100]}
                  unit="%"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderColor: '#334155',
                    borderRadius: '0.5rem',
                    fontSize: '12px'
                  }}
                  itemStyle={{ color: '#f8fafc' }}
                  formatter={(value: any, name: string) => {
                    if (name === 'progresoReal') return [`${value}%`, 'Avance Real'];
                    if (name === 'esperadoPlan') return [`${value}%`, 'Meta Planificada'];
                    return [value, name];
                  }}
                  labelFormatter={(idx, payload) => {
                    const fullName = payload?.[0]?.payload?.name;
                    return fullName ? `Proyecto: ${fullName}` : `Hito ${idx}`;
                  }}
                />
                {/* Área Meta Plan */}
                <Area 
                  type="monotone" 
                  dataKey="esperadoPlan" 
                  stroke="#60a5fa" 
                  strokeDasharray="4 4"
                  fillOpacity={1} 
                  fill="url(#colorPlan)" 
                />
                {/* Área Avance Real */}
                <Area 
                  type="monotone" 
                  dataKey="progresoReal" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorReal)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
            No hay proyectos disponibles en el portafolio para computar la curva acumulada.
          </div>
        )}
      </div>

      {/* Panel Inferior: Conclusiones Consultivas C-Level (Metodología CSEA v4.0) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 text-xs text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-slate-800 rounded-lg text-slate-300 mt-0.5">
            <Info className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-200">Recomendación Ejecutiva de Control de Desviación</h4>
            <p className="mt-0.5 text-slate-400">
              Los resultados sugieren monitorear la tasa de entrega semanal. Si el ritmo de quema de tareas se mantiene por debajo del ritmo ideal, evaluar reasignación de recursos en la matriz RACI o reajuste de dependencia crítica en el cronograma.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
