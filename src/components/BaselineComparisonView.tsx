import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Project, Task, Priority, VarianceStatus } from '../types';
import { 
  calculateCriticalPath, 
  getDurationInDays, 
  formatVarianceDays 
} from '../utils/criticalPath';
import {
  GitFork,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  SlidersHorizontal,
  Bookmark,
  RefreshCw,
  Info,
  ArrowRight,
  Sparkles,
  Layers,
  Flame,
  ShieldCheck,
  RotateCcw,
  Check,
  ChevronDown,
  Filter,
  Eye,
  Activity,
  Zap,
  Target
} from 'lucide-react';

interface BaselineComparisonViewProps {
  initialProjectId?: string;
  onNavigateToGantt?: (projectId?: string) => void;
  onOpenTaskModal?: (task?: Task, defaultProjectId?: string) => void;
}

export default function BaselineComparisonView({
  initialProjectId,
  onNavigateToGantt,
  onOpenTaskModal
}: BaselineComparisonViewProps) {
  const { 
    projects, 
    tasks, 
    teamMembers, 
    updateTask, 
    captureProjectBaseline, 
    clearProjectBaseline 
  } = useData();

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    initialProjectId && projects.some(p => p.id === initialProjectId)
      ? initialProjectId
      : (projects[0]?.id || '')
  );

  const [activeTab, setActiveTab] = useState<'comparison' | 'matrix' | 'simulator'>('comparison');
  const [filterMode, setFilterMode] = useState<'all' | 'critical' | 'delayed' | 'ahead'>('all');
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureFeedback, setCaptureFeedback] = useState<string | null>(null);

  // Simulator State
  const [simulatedTaskId, setSimulatedTaskId] = useState<string>('');
  const [simulationDaysDelta, setSimulationDaysDelta] = useState<number>(5);

  const currentProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId) || projects[0];
  }, [projects, selectedProjectId]);

  // Run Critical Path Method & Baseline Variance Engine
  const analysis = useMemo(() => {
    if (!currentProject) return null;
    return calculateCriticalPath(currentProject, tasks);
  }, [currentProject, tasks]);

  // Baseline capture handler
  const handleCaptureBaseline = async () => {
    if (!currentProject) return;
    setIsCapturing(true);
    await captureProjectBaseline(currentProject.id);
    setIsCapturing(false);
    setCaptureFeedback('¡Línea base congelada y registrada exitosamente!');
    setTimeout(() => setCaptureFeedback(null), 4000);
  };

  const handleClearBaseline = async () => {
    if (!currentProject) return;
    if (window.confirm('¿Deseas eliminar la línea base registrada de este proyecto? Se perderán las referencias de comparación.')) {
      await clearProjectBaseline(currentProject.id);
      setCaptureFeedback('Línea base reestablecida.');
      setTimeout(() => setCaptureFeedback(null), 3000);
    }
  };

  // Filtered variances
  const filteredVariances = useMemo(() => {
    if (!analysis) return [];
    return analysis.variances.filter(v => {
      if (filterMode === 'critical') return v.isCritical;
      if (filterMode === 'delayed') return v.status === 'delayed';
      if (filterMode === 'ahead') return v.status === 'ahead';
      return true;
    });
  }, [analysis, filterMode]);

  // Overall Project Stats
  const stats = useMemo(() => {
    if (!analysis) return { delayed: 0, ahead: 0, onTrack: 0, criticalCount: 0, withBaseline: 0, total: 0 };
    let delayed = 0;
    let ahead = 0;
    let onTrack = 0;
    let withBaseline = 0;

    analysis.variances.forEach(v => {
      if (v.hasBaseline) withBaseline++;
      if (v.status === 'delayed') delayed++;
      else if (v.status === 'ahead') ahead++;
      else if (v.status === 'on_track') onTrack++;
    });

    return {
      delayed,
      ahead,
      onTrack,
      criticalCount: analysis.criticalTasks.length,
      withBaseline,
      total: analysis.tasks.length,
    };
  }, [analysis]);

  // Timeline boundaries for Dual-Bar Gantt
  const timelineBounds = useMemo(() => {
    if (!analysis || analysis.tasks.length === 0) {
      const now = new Date();
      return { start: now, end: new Date(now.getTime() + 60 * 86400000), totalDays: 60 };
    }

    let min = new Date();
    let max = new Date();
    let initialized = false;

    analysis.tasks.forEach(node => {
      const t = node.task;
      const datesToInspect = [
        t.start_date,
        t.end_date,
        t.baseline_start_date,
        t.baseline_end_date,
      ].filter(Boolean) as string[];

      datesToInspect.forEach(ds => {
        const d = new Date(ds);
        if (!isNaN(d.getTime())) {
          if (!initialized) {
            min = d;
            max = d;
            initialized = true;
          } else {
            if (d < min) min = d;
            if (d > max) max = d;
          }
        }
      });
    });

    const paddedStart = new Date(min);
    paddedStart.setDate(paddedStart.getDate() - 5);
    paddedStart.setHours(0, 0, 0, 0);

    const paddedEnd = new Date(max);
    paddedEnd.setDate(paddedEnd.getDate() + 10);
    paddedEnd.setHours(23, 59, 59, 999);

    const totalDays = Math.max(14, Math.ceil((paddedEnd.getTime() - paddedStart.getTime()) / (1000 * 60 * 60 * 24)));

    return { start: paddedStart, end: paddedEnd, totalDays };
  }, [analysis]);

  // Helper to get bar position in percentage
  const getBarCoordinates = (startStr?: string, endStr?: string) => {
    if (!startStr || !endStr) return { left: 0, width: 0, visible: false };
    const s = new Date(startStr);
    const e = new Date(endStr);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return { left: 0, width: 0, visible: false };

    const offsetDays = (s.getTime() - timelineBounds.start.getTime()) / (1000 * 60 * 60 * 24);
    const duration = Math.max(1, (e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24) + 1);

    const left = Math.max(0, (offsetDays / timelineBounds.totalDays) * 100);
    const width = Math.min(100 - left, Math.max(1.5, (duration / timelineBounds.totalDays) * 100));

    return { left, width, visible: true, duration: Math.round(duration) };
  };

  // Month divisions for header
  const monthBands = useMemo(() => {
    const bands: { name: string; days: number }[] = [];
    let curr = new Date(timelineBounds.start);
    let currMonth = curr.getMonth();
    let currYear = curr.getFullYear();
    let daysCount = 0;

    while (curr <= timelineBounds.end) {
      if (curr.getMonth() !== currMonth) {
        bands.push({
          name: new Date(currYear, currMonth, 1).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
          days: daysCount,
        });
        currMonth = curr.getMonth();
        currYear = curr.getFullYear();
        daysCount = 0;
      }
      daysCount++;
      curr.setDate(curr.getDate() + 1);
    }

    if (daysCount > 0) {
      bands.push({
        name: new Date(currYear, currMonth, 1).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
        days: daysCount,
      });
    }

    return bands;
  }, [timelineBounds]);

  // Simulation calculation
  const simulationResult = useMemo(() => {
    if (!analysis || !simulatedTaskId) return null;
    const targetVariance = analysis.variances.find(v => v.task.id === simulatedTaskId);
    if (!targetVariance) return null;

    const currentSlack = targetVariance.slackDays;
    const isCriticalOriginal = targetVariance.isCritical;

    // Additional days simulated
    const netImpact = simulationDaysDelta;
    
    // Project finish impact:
    let projectDelayImpact = 0;
    let newSlack = Math.max(0, currentSlack - netImpact);
    let willBecomeCritical = isCriticalOriginal || netImpact > currentSlack;

    if (isCriticalOriginal) {
      projectDelayImpact = netImpact;
    } else {
      projectDelayImpact = Math.max(0, netImpact - currentSlack);
    }

    return {
      task: targetVariance.task,
      originalSlack: currentSlack,
      isCriticalOriginal,
      netImpact,
      projectDelayImpact,
      newSlack,
      willBecomeCritical,
    };
  }, [analysis, simulatedTaskId, simulationDaysDelta]);

  if (!currentProject) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <p className="text-slate-500">No hay iniciativas registradas para analizar la ruta crítica.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 1. TOP HEADER & CONTROLS */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
                <Flame className="w-3.5 h-3.5 text-orange-600" />
                Método de Ruta Crítica (CPM) & Línea Base
              </span>
              {currentProject.baseline_captured_at ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Línea Base congelada: {new Date(currentProject.baseline_captured_at).toLocaleDateString('es-ES')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  Sin línea base de referencia
                </span>
              )}
            </div>

            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <GitFork className="w-6 h-6 text-[#D98236]" />
              Control de Línea Base y Desviación de Tiempos
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
              Análisis matemático de holguras, tareas críticas conectadas por dependencias y detección de desviaciones frente a la planificación congelada.
            </p>
          </div>

          {/* Project Selector & Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5">
              <span className="text-xs font-semibold text-slate-600 pl-1.5">Iniciativa:</span>
              <select
                value={selectedProjectId}
                onChange={e => {
                  setSelectedProjectId(e.target.value);
                  setSimulatedTaskId('');
                }}
                className="text-xs font-bold bg-white border border-slate-200 rounded-md px-2.5 py-1 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-[#D98236]"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Baseline Action Buttons */}
            <button
              onClick={handleCaptureBaseline}
              disabled={isCapturing}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-[#0f172a] text-white hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
              title="Congela las fechas y duraciones actuales como la Línea Base oficial"
            >
              <Bookmark className="w-3.5 h-3.5 text-orange-400" />
              {isCapturing ? 'Guardando...' : currentProject.baseline_captured_at ? 'Actualizar Línea Base' : 'Congelar Línea Base'}
            </button>

            {currentProject.baseline_captured_at && (
              <button
                onClick={handleClearBaseline}
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors"
                title="Limpiar línea base congelada"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}

            {onNavigateToGantt && (
              <button
                onClick={() => onNavigateToGantt(selectedProjectId)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-orange-50 text-[#D98236] hover:bg-orange-100 border border-orange-200 rounded-lg transition-colors"
              >
                <Layers className="w-3.5 h-3.5" />
                Ver en Gantt Principal
              </button>
            )}
          </div>
        </div>

        {/* Feedback Alert if triggered */}
        {captureFeedback && (
          <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{captureFeedback}</span>
          </div>
        )}

        {/* Cycle Detection Alert */}
        {analysis?.hasCycles && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Advertencia de Grafo:</strong> Se detectaron dependencias circulares entre tareas. Se resolvió el cálculo temporal de forma lineal por fechas de calendario. Revisa las dependencias para asegurar un orden secuencial lógico.
            </span>
          </div>
        )}
      </div>

      {/* 2. EXECUTIVE METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Ruta Crítica & Duración */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Duración Ruta Crítica</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 flex items-baseline gap-2">
              <span>{analysis?.criticalPathDurationDays || 0}</span>
              <span className="text-xs font-bold text-slate-500">días calendario</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Secuencia continua más larga que determina la fecha fin del proyecto.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Entregables críticos:</span>
            <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-sm border border-rose-200">
              {stats.criticalCount} tareas (Holgura = 0d)
            </span>
          </div>
        </div>

        {/* Card 2: Desviación de Fecha Final */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Desviación Fecha Fin</span>
            <Calendar className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            {(() => {
              const varianceDays = analysis?.projectEndVarianceDays || 0;
              const formatted = formatVarianceDays(varianceDays);
              return (
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-black ${formatted.isDelayed ? 'text-rose-600' : formatted.isAhead ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {formatted.text}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {formatted.isDelayed ? 'Retraso acumulado' : formatted.isAhead ? 'Adelanto favorable' : 'Alineado al plan'}
                  </span>
                </div>
              );
            })()}
            <p className="text-[11px] text-slate-500 mt-1">
              {currentProject.baseline_deadline 
                ? `Base: ${currentProject.baseline_deadline} → Actual: ${currentProject.deadline || 'N/A'}`
                : 'Sin fecha de término base congelada'}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Impacto en compromiso:</span>
            <span className={`font-semibold ${analysis && analysis.projectEndVarianceDays > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {analysis && analysis.projectEndVarianceDays > 0 ? 'Exposición a retraso' : 'Dentro de tolerancia'}
            </span>
          </div>
        </div>

        {/* Card 3: Entregables con Retraso */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Varianza de Entregables</span>
            <TrendingDown className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 flex items-baseline gap-2">
              <span className="text-rose-600">{stats.delayed}</span>
              <span className="text-xs text-slate-400 font-normal">retrasados de {stats.total}</span>
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-[11px]">
              <span className="text-emerald-600 font-bold">{stats.ahead} adelantados</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600 font-semibold">{stats.onTrack} en tiempo</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Con línea base:</span>
            <span className="font-bold text-slate-700">
              {stats.withBaseline} / {stats.total}
            </span>
          </div>
        </div>

        {/* Card 4: Holgura Promedio & Resiliencia */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Resiliencia del Cronograma</span>
            <Activity className="w-4 h-4 text-indigo-500" />
          </div>
          <div>
            {(() => {
              const nonCritical = analysis?.tasks.filter(t => !t.isCritical) || [];
              const avgSlack = nonCritical.length > 0 
                ? Math.round(nonCritical.reduce((acc, curr) => acc + curr.slackDays, 0) / nonCritical.length)
                : 0;
              return (
                <div className="text-2xl font-black text-slate-900 flex items-baseline gap-2">
                  <span>{avgSlack}</span>
                  <span className="text-xs font-bold text-slate-500">días holgura prom.</span>
                </div>
              );
            })()}
            <p className="text-[11px] text-slate-500 mt-1">
              Margen de maniobra en tareas secundarias antes de impactar la entrega final.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Dependencias definidas:</span>
            <span className="font-bold text-slate-700">
              {analysis?.tasks.reduce((sum, n) => sum + n.predecessors.length, 0) || 0} vínculos FS
            </span>
          </div>
        </div>

      </div>

      {/* 3. NAVIGATION TABS */}
      <div className="border-b border-slate-200 flex items-center justify-between bg-white px-4 rounded-t-xl">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('comparison')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'comparison'
                ? 'border-[#D98236] text-[#D98236]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Gantt Comparativo (Línea Base vs. Actual)</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'matrix'
                ? 'border-[#D98236] text-[#D98236]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Matriz de Variaciones & Holguras</span>
            {stats.delayed > 0 && (
              <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {stats.delayed}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'simulator'
                ? 'border-[#D98236] text-[#D98236]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Simulador de Impacto de Modificaciones</span>
          </button>
        </div>

        {/* Filter on matrix / comparison */}
        {activeTab !== 'simulator' && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium">Filtrar:</span>
            <div className="flex rounded-md bg-slate-100 p-0.5 border border-slate-200">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-2 py-1 text-[11px] font-semibold rounded-xs transition-colors ${filterMode === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'}`}
              >
                Todas ({analysis?.tasks.length || 0})
              </button>
              <button
                onClick={() => setFilterMode('critical')}
                className={`px-2 py-1 text-[11px] font-semibold rounded-xs transition-colors ${filterMode === 'critical' ? 'bg-white text-rose-700 font-bold shadow-2xs' : 'text-slate-600'}`}
              >
                🔥 Críticas ({stats.criticalCount})
              </button>
              <button
                onClick={() => setFilterMode('delayed')}
                className={`px-2 py-1 text-[11px] font-semibold rounded-xs transition-colors ${filterMode === 'delayed' ? 'bg-white text-amber-700 font-bold shadow-2xs' : 'text-slate-600'}`}
              >
                Retrasadas ({stats.delayed})
              </button>
              <button
                onClick={() => setFilterMode('ahead')}
                className={`px-2 py-1 text-[11px] font-semibold rounded-xs transition-colors ${filterMode === 'ahead' ? 'bg-white text-emerald-700 font-bold shadow-2xs' : 'text-slate-600'}`}
              >
                Adelantadas ({stats.ahead})
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. TAB CONTENT 1: COMPARATIVE DUAL-BAR GANTT */}
      {activeTab === 'comparison' && (
        <div className="bg-white rounded-b-xl border border-slate-200 shadow-xs overflow-hidden">
          
          {/* Legend Banner */}
          <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-5 flex-wrap">
              <span className="font-bold text-slate-700">Convención de barras:</span>
              
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-2.5 rounded-xs bg-slate-600 border border-slate-700" />
                <span className="text-slate-600 text-[11px]"><strong>Barra Superior:</strong> Línea Base (Planificado)</span>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-2.5 rounded-xs bg-[#D98236]" />
                <span className="text-slate-600 text-[11px]"><strong>Barra Inferior:</strong> Ejecución Actual</span>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-2.5 rounded-xs bg-rose-600 ring-2 ring-rose-300" />
                <span className="text-rose-700 text-[11px] font-bold">Ruta Crítica (Holgura = 0d)</span>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-2.5 rounded-xs bg-emerald-500" />
                <span className="text-emerald-700 text-[11px] font-medium">Adelantada / Cumplida</span>
              </div>
            </div>

            <span className="text-[11px] text-slate-500">
              Escala: {timelineBounds.totalDays} días totales en ventana
            </span>
          </div>

          {/* Timeline Viewport */}
          <div className="overflow-x-auto">
            <div className="min-w-[950px]">
              
              {/* Timeline Header */}
              <div className="sticky top-0 z-20 bg-slate-900 text-white flex border-b border-slate-800">
                <div className="w-80 shrink-0 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-300 border-r border-slate-800 bg-slate-950 flex items-center justify-between">
                  <span>Entregables & Dependencias</span>
                  <span className="text-[10px] text-slate-400 font-normal">Holgura</span>
                </div>

                <div className="flex-1 flex relative">
                  {monthBands.map((band, idx) => (
                    <div
                      key={idx}
                      className="py-2 px-2 text-center text-xs font-bold border-r border-slate-800 text-orange-400 bg-slate-900 truncate"
                      style={{ width: `${(band.days / timelineBounds.totalDays) * 100}%` }}
                    >
                      {band.name}
                    </div>
                  ))}
                </div>
              </div>

              {/* Rows */}
              {filteredVariances.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs italic">
                  No se encontraron entregables con los filtros seleccionados.
                </div>
              ) : (
                filteredVariances.map((variance, idx) => {
                  const task = variance.task;
                  const currentPos = getBarCoordinates(task.start_date, task.end_date);
                  const baselinePos = getBarCoordinates(variance.baselineStart, variance.baselineEnd);
                  const hasBaseline = variance.hasBaseline;
                  const isCritical = variance.isCritical;
                  const ownerName = teamMembers.find(m => m.id === task.owner_id)?.name || 'Sin asignar';

                  // Predecessors names
                  const predecessorNames = (task.dependencies || [])
                    .map(depId => tasks.find(t => t.id === depId)?.name)
                    .filter(Boolean);

                  return (
                    <div 
                      key={task.id} 
                      className={`flex items-center border-b border-slate-100 hover:bg-slate-50/70 transition-colors ${
                        isCritical ? 'bg-rose-50/20' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                      }`}
                    >
                      {/* Left Column: Meta & Info */}
                      <div className="w-80 shrink-0 px-3 py-2.5 border-r border-slate-200 flex flex-col justify-center">
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {isCritical ? (
                              <span 
                                className="shrink-0 p-0.5 bg-rose-100 text-rose-700 rounded-xs text-[10px] font-black" 
                                title="En Ruta Crítica (Cero Holgura)"
                              >
                                CPM
                              </span>
                            ) : (
                              <span 
                                className="shrink-0 p-0.5 bg-slate-100 text-slate-600 rounded-xs text-[10px] font-bold" 
                                title={`Holgura: ${variance.slackDays} días`}
                              >
                                +{variance.slackDays}d
                              </span>
                            )}
                            <span 
                              className="text-xs font-bold text-slate-900 truncate hover:text-[#D98236] cursor-pointer"
                              onClick={() => onOpenTaskModal && onOpenTaskModal(task, currentProject.id)}
                              title={task.name}
                            >
                              {task.name}
                            </span>
                          </div>

                          {/* Variance Tag */}
                          {hasBaseline ? (
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-xs border shrink-0 ${
                              variance.status === 'delayed' ? 'bg-rose-50 text-rose-700 border-rose-200 font-bold' :
                              variance.status === 'ahead' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold' :
                              'bg-slate-50 text-slate-600 border-slate-200'
                            }`}>
                              {variance.endVarianceDays > 0 ? `+${variance.endVarianceDays}d` :
                               variance.endVarianceDays < 0 ? `${variance.endVarianceDays}d` : '0d'}
                            </span>
                          ) : (
                            <span className="text-[9px] text-slate-400 italic">Sin base</span>
                          )}
                        </div>

                        {/* Predecessors / Sub-meta */}
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                          <span className="truncate max-w-[110px] text-slate-600">{ownerName}</span>
                          <span>•</span>
                          {predecessorNames.length > 0 ? (
                            <span className="truncate max-w-[130px] text-orange-600" title={`Depende de: ${predecessorNames.join(', ')}`}>
                              🔗 Dep: {predecessorNames.join(', ')}
                            </span>
                          ) : (
                            <span className="text-slate-400">Inicio libre</span>
                          )}
                        </div>
                      </div>

                      {/* Right Column: Dual Bar Visual Canvas */}
                      <div className="flex-1 relative h-14 flex flex-col justify-center px-1">
                        
                        {/* Top Bar: Baseline */}
                        <div className="relative h-4 w-full mb-1">
                          {hasBaseline && baselinePos.visible ? (
                            <div
                              className="absolute h-3.5 rounded-xs bg-slate-600 border border-slate-700 text-white text-[9px] px-1 flex items-center justify-between opacity-85 shadow-2xs"
                              style={{
                                left: `${baselinePos.left}%`,
                                width: `${baselinePos.width}%`,
                              }}
                              title={`Línea Base: ${variance.baselineStart} al ${variance.baselineEnd} (${baselinePos.duration}d)`}
                            >
                              <span className="truncate text-[8px] tracking-tight text-slate-200">
                                Base ({baselinePos.duration}d)
                              </span>
                            </div>
                          ) : (
                            <div className="text-[9px] text-slate-300 italic pl-1">
                              Sin registro de línea base
                            </div>
                          )}
                        </div>

                        {/* Bottom Bar: Current Schedule */}
                        <div className="relative h-5 w-full">
                          {currentPos.visible ? (
                            <div
                              className={`absolute h-4 rounded-xs text-white text-[10px] font-bold px-1.5 flex items-center justify-between shadow-xs transition-all cursor-pointer hover:ring-2 hover:ring-orange-400 active:scale-[0.99] ${
                                isCritical 
                                  ? 'bg-rose-600 ring-2 ring-rose-400 shadow-rose-200' 
                                  : variance.status === 'delayed'
                                  ? 'bg-amber-600'
                                  : variance.status === 'ahead'
                                  ? 'bg-emerald-600'
                                  : 'bg-[#D98236]'
                              }`}
                              style={{
                                left: `${currentPos.left}%`,
                                width: `${currentPos.width}%`,
                              }}
                              onClick={() => onOpenTaskModal && onOpenTaskModal(task, currentProject.id)}
                              title={`Clic para editar entregable: ${task.name} | Actual: ${task.start_date} al ${task.end_date} (${currentPos.duration}d)`}
                            >
                              <span className="truncate text-[9px] drop-shadow-2xs">
                                {isCritical ? '🔥 ' : ''}{task.name} ({currentPos.duration}d)
                              </span>

                              {/* Slack indicator badge on right */}
                              {variance.slackDays > 0 && (
                                <span className="text-[8px] bg-white/25 px-1 rounded-xs font-normal">
                                  +{variance.slackDays}d holgura
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="text-[9px] text-slate-300 italic pl-1">
                              Sin fechas actuales
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB CONTENT 2: VARIANCE & SLACK MATRIX */}
      {activeTab === 'matrix' && (
        <div className="bg-white rounded-b-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-3">Entregable</th>
                  <th className="py-3 px-2 text-center">Tipo CPM</th>
                  <th className="py-3 px-3">Dependencias</th>
                  <th className="py-3 px-2 text-center">Inicio (Base / Act.)</th>
                  <th className="py-3 px-2 text-center">Fin (Base / Act.)</th>
                  <th className="py-3 px-2 text-center">Duración (Base / Act.)</th>
                  <th className="py-3 px-2 text-center">Varianza Fin</th>
                  <th className="py-3 px-2 text-center">Holgura Total</th>
                  <th className="py-3 px-3 text-center">Impacto Fecha Final</th>
                  <th className="py-3 px-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVariances.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-8 text-slate-400 italic">
                      No hay entregables que coincidan con los filtros.
                    </td>
                  </tr>
                ) : (
                  filteredVariances.map(variance => {
                    const t = variance.task;
                    const isCritical = variance.isCritical;
                    const formatted = formatVarianceDays(variance.endVarianceDays);

                    // Predecessors list
                    const predLabels = (t.dependencies || [])
                      .map(id => tasks.find(item => item.id === id)?.name || id)
                      .filter(Boolean);

                    return (
                      <tr 
                        key={t.id} 
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isCritical ? 'bg-rose-50/30' : ''
                        }`}
                      >
                        {/* Task name */}
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          <div className="flex items-center gap-1.5">
                            {isCritical && <Flame className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                            <span 
                              className="hover:text-[#D98236] cursor-pointer"
                              onClick={() => onOpenTaskModal && onOpenTaskModal(t, currentProject.id)}
                            >
                              {t.name}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            Resp: {teamMembers.find(m => m.id === t.owner_id)?.name || 'N/A'}
                          </div>
                        </td>

                        {/* CPM Type */}
                        <td className="py-3 px-2 text-center">
                          {isCritical ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                              <Flame className="w-3 h-3 text-rose-600" />
                              CRÍTICO
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                              Flexible
                            </span>
                          )}
                        </td>

                        {/* Dependencies */}
                        <td className="py-3 px-3 text-[11px] text-slate-600">
                          {predLabels.length > 0 ? (
                            <div className="space-y-0.5">
                              {predLabels.map((pName, pIdx) => (
                                <div key={pIdx} className="truncate max-w-[140px] text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-xs" title={pName}>
                                  ← {pName}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Ninguna</span>
                          )}
                        </td>

                        {/* Start Dates */}
                        <td className="py-3 px-2 text-center font-mono text-[11px]">
                          <div className="text-slate-500 line-through text-[10px]">{variance.baselineStart || '—'}</div>
                          <div className="font-bold text-slate-800">{variance.currentStart || '—'}</div>
                        </td>

                        {/* End Dates */}
                        <td className="py-3 px-2 text-center font-mono text-[11px]">
                          <div className="text-slate-500 line-through text-[10px]">{variance.baselineEnd || '—'}</div>
                          <div className={`font-bold ${variance.endVarianceDays > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                            {variance.currentEnd || '—'}
                          </div>
                        </td>

                        {/* Duration */}
                        <td className="py-3 px-2 text-center text-[11px]">
                          <div className="text-slate-400 text-[10px]">{variance.baselineDuration}d plan</div>
                          <div className="font-bold text-slate-800">{variance.currentDuration}d real</div>
                        </td>

                        {/* Variance End Days */}
                        <td className="py-3 px-2 text-center">
                          {variance.hasBaseline ? (
                            <span className={`inline-block px-2 py-0.5 rounded-sm text-xs border ${formatted.badgeClass}`}>
                              {formatted.text}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[10px]">Sin base</span>
                          )}
                        </td>

                        {/* Slack (Float) */}
                        <td className="py-3 px-2 text-center">
                          <span className={`px-2 py-0.5 rounded-sm font-bold text-xs ${
                            isCritical ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {variance.slackDays} d
                          </span>
                        </td>

                        {/* Impact on Project End Date */}
                        <td className="py-3 px-3 text-center">
                          {variance.impactOnProjectEndDays > 0 ? (
                            <span className="text-xs font-bold text-rose-700 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-sm">
                              +{variance.impactOnProjectEndDays} días al fin
                            </span>
                          ) : variance.status === 'delayed' && variance.slackDays > 0 ? (
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-sm border border-amber-200">
                              Absorbido por holgura
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">Sin impacto</span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-3 text-center">
                          {variance.status === 'delayed' && (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              Atrasada
                            </span>
                          )}
                          {variance.status === 'ahead' && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              Adelantada
                            </span>
                          )}
                          {variance.status === 'on_track' && (
                            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                              En tiempo
                            </span>
                          )}
                          {variance.status === 'no_baseline' && (
                            <span className="text-[10px] text-slate-400 italic">
                              Pendiente
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. TAB CONTENT 3: INTERACTIVE MODIFICATION IMPACT SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="bg-white rounded-b-xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                Análisis "What-If" de Cronograma
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Simulador de Modificaciones & Efecto Dominó en la Ruta Crítica
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Selecciona cualquier entregable y simula un adelanto o retraso en días para proyectar de inmediato cómo reacciona la red de dependencias, si se agota la holgura disponible y cuántos días se moverá la fecha final de entrega.
            </p>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Selecciona la Tarea a Modificar:
              </label>
              <select
                value={simulatedTaskId}
                onChange={e => setSimulatedTaskId(e.target.value)}
                className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#D98236]"
              >
                <option value="">Selecciona un entregable...</option>
                {analysis?.tasks.map(node => (
                  <option key={node.task.id} value={node.task.id}>
                    {node.isCritical ? '🔥 [CRÍTICA] ' : `[Holgura: ${node.slackDays}d] `}
                    {node.task.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Desviación Simulada en Días:
                </label>
                <span className={`text-xs font-black px-2 py-0.5 rounded-sm ${
                  simulationDaysDelta > 0 ? 'bg-rose-100 text-rose-800' : simulationDaysDelta < 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100'
                }`}>
                  {simulationDaysDelta > 0 ? `+${simulationDaysDelta} días de atraso` : simulationDaysDelta < 0 ? `${simulationDaysDelta} días de adelanto` : '0 días'}
                </span>
              </div>
              <input
                type="range"
                min="-15"
                max="30"
                step="1"
                value={simulationDaysDelta}
                onChange={e => setSimulationDaysDelta(parseInt(e.target.value, 10))}
                className="w-full accent-[#D98236] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>-15 días (Acelerar)</span>
                <span>0 días</span>
                <span>+30 días (Retraso extremo)</span>
              </div>
            </div>
          </div>

          {/* Simulation Output Card */}
          {simulationResult ? (
            <div className={`p-5 rounded-xl border transition-all ${
              simulationResult.projectDelayImpact > 0 
                ? 'bg-rose-50/50 border-rose-200' 
                : 'bg-emerald-50/50 border-emerald-200'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-xs ${
                      simulationResult.isCriticalOriginal 
                        ? 'bg-rose-600 text-white' 
                        : 'bg-slate-700 text-white'
                    }`}>
                      {simulationResult.isCriticalOriginal ? 'Tarea Crítica Original' : 'Tarea con Holgura'}
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {simulationResult.task.name}
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-slate-900 mt-2">
                    {simulationResult.projectDelayImpact > 0 ? (
                      <span className="text-rose-600 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-rose-600" />
                        Impacto Directo: Retraso de +{simulationResult.projectDelayImpact} días en la entrega final del proyecto
                      </span>
                    ) : (
                      <span className="text-emerald-700 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        Retraso absorbido: Sin impacto en la fecha de finalización del proyecto
                      </span>
                    )}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-xs">
                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">Holgura Original</span>
                      <div className="text-base font-bold text-slate-900 mt-0.5">
                        {simulationResult.originalSlack} días
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">Nueva Holgura Proyectada</span>
                      <div className={`text-base font-bold mt-0.5 ${simulationResult.newSlack === 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                        {simulationResult.newSlack} días {simulationResult.newSlack === 0 ? '(Agotada)' : ''}
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">¿Pasa a la Ruta Crítica?</span>
                      <div className="text-base font-bold mt-0.5">
                        {simulationResult.willBecomeCritical ? (
                          <span className="text-rose-600 font-black">SÍ (Crítica)</span>
                        ) : (
                          <span className="text-emerald-600 font-bold">No (Aún holgada)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mt-4 leading-relaxed">
                    <strong>Explicación de Consultoría:</strong>{' '}
                    {simulationResult.isCriticalOriginal ? (
                      `Al tratarse de una tarea que ya formaba parte de la ruta crítica (holgura = 0), cualquier alteración de ${simulationResult.netImpact} días se transfiere en proporción 1:1 a la fecha de término del proyecto y a todos sus entregables sucesores.`
                    ) : simulationResult.netImpact > simulationResult.originalSlack ? (
                      `Esta tarea contaba con ${simulationResult.originalSlack} días de holgura. El atraso simulado de ${simulationResult.netImpact} días consume por completo el margen disponible y genera un excedente de +${simulationResult.projectDelayImpact} días de impacto directo en la fecha fin.`
                    ) : (
                      `El atraso simulado de ${simulationResult.netImpact} días es menor a los ${simulationResult.originalSlack} días de holgura que posee la tarea. Por lo tanto, el cronograma resiste el desvío sin comprometer la entrega final acordada con el cliente.`
                    )}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400 text-xs">
              Elige una tarea arriba para calcular instantáneamente el efecto sobre la ruta crítica y la fecha de entrega.
            </div>
          )}
        </div>
      )}

    </div>
  );
}
