import React, { useState, useMemo, useEffect } from 'react';
import { Project, Task, Meeting, Communication, Invoice, TeamMember } from '../types';
import { useData } from '../context/DataContext';
import { 
  evaluatePortfolioAttention, 
  ProjectAttentionEvaluation,
  AttentionUrgency 
} from '../utils/attentionEngine';
import {
  AlertTriangle,
  Clock,
  Target,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  GitFork,
  Calendar,
  Layers,
  ChevronRight,
  ChevronDown,
  Activity,
  AlertCircle,
  Eye,
  Briefcase,
  Users,
  TrendingDown,
  Sparkles,
  Network,
  X,
  Search,
  ExternalLink,
  CheckSquare,
  BarChart3
} from 'lucide-react';

interface AttentionEngineProps {
  projects: Project[];
  tasks: Task[];
  meetings: Meeting[];
  communications: Communication[];
  invoices: Invoice[];
  teamMembers: TeamMember[];
  currentUserName?: string;
  onNavigate?: (viewId: string, projectId?: string) => void;
}

export default function AttentionEngine({
  projects,
  tasks,
  meetings,
  communications,
  invoices,
  teamMembers,
  currentUserName = 'Director de Consultoría',
  onNavigate,
}: AttentionEngineProps) {
  const { decisions = [], agreements = [], risks = [] } = useData();
  const [viewMode, setViewMode] = useState<'top3' | 'matrix'>('top3');
  const [selectedUrgencyFilter, setSelectedUrgencyFilter] = useState<string>('ALL');
  const [selectedModalUrgency, setSelectedModalUrgency] = useState<AttentionUrgency | null>(null);
  const [modalSearchQuery, setModalSearchQuery] = useState<string>('');
  const [expandedProjectTasks, setExpandedProjectTasks] = useState<Record<string, boolean>>({});

  const toggleExpandTasks = (projectId: string) => {
    setExpandedProjectTasks(prev => ({ ...prev, [projectId]: !prev[projectId] }));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedModalUrgency(null);
      }
    };
    if (selectedModalUrgency) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedModalUrgency]);

  // Run the Heuristic Attention Algorithm
  const summary = useMemo(() => {
    return evaluatePortfolioAttention(
      projects,
      tasks,
      meetings,
      communications,
      invoices,
      teamMembers,
      decisions,
      agreements,
      risks
    );
  }, [projects, tasks, meetings, communications, invoices, teamMembers, decisions, agreements, risks]);

  // Filtered evaluations for Matrix view
  const filteredEvaluations = useMemo(() => {
    if (selectedUrgencyFilter === 'ALL') return summary.allEvaluations;
    return summary.allEvaluations.filter(e => e.urgency === selectedUrgencyFilter);
  }, [summary.allEvaluations, selectedUrgencyFilter]);

  const getUrgencyBadge = (urgency: AttentionUrgency) => {
    switch (urgency) {
      case 'CRITICAL':
        return {
          bg: 'bg-rose-50',
          text: 'text-rose-800',
          border: 'border-rose-200',
          dot: 'bg-rose-600',
          label: 'Atención Crítica',
          icon: AlertTriangle,
        };
      case 'ATTENTION':
        return {
          bg: 'bg-amber-50',
          text: 'text-amber-900',
          border: 'border-amber-200',
          dot: 'bg-amber-500',
          label: 'Atención Requerida',
          icon: Clock,
        };
      case 'MONITOR':
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-800',
          border: 'border-blue-200',
          dot: 'bg-blue-500',
          label: 'Bajo Monitoreo',
          icon: Eye,
        };
      case 'STABLE':
      default:
        return {
          bg: 'bg-slate-50',
          text: 'text-slate-700',
          border: 'border-slate-200',
          dot: 'bg-emerald-500',
          label: 'En Control',
          icon: CheckCircle2,
        };
    }
  };

  const getUrgencyConfig = (urgency: AttentionUrgency) => {
    switch (urgency) {
      case 'CRITICAL':
        return {
          title: 'Iniciativas en Atención Crítica Hoy',
          subtitle: 'Proyectos con alta exposición que requieren intervención o decisión de la Dirección Estratégica.',
          description: 'Criterio CSEA: Score ≥ 70, tareas vencidas en ruta crítica, retraso severo vs línea base o bloqueos de gobernanza.',
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          dot: 'bg-rose-500',
          ring: 'ring-rose-500/30',
          icon: AlertTriangle,
          textColor: 'text-rose-700',
          headerBg: 'from-rose-950 via-slate-900 to-slate-900',
          tabActive: 'bg-rose-600 text-white shadow-xs',
        };
      case 'ATTENTION':
        return {
          title: 'Iniciativas que Requieren Atención',
          subtitle: 'Proyectos con alertas tempranas de desviación que ameritan revisión prioritaria con el PM.',
          description: 'Criterio CSEA: Score 40-69, tareas atrasadas, desvío de avance vs plan o acuerdos de gobernanza pendientes.',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          dot: 'bg-amber-400',
          ring: 'ring-amber-400/30',
          icon: Clock,
          textColor: 'text-amber-700',
          headerBg: 'from-amber-950 via-slate-900 to-slate-900',
          tabActive: 'bg-amber-600 text-white shadow-xs',
        };
      case 'MONITOR':
        return {
          title: 'Iniciativas Bajo Monitoreo',
          subtitle: 'Proyectos en ejecución regular con desviaciones menores bajo control y seguimiento preventivo.',
          description: 'Criterio CSEA: Score 20-39, variaciones leves respecto a la línea base o seguimiento rutinario de entregables.',
          badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          dot: 'bg-blue-400',
          ring: 'ring-blue-400/30',
          icon: Eye,
          textColor: 'text-blue-700',
          headerBg: 'from-blue-950 via-slate-900 to-slate-900',
          tabActive: 'bg-blue-600 text-white shadow-xs',
        };
      case 'STABLE':
      default:
        return {
          title: 'Iniciativas en Control y Estables',
          subtitle: 'Proyectos con ritmo de ejecución óptimo, entregables en tiempo y gobernanza al día.',
          description: 'Criterio CSEA: Score < 20, sin tareas vencidas en ruta crítica y avance real conforme a lo programado.',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          dot: 'bg-emerald-400',
          ring: 'ring-emerald-400/30',
          icon: CheckCircle2,
          textColor: 'text-emerald-700',
          headerBg: 'from-emerald-950 via-slate-900 to-slate-900',
          tabActive: 'bg-emerald-600 text-white shadow-xs',
        };
    }
  };

  // Filtered evaluations for Modal view
  const modalEvaluations = useMemo(() => {
    if (!selectedModalUrgency) return [];
    let list = summary.allEvaluations.filter(e => e.urgency === selectedModalUrgency);
    if (modalSearchQuery.trim()) {
      const q = modalSearchQuery.toLowerCase();
      list = list.filter(e =>
        e.project.name.toLowerCase().includes(q) ||
        (e.project.category && e.project.category.toLowerCase().includes(q)) ||
        e.pmName.toLowerCase().includes(q) ||
        e.cause.toLowerCase().includes(q) ||
        e.requiredAction.toLowerCase().includes(q)
      );
    }
    return list;
  }, [summary.allEvaluations, selectedModalUrgency, modalSearchQuery]);

  // Today's Date formatted in Spanish
  const todayFormatted = useMemo(() => {
    return new Intl.DateTimeFormat('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date());
  }, []);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all">
      {/* 1. Header: Saludo Matutino y Resumen de Intervención */}
      <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-400 text-[10px] font-bold uppercase tracking-wider border border-orange-500/30">
                <Sparkles className="w-3 h-3" />
                Attention Engine • PM Copilot
              </span>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-xs text-slate-300 capitalize">{todayFormatted}</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Buenos días, {currentUserName}</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              De <strong className="text-white font-semibold">{summary.activeProjects} iniciativas activas</strong> en tu portafolio,{' '}
              <strong className="text-orange-400 font-semibold">{summary.criticalCount + summary.attentionCount} proyectos</strong> presentan
              señales tempranas de desviación que requieren tu atención o decisiones hoy.
            </p>
          </div>

          {/* Quick Metrics & View Mode Toggles */}
          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Toggle */}
            <div className="bg-slate-800/80 p-1 rounded-lg border border-slate-700 flex items-center text-xs font-semibold">
              <button
                onClick={() => setViewMode('top3')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  viewMode === 'top3' 
                    ? 'bg-orange-600 text-white shadow-xs' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Top 3 Prioritarios
              </button>
              <button
                onClick={() => setViewMode('matrix')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  viewMode === 'matrix' 
                    ? 'bg-orange-600 text-white shadow-xs' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Portafolio Completo ({summary.allEvaluations.length})
              </button>
            </div>
          </div>
        </div>

        {/* Signals Metric Strip - Interactive Click to View Detail */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-slate-700/60">
          <button
            type="button"
            onClick={() => {
              setSelectedModalUrgency('CRITICAL');
              setModalSearchQuery('');
            }}
            className="group text-left bg-slate-800/60 hover:bg-slate-800/90 rounded-lg p-2.5 px-3 border border-slate-700/60 hover:border-rose-500/70 flex items-center justify-between cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-rose-500/40"
            title="Hacer clic para ver detalle de iniciativas críticas hoy"
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-rose-300 font-medium uppercase tracking-wider block">Críticos Hoy</span>
                <span className="text-[9px] text-rose-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                  Ver detalle →
                </span>
              </div>
              <span className="text-lg font-bold text-white">{summary.criticalCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-4 ring-rose-500/20 group-hover:ring-rose-500/50 transition-all" />
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-rose-300 transition-transform group-hover:translate-x-0.5" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedModalUrgency('ATTENTION');
              setModalSearchQuery('');
            }}
            className="group text-left bg-slate-800/60 hover:bg-slate-800/90 rounded-lg p-2.5 px-3 border border-slate-700/60 hover:border-amber-500/70 flex items-center justify-between cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            title="Hacer clic para ver detalle de iniciativas en atención"
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-amber-300 font-medium uppercase tracking-wider block">En Atención</span>
                <span className="text-[9px] text-amber-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                  Ver detalle →
                </span>
              </div>
              <span className="text-lg font-bold text-white">{summary.attentionCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-4 ring-amber-400/20 group-hover:ring-amber-400/50 transition-all" />
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-300 transition-transform group-hover:translate-x-0.5" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedModalUrgency('MONITOR');
              setModalSearchQuery('');
            }}
            className="group text-left bg-slate-800/60 hover:bg-slate-800/90 rounded-lg p-2.5 px-3 border border-slate-700/60 hover:border-blue-500/70 flex items-center justify-between cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            title="Hacer clic para ver detalle de iniciativas bajo monitoreo"
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-blue-300 font-medium uppercase tracking-wider block">Bajo Monitoreo</span>
                <span className="text-[9px] text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                  Ver detalle →
                </span>
              </div>
              <span className="text-lg font-bold text-white">{summary.monitoringCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 ring-4 ring-blue-400/20 group-hover:ring-blue-400/50 transition-all" />
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-300 transition-transform group-hover:translate-x-0.5" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedModalUrgency('STABLE');
              setModalSearchQuery('');
            }}
            className="group text-left bg-slate-800/60 hover:bg-slate-800/90 rounded-lg p-2.5 px-3 border border-slate-700/60 hover:border-emerald-500/70 flex items-center justify-between cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            title="Hacer clic para ver detalle de iniciativas estables"
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-emerald-300 font-medium uppercase tracking-wider block">Estables</span>
                <span className="text-[9px] text-emerald-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                  Ver detalle →
                </span>
              </div>
              <span className="text-lg font-bold text-white">{summary.stableCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20 group-hover:ring-emerald-400/50 transition-all" />
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-300 transition-transform group-hover:translate-x-0.5" />
            </div>
          </button>
        </div>
      </div>

      {/* 2. Top 3 Projects Cards Grid */}
      {viewMode === 'top3' && (
        <div className="p-5 space-y-4 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-orange-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Los 3 Proyectos que Requieren tu Intervención Hoy
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Ordenados por índice de exposición heurístico
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {summary.topAttentionProjects.map((item) => {
              const badge = getUrgencyBadge(item.urgency);
              const BadgeIcon = badge.icon;

              return (
                <div
                  key={item.project.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="p-4.5 border-b border-slate-100 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        <BadgeIcon className="w-3 h-3" />
                        {badge.label}
                      </span>
                      
                      {/* Attention Score Gauge */}
                      <span 
                        className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
                        title="Índice de Atención calculado a partir de ruta crítica, varianza de línea base y entregables"
                      >
                        Score: {item.attentionScore}/100
                      </span>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        {item.project.category || 'Iniciativa Estratégica'}
                      </div>
                      <h4 className="text-base font-bold text-slate-900 leading-tight mt-0.5">
                        {item.project.name}
                      </h4>
                    </div>

                    {/* PM Responsible & Timeline */}
                    <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-50">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center border border-slate-200">
                          {item.pmInitials}
                        </span>
                        <span className="font-medium text-slate-800 text-[11px] truncate max-w-[130px]">
                          {item.pmName}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block leading-tight">Vencimiento</span>
                        <span className="font-semibold text-slate-700 text-[11px]">
                          {item.daysRemaining !== null 
                            ? (item.daysRemaining < 0 
                                ? `${Math.abs(item.daysRemaining)}d vencido` 
                                : `${item.daysRemaining}d restantes`)
                            : (item.project.deadline || 'Sin fecha')}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar (Actual vs Expected) */}
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">Avance Real vs Esperado</span>
                        <span className="font-bold text-slate-800">
                          {item.actualProgress}% <span className="text-slate-400 font-normal">/ {item.expectedProgress}%</span>
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden flex">
                        <div 
                          className={`h-1.5 rounded-full ${item.actualProgress >= item.expectedProgress ? 'bg-emerald-500' : 'bg-orange-500'}`}
                          style={{ width: `${item.actualProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Body: Causa Raíz, Impacto, Acción Requerida */}
                  <div className="p-4.5 space-y-3 text-xs flex-1">
                    {/* Causa Raíz */}
                    <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        Causa Raíz Detectada
                      </div>
                      <p className="text-slate-800 font-medium leading-relaxed text-[11px]">
                        {item.cause}
                      </p>
                    </div>

                    {/* Impacto Proyectado */}
                    <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        <Target className="w-3 h-3 text-rose-600" />
                        Impacto en Hito / Operación
                      </div>
                      <p className="text-slate-700 leading-relaxed text-[11px]">
                        {item.impact}
                      </p>
                    </div>

                    {/* Acción Requerida (C-Level Directive) */}
                    <div className="bg-[#0f172a] text-white rounded-lg p-2.5 border border-slate-800 space-y-1 shadow-2xs">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1">
                        <ArrowRight className="w-3 h-3 text-orange-400" />
                        Acción Sugerida al PM
                      </div>
                      <p className="text-slate-200 text-[11px] leading-relaxed">
                        {item.requiredAction}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer: Quick Navigation Action Links */}
                  <div className="p-3 px-4.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                    <button
                      onClick={() => onNavigate && onNavigate('gantt', item.project.id)}
                      className="text-[11px] font-semibold text-slate-700 hover:text-orange-600 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <GitFork className="w-3.5 h-3.5 text-slate-400" />
                      <span>Ruta Crítica</span>
                    </button>

                    <button
                      onClick={() => onNavigate && onNavigate('baseline', item.project.id)}
                      className="text-[11px] font-semibold text-slate-700 hover:text-orange-600 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span>Línea Base</span>
                    </button>

                    <button
                      onClick={() => onNavigate && onNavigate('raid', item.project.id)}
                      className="text-[11px] font-semibold text-slate-700 hover:text-orange-600 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Network className="w-3.5 h-3.5 text-slate-400" />
                      <span>Red Causal</span>
                    </button>

                    <button
                      onClick={() => onNavigate && onNavigate('projects', item.project.id)}
                      className="text-[11px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-0.5 transition-colors cursor-pointer ml-auto"
                    >
                      <span>Gestionar</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Portfolio Matrix View (All Projects Evaluated) */}
      {viewMode === 'matrix' && (
        <div className="p-5 space-y-4">
          {/* Filter Bar by Urgency */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Filtrar por Diagnóstico:
              </span>
              <div className="flex items-center gap-1">
                {[
                  { id: 'ALL', label: `Todos (${summary.allEvaluations.length})` },
                  { id: 'CRITICAL', label: `Críticos (${summary.criticalCount})` },
                  { id: 'ATTENTION', label: `Atención (${summary.attentionCount})` },
                  { id: 'MONITOR', label: `Monitoreo (${summary.monitoringCount})` },
                  { id: 'STABLE', label: `Estables (${summary.stableCount})` },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedUrgencyFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      selectedUrgencyFilter === tab.id
                        ? 'bg-[#0f172a] text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <span className="text-xs text-slate-500">
              Mostrando {filteredEvaluations.length} iniciativas
            </span>
          </div>

          {/* Evaluation Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Iniciativa / Categoría</th>
                  <th className="py-3 px-4">PM Responsable</th>
                  <th className="py-3 px-4">Diagnóstico</th>
                  <th className="py-3 px-4">Avance (Real/Esperado)</th>
                  <th className="py-3 px-4">Causa Raíz Detectada</th>
                  <th className="py-3 px-4">Acción Sugerida</th>
                  <th className="py-3 px-4 text-right">Intervención</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEvaluations.map((item) => {
                  const badge = getUrgencyBadge(item.urgency);
                  const BadgeIcon = badge.icon;

                  return (
                    <tr key={item.project.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-xs">{item.project.name}</div>
                        <div className="text-[10px] text-slate-400">{item.project.category || 'Estratégico'}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold text-[9px] flex items-center justify-center border border-slate-200">
                            {item.pmInitials}
                          </span>
                          <span className="font-medium text-slate-800 text-xs">{item.pmName}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          <BadgeIcon className="w-3 h-3" />
                          {badge.label}
                        </span>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          Score: {item.attentionScore}/100
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-800 text-xs">
                          {item.actualProgress}% <span className="text-slate-400 font-normal">/ {item.expectedProgress}%</span>
                        </div>
                        <div className="w-20 bg-slate-100 rounded-full h-1 mt-1 overflow-hidden">
                          <div 
                            className={`h-1 rounded-full ${item.actualProgress >= item.expectedProgress ? 'bg-emerald-500' : 'bg-orange-500'}`} 
                            style={{ width: `${item.actualProgress}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <div className="line-clamp-2 text-[11px] text-slate-800 font-medium" title={item.cause}>
                          {item.cause}
                        </div>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <div className="line-clamp-2 text-[11px] text-slate-600" title={item.requiredAction}>
                          {item.requiredAction}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => onNavigate && onNavigate('projects', item.project.id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-orange-600 hover:text-white text-slate-700 font-bold rounded-md text-[11px] transition-colors cursor-pointer"
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Resource Overload Callout (if detected) */}
      {summary.overloadedMembers.length > 0 && (
        <div className="p-4 px-5 bg-amber-50/70 border-t border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950">
          <div className="flex items-center gap-2.5">
            <Users className="w-4 h-4 text-amber-700 shrink-0" />
            <div>
              <span className="font-bold">Alerta de Capacidad Organizacional (CSEA - Dimensión CAP):</span>{' '}
              <span className="text-amber-900">
                {summary.overloadedMembers.map(m => `${m.memberName} (${m.projectCount} proyectos, ${m.criticalCount} en atención)`).join(', ')}.
                Existe concentración de asignaciones críticas que podría derivar en retrasos operativos concurrentes.
              </span>
            </div>
          </div>

          <button
            onClick={() => onNavigate && onNavigate('team')}
            className="px-3 py-1 bg-amber-200/80 hover:bg-amber-200 text-amber-950 font-bold rounded-md text-[11px] shrink-0 transition-colors cursor-pointer"
          >
            Ver Matriz RACI & Carga
          </button>
        </div>
      )}

      {/* 5. Detail Modal for Selected Urgency Category */}
      {selectedModalUrgency && (
        <div 
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedModalUrgency(null);
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            {(() => {
              const config = getUrgencyConfig(selectedModalUrgency);
              const HeaderIcon = config.icon;
              return (
                <div className={`p-5 sm:p-6 bg-gradient-to-r ${config.headerBg} text-white border-b border-slate-700/60`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl ${config.badgeBg} border`}>
                        <HeaderIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${config.badgeBg}`}>
                            <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                            {selectedModalUrgency === 'CRITICAL' ? 'Nivel Crítico' : selectedModalUrgency === 'ATTENTION' ? 'Atención Requerida' : selectedModalUrgency === 'MONITOR' ? 'Bajo Monitoreo' : 'En Control'}
                          </span>
                          <span className="text-slate-400 text-xs">•</span>
                          <span className="text-xs text-slate-300 font-medium">
                            {modalEvaluations.length} de {summary.allEvaluations.filter(e => e.urgency === selectedModalUrgency).length} iniciativas
                          </span>
                        </div>
                        <h2 className="text-lg sm:text-xl font-bold text-white mt-1">
                          {config.title}
                        </h2>
                        <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                          {config.description}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedModalUrgency(null)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                      title="Cerrar ventana (Esc)"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Switcher Pills between the 4 Urgency Categories */}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-700/50 overflow-x-auto pb-1 text-xs">
                    <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider shrink-0 mr-1">
                      Categoría:
                    </span>
                    <button
                      onClick={() => setSelectedModalUrgency('CRITICAL')}
                      className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                        selectedModalUrgency === 'CRITICAL'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-slate-800/80 hover:bg-slate-800 text-rose-300 border border-slate-700'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      Críticos ({summary.criticalCount})
                    </button>
                    <button
                      onClick={() => setSelectedModalUrgency('ATTENTION')}
                      className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                        selectedModalUrgency === 'ATTENTION'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-slate-800/80 hover:bg-slate-800 text-amber-300 border border-slate-700'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      En Atención ({summary.attentionCount})
                    </button>
                    <button
                      onClick={() => setSelectedModalUrgency('MONITOR')}
                      className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                        selectedModalUrgency === 'MONITOR'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-800/80 hover:bg-slate-800 text-blue-300 border border-slate-700'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      Bajo Monitoreo ({summary.monitoringCount})
                    </button>
                    <button
                      onClick={() => setSelectedModalUrgency('STABLE')}
                      className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                        selectedModalUrgency === 'STABLE'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-800/80 hover:bg-slate-800 text-emerald-300 border border-slate-700'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Estables ({summary.stableCount})
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Search & Filter Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por iniciativa, PM o diagnóstico..."
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                {modalSearchQuery && (
                  <button
                    onClick={() => setModalSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-slate-500">
                <span>Ordenado por Score de Atención (CSEA)</span>
              </div>
            </div>

            {/* Modal Body / Project List */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 bg-slate-100/50">
              {modalEvaluations.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">
                    {modalSearchQuery 
                      ? 'No se encontraron iniciativas con ese criterio' 
                      : 'No hay iniciativas en este estado'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    {modalSearchQuery 
                      ? 'Intenta con otro término de búsqueda o limpia el filtro.' 
                      : 'Actualmente no existen proyectos que coincidan con este nivel de urgencia en el portafolio.'}
                  </p>
                  {modalSearchQuery && (
                    <button
                      onClick={() => setModalSearchQuery('')}
                      className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Limpiar búsqueda
                    </button>
                  )}
                </div>
              ) : (
                modalEvaluations.map((item) => {
                  const badge = getUrgencyBadge(item.urgency);
                  const isExpanded = !!expandedProjectTasks[item.project.id];
                  const hasOverdueCritical = item.overdueCriticalTasks && item.overdueCriticalTasks.length > 0;

                  return (
                    <div
                      key={item.project.id}
                      className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition-all overflow-hidden"
                    >
                      {/* Top Bar of Project */}
                      <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              {item.project.category || 'Estratégico'}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                              item.project.priority === 'Urgente' ? 'bg-red-50 text-red-700 border-red-200' :
                              item.project.priority === 'Dificil' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-slate-50 text-slate-700 border-slate-200'
                            }`}>
                              Prioridad {item.project.priority || 'Medio'}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                              {item.project.status}
                            </span>
                          </div>

                          {/* Attention Score Badge */}
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                              Score: {item.attentionScore}/100
                            </span>
                          </div>
                        </div>

                        {/* Title & PM Row */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div>
                            <h3 className="text-base font-bold text-slate-900">
                              {item.project.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                              <span>Patrocinador / PM:</span>
                              <div className="flex items-center gap-1.5 font-medium text-slate-800">
                                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold text-[9px] flex items-center justify-center border border-slate-200">
                                  {item.pmInitials}
                                </span>
                                <span>{item.pmName}</span>
                                <span className="text-slate-400 text-[11px]">({item.pmRole})</span>
                              </div>
                            </div>
                          </div>

                          {/* Progress Comparison */}
                          <div className="bg-slate-50 rounded-lg p-2.5 px-3 border border-slate-200 min-w-[200px]">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-slate-500 font-medium">Avance Real / Esperado:</span>
                              <span className="font-bold text-slate-900">
                                {item.actualProgress}% <span className="text-slate-400 font-normal">/ {item.expectedProgress}%</span>
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full ${item.actualProgress >= item.expectedProgress ? 'bg-emerald-500' : 'bg-orange-500'}`}
                                style={{ width: `${Math.min(item.actualProgress, 100)}%` }}
                              />
                            </div>
                            {item.progressGap > 0 && (
                              <div className="text-[10px] text-rose-600 font-semibold mt-1">
                                Brecha: -{item.progressGap}% respecto a la curva esperada
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* CSEA Heuristic Root Cause & Suggested Action */}
                      <div className="p-4 sm:p-5 bg-slate-50/60 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                          <div className="flex items-center gap-1.5 text-rose-700 font-bold text-[11px] uppercase tracking-wider">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            Diagnóstico y Causa Raíz Detectada
                          </div>
                          <p className="text-slate-800 leading-relaxed font-medium">
                            {item.cause}
                          </p>
                          <div className="text-[11px] text-slate-500 mt-1">
                            <strong className="text-slate-600">Impacto Proyectado:</strong> {item.impact}
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                          <div className="flex items-center gap-1.5 text-orange-700 font-bold text-[11px] uppercase tracking-wider">
                            <Target className="w-3.5 h-3.5 shrink-0" />
                            Acción Sugerida de Consultoría (CSEA)
                          </div>
                          <p className="text-slate-800 leading-relaxed font-medium">
                            {item.requiredAction}
                          </p>
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 flex-wrap text-[11px]">
                            {item.scheduleVarianceDays > 0 ? (
                              <span className="text-rose-700 font-bold">
                                Varianza: +{item.scheduleVarianceDays} días de retraso
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-semibold">
                                Varianza: En tiempo vs línea base
                              </span>
                            )}
                            {item.overdueInvoicesCount > 0 && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span className="text-amber-700 font-semibold">
                                  {item.overdueInvoicesCount} factura(s) pendiente(s)
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Operational Metrics Pills */}
                      <div className="p-3 px-4 sm:px-5 bg-white border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-medium text-[11px] border border-slate-200">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            Límite: {item.project.deadline || 'Sin fecha'}
                          </span>

                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold border ${
                            item.delayedCriticalTasksCount > 0 
                              ? 'bg-rose-50 text-rose-800 border-rose-200' 
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}>
                            <GitFork className="w-3 h-3" />
                            {item.delayedCriticalTasksCount} críticas retrasadas / {item.criticalTasksCount} en ruta crítica
                          </span>

                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold border ${
                            item.totalOverdueTasksCount > 0 
                              ? 'bg-amber-50 text-amber-800 border-amber-200' 
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}>
                            <Clock className="w-3 h-3" />
                            {item.totalOverdueTasksCount} tareas vencidas totales
                          </span>

                          {hasOverdueCritical && (
                            <button
                              onClick={() => toggleExpandTasks(item.project.id)}
                              className="inline-flex items-center gap-1 text-[11px] text-orange-600 hover:text-orange-700 font-bold hover:underline cursor-pointer"
                            >
                              <span>{isExpanded ? 'Ocultar tareas críticas' : `Ver ${item.overdueCriticalTasks.length} tareas críticas`}</span>
                              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            </button>
                          )}
                        </div>

                        {/* Direct Quick Action Buttons */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => {
                              setSelectedModalUrgency(null);
                              onNavigate && onNavigate('gantt');
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                            title="Abrir Cronograma y Ruta Crítica en el Gantt"
                          >
                            <Calendar className="w-3 h-3 text-slate-500" />
                            <span>Gantt</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedModalUrgency(null);
                              onNavigate && onNavigate('tasks', item.project.id);
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                            title="Gestionar tareas y entregables de este proyecto"
                          >
                            <CheckSquare className="w-3 h-3 text-slate-500" />
                            <span>Tareas</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedModalUrgency(null);
                              onNavigate && onNavigate('projects', item.project.id);
                            }}
                            className="px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg text-[11px] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                            title="Ver ficha completa del proyecto"
                          >
                            <span>Ficha Proyecto</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Expandable Overdue Critical Tasks List */}
                      {hasOverdueCritical && isExpanded && (
                        <div className="p-3 px-5 bg-rose-50/60 border-t border-rose-100 space-y-2">
                          <div className="text-[11px] font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            Tareas en Ruta Crítica con Retraso Directo:
                          </div>
                          <div className="divide-y divide-rose-200/60 bg-white rounded-lg border border-rose-200 overflow-hidden text-xs">
                            {item.overdueCriticalTasks.map(t => (
                              <div key={t.id} className="p-2.5 px-3 flex items-center justify-between gap-3 hover:bg-rose-50/30">
                                <div>
                                  <div className="font-bold text-slate-900 text-xs">{t.name}</div>
                                  <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                                    <span>Venció: <strong className="text-rose-700">{t.end_date || 'Sin fecha'}</strong></span>
                                    <span>•</span>
                                    <span>Estado: <span className="font-medium text-slate-700">{t.status}</span></span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    setSelectedModalUrgency(null);
                                    onNavigate && onNavigate('tasks', item.project.id);
                                  }}
                                  className="px-2 py-0.5 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold rounded text-[10px] transition-colors cursor-pointer shrink-0"
                                >
                                  Editar Tarea
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 px-6 bg-white border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-500">
                <ShieldAlert className="w-4 h-4 text-orange-600 shrink-0" />
                <span>Metodología CSEA v4.0 • Capricorn Strategic Execution Assessment</span>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => {
                    setSelectedUrgencyFilter(selectedModalUrgency);
                    setViewMode('matrix');
                    setSelectedModalUrgency(null);
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-slate-600" />
                  <span>Ver en Matriz del Dashboard</span>
                </button>

                <button
                  onClick={() => setSelectedModalUrgency(null)}
                  className="px-4 py-1.5 bg-[#0f172a] hover:bg-slate-800 text-white font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
