import React, { useState, useMemo, useRef } from 'react';
import { useData } from '../context/DataContext';
import { Project, Task, TeamMember, Priority, ProjectStatus } from '../types';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Search, 
  Layers, 
  Clock, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  Maximize2, 
  Minimize2, 
  Plus, 
  ArrowRight,
  Sparkles,
  Briefcase,
  Flag,
  Download,
  Eye,
  SlidersHorizontal,
  Flame,
  GitFork,
  ShieldCheck,
  Edit3
} from 'lucide-react';
import { calculateCriticalPath } from '../utils/criticalPath';

interface ProjectGanttViewProps {
  selectedProjectId?: string;
  onSelectProject?: (projectId: string) => void;
  onOpenTaskModal?: (task?: Task, defaultProjectId?: string) => void;
  onOpenProjectModal?: (project?: Project) => void;
  onNavigateToBaseline?: (projectId?: string) => void;
  isStandalone?: boolean;
}

type TimeScale = 'days' | 'weeks' | 'months';

export default function ProjectGanttView({
  selectedProjectId = 'ALL',
  onSelectProject,
  onOpenTaskModal,
  onOpenProjectModal,
  onNavigateToBaseline,
  isStandalone = false,
}: ProjectGanttViewProps) {
  const { projects, tasks, teamMembers, updateTask, updateProject } = useData();
  
  const [currentProjectFilter, setCurrentProjectFilter] = useState<string>(selectedProjectId);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [timeScale, setTimeScale] = useState<TimeScale>('weeks');

  // Critical Path & Dependency Controls
  const [highlightCriticalPath, setHighlightCriticalPath] = useState(true);
  const [showDependencyLinks, setShowDependencyLinks] = useState(true);
  const [filterOnlyCritical, setFilterOnlyCritical] = useState(false);

  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>(() => {
    // Expand all projects by default
    const initial: Record<string, boolean> = {};
    projects.forEach(p => { initial[p.id] = true; });
    return initial;
  });
  const [hoveredItem, setHoveredItem] = useState<{ id: string; type: 'project' | 'task'; name: string; start: string; end: string; progress: number; responsible?: string; isCritical?: boolean; slack?: number; dependencies?: string } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Memoized CPM calculations per project
  const cpmMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof calculateCriticalPath>>();
    projects.forEach(p => {
      map.set(p.id, calculateCriticalPath(p, tasks));
    });
    return map;
  }, [projects, tasks]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayDate = useMemo(() => new Date(), []);

  // Filter projects based on selections
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesId = currentProjectFilter === 'ALL' || p.id === currentProjectFilter;
      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
      const matchesPriority = priorityFilter === 'ALL' || p.priority === priorityFilter;
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesId && matchesStatus && matchesPriority && matchesSearch;
    });
  }, [projects, currentProjectFilter, statusFilter, priorityFilter, searchTerm]);

  // Determine timeline boundaries (earliest start, latest end)
  const { timelineStart, timelineEnd, totalDays } = useMemo(() => {
    let minDate = new Date();
    let maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3); // minimum 3 months window
    minDate.setMonth(minDate.getMonth() - 1); // 1 month buffer back

    let hasValidDates = false;

    projects.forEach(p => {
      if (p.start_date) {
        const d = new Date(p.start_date);
        if (!isNaN(d.getTime())) {
          if (!hasValidDates || d < minDate) minDate = d;
          hasValidDates = true;
        }
      }
      if (p.deadline) {
        const d = new Date(p.deadline);
        if (!isNaN(d.getTime())) {
          if (!hasValidDates || d > maxDate) maxDate = d;
          hasValidDates = true;
        }
      }
    });

    tasks.forEach(t => {
      if (t.start_date) {
        const d = new Date(t.start_date);
        if (!isNaN(d.getTime())) {
          if (!hasValidDates || d < minDate) minDate = d;
          hasValidDates = true;
        }
      }
      if (t.end_date) {
        const d = new Date(t.end_date);
        if (!isNaN(d.getTime())) {
          if (!hasValidDates || d > maxDate) maxDate = d;
          hasValidDates = true;
        }
      }
    });

    // Add extra padding (10 days before and after)
    const paddedStart = new Date(minDate);
    paddedStart.setDate(paddedStart.getDate() - 7);
    paddedStart.setHours(0, 0, 0, 0);

    const paddedEnd = new Date(maxDate);
    paddedEnd.setDate(paddedEnd.getDate() + 14);
    paddedEnd.setHours(23, 59, 59, 999);

    const diffTime = Math.abs(paddedEnd.getTime() - paddedStart.getTime());
    const days = Math.max(30, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    return {
      timelineStart: paddedStart,
      timelineEnd: paddedEnd,
      totalDays: days,
    };
  }, [projects, tasks]);

  // Generate grid time units based on scale
  const timelineColumns = useMemo(() => {
    const columns: { label: string; subLabel: string; date: Date; isToday: boolean; isWeekend: boolean }[] = [];
    const current = new Date(timelineStart);

    while (current <= timelineEnd) {
      const dateStr = current.toISOString().split('T')[0];
      const isToday = dateStr === todayStr;
      const dayOfWeek = current.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      const monthName = current.toLocaleDateString('es-ES', { month: 'short' });
      const dayNum = current.getDate();

      columns.push({
        label: `${monthName.toUpperCase()} ${current.getFullYear()}`,
        subLabel: `${dayNum}`,
        date: new Date(current),
        isToday,
        isWeekend,
      });

      current.setDate(current.getDate() + 1);
    }
    return columns;
  }, [timelineStart, timelineEnd, todayStr]);

  // Months aggregated for top header
  const monthHeaders = useMemo(() => {
    const months: { name: string; year: number; startIndex: number; count: number }[] = [];
    let currentMonth = -1;
    let currentYear = -1;

    timelineColumns.forEach((col, idx) => {
      const m = col.date.getMonth();
      const y = col.date.getFullYear();
      if (m !== currentMonth || y !== currentYear) {
        currentMonth = m;
        currentYear = y;
        const monthName = col.date.toLocaleDateString('es-ES', { month: 'long' });
        months.push({
          name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
          year: y,
          startIndex: idx,
          count: 1,
        });
      } else {
        months[months.length - 1].count += 1;
      }
    });

    return months;
  }, [timelineColumns]);

  // Helper to calculate bar positioning
  const getBarPosition = (startDateStr?: string, endDateStr?: string) => {
    if (!startDateStr && !endDateStr) {
      return { left: 0, width: 0, visible: false };
    }

    const start = startDateStr ? new Date(startDateStr) : new Date(endDateStr!);
    const end = endDateStr ? new Date(endDateStr) : new Date(startDateStr!);

    // Clamp or calculate offset
    const startDiff = (start.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24);
    const duration = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1);

    const leftPercent = Math.max(0, (startDiff / totalDays) * 100);
    const widthPercent = Math.min(100 - leftPercent, Math.max(1.2, (duration / totalDays) * 100));

    return {
      left: leftPercent,
      width: widthPercent,
      visible: true,
      durationDays: Math.round(duration),
    };
  };

  // Calculate position of Today marker
  const todayPosition = useMemo(() => {
    const diff = (todayDate.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24);
    if (diff < 0 || diff > totalDays) return null;
    return (diff / totalDays) * 100;
  }, [todayDate, timelineStart, totalDays]);

  const toggleExpand = (projectId: string) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  };

  const expandAll = () => {
    const exp: Record<string, boolean> = {};
    projects.forEach(p => { exp[p.id] = true; });
    setExpandedProjects(exp);
  };

  const collapseAll = () => {
    setExpandedProjects({});
  };

  const getTeamMemberName = (id?: string) => {
    if (!id) return 'Sin asignar';
    const tm = teamMembers.find(m => m.id === id);
    return tm ? tm.name : 'Sin asignar';
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Completado':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'En curso':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'En espera':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getPriorityColor = (p?: string) => {
    switch (p) {
      case 'Urgente':
        return 'bg-rose-500';
      case 'Dificil':
        return 'bg-amber-500';
      case 'Medio':
        return 'bg-blue-500';
      default:
        return 'bg-emerald-500';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Title and stats */}
          <div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-6 bg-[#D98236] rounded-xs" />
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#D98236]" />
                Cronograma de Ejecución y Diagrama de Gantt
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Visualización temporal en tiempo real de iniciativas estratégicas, entregables clave y rutas críticas.
            </p>
          </div>

          {/* Quick Filter & View Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar iniciativa..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#D98236] w-44"
              />
            </div>

            {/* Project Filter */}
            <select
              value={currentProjectFilter}
              onChange={e => {
                setCurrentProjectFilter(e.target.value);
                if (onSelectProject) onSelectProject(e.target.value);
              }}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-[#D98236] max-w-[200px]"
            >
              <option value="ALL">Todos los Proyectos ({projects.length})</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-[#D98236]"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="En curso">En curso</option>
              <option value="Completado">Completado</option>
              <option value="En espera">En espera</option>
              <option value="No iniciado">No iniciado</option>
            </select>

            {/* CPM & Dependency Toggles */}
            <div className="flex items-center gap-1.5 border-l border-slate-200 pl-2">
              <button
                onClick={() => setHighlightCriticalPath(!highlightCriticalPath)}
                className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 ${
                  highlightCriticalPath 
                    ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-2xs' 
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-800'
                }`}
                title="Destacar entregables en la Ruta Crítica (holgura = 0)"
              >
                <Flame className={`w-3.5 h-3.5 ${highlightCriticalPath ? 'text-rose-600' : 'text-slate-400'}`} />
                <span>Ruta Crítica</span>
              </button>

              <button
                onClick={() => setShowDependencyLinks(!showDependencyLinks)}
                className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 ${
                  showDependencyLinks 
                    ? 'bg-orange-50 text-orange-700 border-orange-300 shadow-2xs' 
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-800'
                }`}
                title="Mostrar conectores de dependencias entre entregables"
              >
                <GitFork className={`w-3.5 h-3.5 ${showDependencyLinks ? 'text-[#D98236]' : 'text-slate-400'}`} />
                <span>Conectores</span>
              </button>

              <button
                onClick={() => setFilterOnlyCritical(!filterOnlyCritical)}
                className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 ${
                  filterOnlyCritical 
                    ? 'bg-rose-600 text-white border-rose-700 shadow-2xs' 
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-800'
                }`}
                title="Filtrar únicamente entregables críticos"
              >
                <span>Solo Críticas</span>
              </button>
            </div>

            {/* Baseline comparison navigation button */}
            {onNavigateToBaseline && (
              <button
                onClick={() => onNavigateToBaseline(currentProjectFilter === 'ALL' ? undefined : currentProjectFilter)}
                className="px-3 py-1.5 text-xs font-bold bg-[#0f172a] text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                title="Ir al módulo de control de línea base y varianzas de cronograma"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />
                <span>Línea Base & Desviación</span>
              </button>
            )}

            {/* Expand / Collapse All */}
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
              <button
                onClick={expandAll}
                className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border-r border-slate-200"
                title="Expandir todas las tareas"
              >
                Expandir
              </button>
              <button
                onClick={collapseAll}
                className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Colapsar tareas"
              >
                Colapsar
              </button>
            </div>
          </div>
        </div>

        {/* Legend bar */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              Convenciones:
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-xs bg-[#0f172a]" />
              <span>Iniciativa / Proyecto</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-xs bg-[#D98236]" />
              <span>Entregable Regular</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-xs bg-rose-600 ring-1 ring-rose-400" />
              <span className="font-bold text-rose-700">Ruta Crítica (Holgura: 0d)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-[#D98236]" />
              <span>Vínculo Predecesora</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-xs bg-emerald-500" />
              <span>Concluido (100%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rotate-45 bg-rose-500 inline-block" />
              <span>Hito / Deadline</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-3 bg-rose-500 border-dashed" />
              <span>Línea de Hoy</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-orange-50 text-[#D98236] px-2 py-0.5 rounded-full font-bold border border-orange-200">
              {filteredProjects.length} Iniciativas activas
            </span>
          </div>
        </div>
      </div>

      {/* Main Gantt Canvas Container */}
      <div 
        ref={containerRef}
        className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col"
      >
        {/* Scrollable Gantt Viewport */}
        <div className="overflow-x-auto overflow-y-auto max-h-[680px]">
          <div className="min-w-[1000px] relative">

            {/* 1. TIMELINE HEADER */}
            <div className="sticky top-0 z-30 bg-slate-900 text-white shadow-md">
              {/* Top Row: Month Bands */}
              <div className="flex border-b border-slate-800">
                <div className="w-80 shrink-0 p-2.5 font-bold text-xs uppercase tracking-wider text-slate-300 border-r border-slate-800 flex items-center justify-between bg-slate-950">
                  <span>Estructura de Desglose (WBS)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Avance / RACI</span>
                </div>

                <div className="flex-1 flex relative">
                  {monthHeaders.map((m, idx) => (
                    <div
                      key={idx}
                      className="py-1.5 px-2 text-center text-xs font-bold border-r border-slate-800 text-orange-400 bg-slate-900 truncate"
                      style={{ width: `${(m.count / totalDays) * 100}%` }}
                    >
                      {m.name} {m.year}
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Row: Day / Week Indicators */}
              <div className="flex bg-slate-800/90 text-[10px]">
                <div className="w-80 shrink-0 px-3 py-1.5 text-slate-400 font-medium border-r border-slate-700 bg-slate-900 flex justify-between items-center">
                  <span>Iniciativas & Tareas</span>
                  <span>Plazo</span>
                </div>

                <div className="flex-1 flex relative h-6">
                  {timelineColumns.map((col, idx) => {
                    // Only show text on every few days or start of week to avoid clutter
                    const showDay = col.date.getDate() === 1 || col.date.getDay() === 1 || col.isToday;
                    return (
                      <div
                        key={idx}
                        className={`text-center flex items-center justify-center border-r border-slate-700/50 text-[9px] ${
                          col.isToday ? 'bg-orange-500 text-white font-bold' : 
                          col.isWeekend ? 'bg-slate-800/40 text-slate-500' : 'text-slate-300'
                        }`}
                        style={{ width: `${(1 / totalDays) * 100}%` }}
                        title={col.date.toLocaleDateString('es-ES')}
                      >
                        {showDay ? col.subLabel : ''}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 2. TIMELINE BODY WITH PROJECT & TASK ROWS */}
            <div className="relative divide-y divide-slate-100">
              
              {/* Background Grid Lines & Today Marker */}
              <div className="absolute inset-0 left-80 flex pointer-events-none z-0">
                {timelineColumns.map((col, idx) => (
                  <div
                    key={idx}
                    className={`h-full border-r border-slate-100 ${
                      col.isWeekend ? 'bg-slate-50/40' : ''
                    }`}
                    style={{ width: `${(1 / totalDays) * 100}%` }}
                  />
                ))}

                {/* Vertical Today Line */}
                {todayPosition !== null && (
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-20 shadow-xs flex flex-col items-center"
                    style={{ left: `${todayPosition}%` }}
                  >
                    <div className="bg-rose-500 text-white text-[9px] font-extrabold px-1 py-0.5 rounded-b-xs shadow-sm -mt-0.5">
                      HOY
                    </div>
                  </div>
                )}
              </div>

              {/* No projects placeholder */}
              {filteredProjects.length === 0 && (
                <div className="p-12 text-center text-slate-400">
                  <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-500" />
                  <p className="text-sm font-semibold">No se encontraron proyectos con los filtros seleccionados</p>
                  <p className="text-xs text-slate-400 mt-1">Ajusta la búsqueda o selecciona "Todos los Proyectos"</p>
                </div>
              )}

              {/* PROJECTS ACCORDION ROWS */}
              {filteredProjects.map((project) => {
                const projectTasks = tasks.filter(t => t.project_id === project.id);
                const isExpanded = !!expandedProjects[project.id];
                const projectPos = getBarPosition(project.start_date, project.deadline);
                const isCompleted = project.status === 'Completado';
                const responsibleName = getTeamMemberName(project.responsible_id);

                return (
                  <React.Fragment key={project.id}>
                    {/* PROJECT SUMMARY ROW */}
                    <div className="flex items-center hover:bg-slate-50/80 transition-colors group relative z-10 min-h-[44px] bg-slate-50/30">
                      
                      {/* Left Meta Column */}
                      <div className="w-80 shrink-0 px-3 py-2 border-r border-slate-200 bg-white/95 flex items-center justify-between gap-2 shadow-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          {/* Accordion toggle */}
                          <button
                            onClick={() => toggleExpand(project.id)}
                            className="p-1 hover:bg-slate-200 rounded-sm text-slate-600 transition-colors"
                            title={isExpanded ? 'Colapsar tareas' : 'Expandir tareas'}
                          >
                            <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90 text-[#D98236]' : ''}`} />
                          </button>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-slate-900 truncate hover:text-[#D98236] cursor-pointer"
                                onClick={() => onOpenProjectModal && onOpenProjectModal(project)}
                                title={project.name}
                              >
                                {project.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                              <span className="truncate max-w-[100px]">{project.category || 'General'}</span>
                              <span>•</span>
                              <span className="text-slate-600 font-medium">{responsibleName}</span>
                            </div>
                          </div>
                        </div>

                        {/* Progress and status pill */}
                        <div className="text-right shrink-0">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm border ${getStatusBadgeColor(project.status)}`}>
                            {project.progress_percentage || 0}%
                          </span>
                        </div>
                      </div>

                      {/* Right Gantt Bar Canvas */}
                      <div className="flex-1 relative h-10 flex items-center px-1">
                        {projectPos.visible && (
                          <div
                            className="absolute h-6 rounded-md shadow-xs flex items-center px-2 text-white text-[11px] font-bold overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-[#D98236] hover:shadow-md"
                            style={{
                              left: `${projectPos.left}%`,
                              width: `${projectPos.width}%`,
                              backgroundColor: isCompleted ? '#0f766e' : '#0f172a',
                            }}
                            onClick={() => onOpenProjectModal && onOpenProjectModal(project)}
                            onMouseEnter={() => setHoveredItem({
                              id: project.id,
                              type: 'project',
                              name: project.name,
                              start: project.start_date || 'Sin fecha',
                              end: project.deadline || 'Sin fecha',
                              progress: project.progress_percentage || 0,
                              responsible: responsibleName,
                            })}
                            onMouseLeave={() => setHoveredItem(null)}
                          >
                            {/* Internal Progress Fill */}
                            <div
                              className="absolute top-0 bottom-0 left-0 bg-white/20"
                              style={{ width: `${project.progress_percentage || 0}%` }}
                            />

                            {/* Label inside bar */}
                            <span className="relative z-10 truncate drop-shadow-xs flex items-center gap-1">
                              <Briefcase className="w-3 h-3 shrink-0 text-orange-400" />
                              {project.name} ({projectPos.durationDays}d)
                            </span>
                          </div>
                        )}

                        {/* Deadline Milestone marker */}
                        {project.deadline && (
                          (() => {
                            const dPos = getBarPosition(project.deadline, project.deadline);
                            return (
                              <div
                                className="absolute w-3.5 h-3.5 -ml-1.5 rotate-45 bg-rose-500 border border-white shadow-xs z-15 cursor-pointer"
                                style={{ left: `${dPos.left}%` }}
                                title={`Hito de entrega: ${project.deadline}`}
                              />
                            );
                          })()
                        )}
                      </div>
                    </div>

                    {/* SUB-TASKS / DELIVERABLES ROWS */}
                    {isExpanded && (() => {
                      const projectCpm = cpmMap.get(project.id);
                      const criticalIds = projectCpm?.criticalTaskIds || new Set<string>();
                      const slackMap = new Map<string, number>();
                      projectCpm?.tasks.forEach(n => slackMap.set(n.task.id, n.slackDays));

                      let visibleProjectTasks = projectTasks;
                      if (filterOnlyCritical) {
                        visibleProjectTasks = visibleProjectTasks.filter(t => criticalIds.has(t.id));
                      }

                      // Calculate SVG dependency links
                      const dependencyLinks: {
                        id: string;
                        x1: number;
                        y1: number;
                        x2: number;
                        y2: number;
                        isCritical: boolean;
                      }[] = [];

                      if (showDependencyLinks) {
                        visibleProjectTasks.forEach((task, sIdx) => {
                          if (!task.dependencies || task.dependencies.length === 0) return;
                          const sPos = getBarPosition(task.start_date, task.end_date);
                          if (!sPos.visible) return;

                          task.dependencies.forEach(predId => {
                            const pIdx = visibleProjectTasks.findIndex(t => t.id === predId);
                            if (pIdx === -1) return;
                            const predTask = visibleProjectTasks[pIdx];
                            const pPos = getBarPosition(predTask.start_date, predTask.end_date);
                            if (!pPos.visible) return;

                            const isBothCritical = criticalIds.has(task.id) && criticalIds.has(predTask.id);

                            dependencyLinks.push({
                              id: `${predId}->${task.id}`,
                              x1: (pPos.left + pPos.width) * 10,
                              y1: pIdx * 36 + 18,
                              x2: sPos.left * 10,
                              y2: sIdx * 36 + 18,
                              isCritical: isBothCritical,
                            });
                          });
                        });
                      }

                      return (
                        <>
                          {visibleProjectTasks.length === 0 ? (
                            <div className="flex items-center text-slate-400 text-xs py-2.5 bg-slate-50/20 border-b border-slate-100">
                              <div className="w-80 shrink-0 pl-10 pr-4 text-[11px] italic flex items-center justify-between">
                                <span>{filterOnlyCritical ? 'No hay tareas en ruta crítica para este filtro' : 'No hay tareas registradas'}</span>
                                {onOpenTaskModal && !filterOnlyCritical && (
                                  <button
                                    onClick={() => onOpenTaskModal(undefined, project.id)}
                                    className="text-[#D98236] hover:underline font-semibold text-[10px] flex items-center gap-0.5"
                                  >
                                    <Plus className="w-3 h-3" /> Agregar tarea
                                  </button>
                                )}
                              </div>
                              <div className="flex-1 px-4 text-[11px] italic text-slate-400">
                                {filterOnlyCritical ? 'Todas las tareas poseen holgura disponible' : 'Define entregables para este proyecto'}
                              </div>
                            </div>
                          ) : (
                            <div className="relative">
                              {/* SVG Dependency Connectors Layer */}
                              {showDependencyLinks && dependencyLinks.length > 0 && (
                                <svg 
                                  className="absolute left-80 right-0 top-0 pointer-events-none z-15"
                                  style={{ height: visibleProjectTasks.length * 36 }}
                                  viewBox={`0 0 1000 ${visibleProjectTasks.length * 36}`}
                                  preserveAspectRatio="none"
                                >
                                  <defs>
                                    <marker id="arrow-cpm" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#e11d48" />
                                    </marker>
                                    <marker id="arrow-dep" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#d97706" />
                                    </marker>
                                  </defs>
                                  {dependencyLinks.map(link => {
                                    const dx = Math.max(14, (link.x2 - link.x1) * 0.4);
                                    const d = `M ${link.x1} ${link.y1} C ${link.x1 + dx} ${link.y1}, ${link.x2 - dx} ${link.y2}, ${link.x2} ${link.y2}`;
                                    return (
                                      <path
                                        key={link.id}
                                        d={d}
                                        stroke={link.isCritical ? '#e11d48' : '#d97706'}
                                        strokeWidth={link.isCritical ? '2.2' : '1.5'}
                                        strokeDasharray={link.isCritical ? undefined : '4 2'}
                                        fill="none"
                                        markerEnd={link.isCritical ? 'url(#arrow-cpm)' : 'url(#arrow-dep)'}
                                      />
                                    );
                                  })}
                                </svg>
                              )}

                              {visibleProjectTasks.map((task, taskIdx) => {
                                const taskPos = getBarPosition(task.start_date, task.end_date);
                                const isTaskCompleted = task.is_done || task.status === 'Completado';
                                const isOverdue = !isTaskCompleted && task.end_date && task.end_date < todayStr;
                                const taskOwnerName = getTeamMemberName(task.owner_id);
                                const isCritical = criticalIds.has(task.id);
                                const slack = slackMap.get(task.id) ?? 0;
                                const predCount = task.dependencies?.length || 0;

                                return (
                                  <div
                                    key={task.id}
                                    className={`flex items-center hover:bg-orange-50/30 transition-colors group relative z-10 min-h-[36px] h-9 border-b border-slate-100/70 ${
                                      isCritical && highlightCriticalPath ? 'bg-rose-50/25' : 'bg-white'
                                    }`}
                                  >
                                    {/* Task Left Meta */}
                                    <div className="w-80 shrink-0 pl-9 pr-3 py-1.5 border-r border-slate-200 flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <div className={`w-1.5 h-1.5 rounded-full ${getPriorityColor(task.priority)} shrink-0`} />
                                        
                                        {/* Critical Path Badge */}
                                        {isCritical && highlightCriticalPath ? (
                                          <span 
                                            className="shrink-0 px-1 py-0.2 rounded-xs text-[9px] font-black bg-rose-100 text-rose-700 border border-rose-200" 
                                            title="Ruta Crítica (Holgura = 0 días)"
                                          >
                                            CPM
                                          </span>
                                        ) : (
                                          <span 
                                            className="shrink-0 text-[9px] text-slate-400 font-mono" 
                                            title={`Holgura: ${slack} días`}
                                          >
                                            +{slack}d
                                          </span>
                                        )}

                                        <span 
                                          className={`text-xs truncate cursor-pointer hover:text-[#D98236] transition-colors ${
                                            isTaskCompleted ? 'line-through text-slate-400' : 'text-slate-700 font-medium'
                                          }`}
                                          onClick={() => onOpenTaskModal && onOpenTaskModal(task, project.id)}
                                          title={`Clic para editar entregable: ${task.name}`}
                                        >
                                          {task.name}
                                        </span>
                                        {onOpenTaskModal && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onOpenTaskModal(task, project.id);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-orange-600 p-0.5 rounded transition-opacity shrink-0"
                                            title="Editar en el menú de tareas"
                                          >
                                            <Edit3 className="w-3 h-3" />
                                          </button>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-1.5 shrink-0">
                                        {/* Predecessors indicator */}
                                        {predCount > 0 && (
                                          <span 
                                            className="text-[9px] font-bold text-orange-600 bg-orange-50 px-1 py-0.2 rounded-xs border border-orange-200" 
                                            title={`Depende de ${predCount} tarea(s)`}
                                          >
                                            🔗{predCount}
                                          </span>
                                        )}

                                        <span className="text-[10px] text-slate-400 truncate max-w-[65px]" title={taskOwnerName}>
                                          {taskOwnerName}
                                        </span>
                                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-xs border ${
                                          isTaskCompleted ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                          isOverdue ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                          'bg-slate-50 text-slate-600 border-slate-200'
                                        }`}>
                                          {isTaskCompleted ? 'Listo' : isOverdue ? 'Vencida' : task.status}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Task Right Gantt Bar */}
                                    <div className="flex-1 relative h-9 flex items-center px-1">
                                      {taskPos.visible ? (
                                        <div
                                          className={`absolute h-4.5 rounded-sm shadow-2xs flex items-center px-1.5 text-white text-[10px] font-medium overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-orange-400 hover:shadow-xs active:scale-[0.99] ${
                                            isTaskCompleted ? 'bg-emerald-600 opacity-80' :
                                            isCritical && highlightCriticalPath ? 'bg-rose-600 ring-2 ring-rose-400 font-bold shadow-xs shadow-rose-200' :
                                            isOverdue ? 'bg-rose-600' :
                                            'bg-[#D98236]'
                                          }`}
                                          style={{
                                            left: `${taskPos.left}%`,
                                            width: `${taskPos.width}%`,
                                          }}
                                          onClick={() => onOpenTaskModal && onOpenTaskModal(task, project.id)}
                                          title={`Clic para editar entregable en el menú de tareas: ${task.name}`}
                                          onMouseEnter={() => setHoveredItem({
                                            id: task.id,
                                            type: 'task',
                                            name: task.name,
                                            start: task.start_date || 'Sin fecha',
                                            end: task.end_date || 'Sin fecha',
                                            progress: isTaskCompleted ? 100 : 0,
                                            responsible: taskOwnerName,
                                            isCritical,
                                            slack,
                                            dependencies: task.dependencies?.join(', ') || 'Ninguna',
                                          })}
                                          onMouseLeave={() => setHoveredItem(null)}
                                        >
                                          <span className="truncate drop-shadow-xs">
                                            {isCritical && highlightCriticalPath ? '🔥 ' : ''}{task.name} ({taskPos.durationDays}d)
                                          </span>
                                        </div>
                                      ) : (
                                        <div 
                                          className="text-[10px] text-slate-400 italic pl-2 cursor-pointer hover:text-[#D98236] transition-colors"
                                          onClick={() => onOpenTaskModal && onOpenTaskModal(task, project.id)}
                                          title="Clic para asignar fechas y editar"
                                        >
                                          Sin fechas asignadas (clic para editar)
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Quick Add Task Button for this project */}
                          {onOpenTaskModal && (
                            <div className="flex items-center py-1 bg-slate-50/40 border-b border-slate-100">
                              <div className="w-80 shrink-0 pl-9 pr-3">
                                <button
                                  onClick={() => onOpenTaskModal(undefined, project.id)}
                                  className="text-[11px] font-semibold text-[#D98236] hover:text-orange-700 flex items-center gap-1 py-0.5"
                                >
                                  <Plus className="w-3 h-3" /> Agregar nuevo entregable
                                </button>
                              </div>
                              <div className="flex-1" />
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </React.Fragment>
                );
              })}
            </div>

          </div>
        </div>

        {/* Floating Tooltip info on hover */}
        {hoveredItem && (
          <div className="bg-slate-900 text-white px-3 py-2 text-xs border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-orange-400">
                {hoveredItem.type === 'project' ? 'INICIATIVA:' : 'ENTREGABLE:'}
              </span>
              <span className="font-semibold">{hoveredItem.name}</span>
            </div>
            <div className="flex items-center gap-4 text-slate-300 text-[11px] flex-wrap">
              <span><strong>Inicio:</strong> {hoveredItem.start}</span>
              <span><strong>Término:</strong> {hoveredItem.end}</span>
              <span><strong>Responsable:</strong> {hoveredItem.responsible}</span>
              
              {hoveredItem.isCritical !== undefined && (
                <span className={hoveredItem.isCritical ? 'text-rose-400 font-black' : 'text-slate-300'}>
                  <strong>CPM:</strong> {hoveredItem.isCritical ? '🔥 Ruta Crítica (0d)' : `+${hoveredItem.slack}d holgura`}
                </span>
              )}

              {hoveredItem.dependencies && hoveredItem.dependencies !== 'Ninguna' && (
                <span className="text-orange-300">
                  <strong>Predecesoras:</strong> {hoveredItem.dependencies}
                </span>
              )}

              <span className="bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded-sm font-bold">
                {hoveredItem.progress}%
              </span>

              {hoveredItem.type === 'task' && onOpenTaskModal && (
                <span className="text-[10px] text-orange-300 bg-orange-950/60 px-2 py-0.5 rounded-xs border border-orange-500/40 font-semibold">
                  🖱️ Clic para editar en menú Tareas
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
