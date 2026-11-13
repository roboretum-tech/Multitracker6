import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Task, Priority, Project } from '../types';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Flame, 
  GitFork, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  ArrowRight, 
  Layers, 
  Check, 
  Briefcase,
  SlidersHorizontal,
  FolderKanban
} from 'lucide-react';

interface KanbanColumnDef {
  id: string;
  title: string;
  statusValue: string;
  badgeBg: string;
  badgeText: string;
  accentBorder: string;
  columnBg: string;
  dropBorder: string;
  description: string;
}

const KANBAN_COLUMNS: KanbanColumnDef[] = [
  {
    id: 'not_started',
    title: 'Por Iniciar',
    statusValue: 'No iniciada',
    badgeBg: 'bg-slate-200',
    badgeText: 'text-slate-800',
    accentBorder: 'border-t-slate-400',
    columnBg: 'bg-slate-100/70',
    dropBorder: 'border-slate-400 bg-slate-200/50',
    description: 'Entregables planificados listos para asignación',
  },
  {
    id: 'in_progress',
    title: 'En Progreso',
    statusValue: 'En progreso',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-900',
    accentBorder: 'border-t-orange-500',
    columnBg: 'bg-orange-50/40',
    dropBorder: 'border-orange-500 bg-orange-100/50',
    description: 'En ejecución activa por el equipo consultor',
  },
  {
    id: 'under_review',
    title: 'En Revisión',
    statusValue: 'En espera',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-900',
    accentBorder: 'border-t-blue-500',
    columnBg: 'bg-blue-50/40',
    dropBorder: 'border-blue-500 bg-blue-100/50',
    description: 'Validación ejecutiva / QA de consultoría',
  },
  {
    id: 'completed',
    title: 'Completadas',
    statusValue: 'Completado',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-900',
    accentBorder: 'border-t-emerald-600',
    columnBg: 'bg-emerald-50/40',
    dropBorder: 'border-emerald-600 bg-emerald-100/50',
    description: 'Aprobadas formalmente por el patrocinador',
  },
];

interface KanbanBoardProps {
  onOpenNewTask?: () => void;
  onEditTask?: (task: Task) => void;
}

export default function KanbanBoard({ onOpenNewTask, onEditTask }: KanbanBoardProps) {
  const { tasks, projects, teamMembers, updateTask, deleteTask, toggleTaskDone, addTask } = useData();

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState('ALL');
  const [selectedOwner, setSelectedOwner] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [overdueOnly, setOverdueOnly] = useState(false);

  // Drag and drop state
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Quick inline creation state
  const [quickAddColumn, setQuickAddColumn] = useState<string | null>(null);
  const [quickTaskName, setQuickTaskName] = useState('');
  const [quickTaskProject, setQuickTaskProject] = useState(projects[0]?.id || '');

  // Edit task modal fallback or callback
  const [activeMenuTaskId, setActiveMenuTaskId] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Map of project names and owners
  const projectMap = useMemo(() => {
    const map = new Map<string, Project>();
    projects.forEach(p => map.set(p.id, p));
    return map;
  }, [projects]);

  const teamMemberMap = useMemo(() => {
    const map = new Map<string, string>();
    teamMembers.forEach(m => map.set(m.id, m.name));
    return map;
  }, [teamMembers]);

  // Compute Critical Path tasks (Tasks that have dependencies or are depended on)
  const criticalTasksSet = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach(t => {
      if (t.dependencies && t.dependencies.length > 0) {
        set.add(t.id);
        t.dependencies.forEach(depId => set.add(depId));
      }
    });
    return set;
  }, [tasks]);

  const isOverdue = (task: Task) => {
    if (task.is_done || task.status === 'Completado' || !task.end_date) return false;
    return task.end_date < todayStr;
  };

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.notes && t.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesProject = selectedProject === 'ALL' || t.project_id === selectedProject;
      const matchesOwner = selectedOwner === 'ALL' || t.owner_id === selectedOwner;
      const matchesPriority = selectedPriority === 'ALL' || t.priority === selectedPriority;
      const matchesCritical = !criticalOnly || criticalTasksSet.has(t.id);
      const matchesOverdue = !overdueOnly || isOverdue(t);

      return matchesSearch && matchesProject && matchesOwner && matchesPriority && matchesCritical && matchesOverdue;
    });
  }, [tasks, searchTerm, selectedProject, selectedOwner, selectedPriority, criticalOnly, overdueOnly, criticalTasksSet, todayStr]);

  // Group tasks by Kanban column
  const tasksByColumn = useMemo(() => {
    const grouped: Record<string, Task[]> = {
      not_started: [],
      in_progress: [],
      under_review: [],
      completed: [],
    };

    filteredTasks.forEach(task => {
      if (task.is_done || task.status === 'Completado') {
        grouped.completed.push(task);
      } else if (task.status === 'En progreso') {
        grouped.in_progress.push(task);
      } else if (task.status === 'En espera' || task.status === 'En revisión') {
        grouped.under_review.push(task);
      } else {
        grouped.not_started.push(task);
      }
    });

    return grouped;
  }, [filteredTasks]);

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, targetColumn: KanbanColumnDef) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
    setDraggingTaskId(null);

    if (!taskId) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Update status
    const isCompleted = targetColumn.id === 'completed';
    await updateTask(taskId, {
      status: targetColumn.statusValue,
      is_done: isCompleted,
    });
  };

  // Direct status advance
  const handleDirectMove = async (task: Task, nextStatus: string) => {
    const isCompleted = nextStatus === 'Completado';
    await updateTask(task.id, {
      status: nextStatus,
      is_done: isCompleted,
    });
  };

  // Quick task addition
  const handleQuickAddSubmit = async (col: KanbanColumnDef) => {
    if (!quickTaskName.trim()) return;
    const projId = quickTaskProject || projects[0]?.id;
    if (!projId) return;

    await addTask({
      name: quickTaskName.trim(),
      project_id: projId,
      status: col.statusValue,
      is_done: col.id === 'completed',
      priority: 'Medio',
      start_date: todayStr,
      end_date: '',
    });

    setQuickTaskName('');
    setQuickAddColumn(null);
  };

  const getPriorityStyle = (priority: Priority | string) => {
    switch (priority) {
      case 'Urgente':
        return 'bg-orange-100 text-orange-950 border-orange-300 font-bold';
      case 'Dificil':
        return 'bg-amber-100 text-amber-900 border-amber-300 font-semibold';
      case 'Medio':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Controls Bar - Compact Single Line Filter */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar entregables por nombre o notas..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
            />
          </div>

          {/* Quick Select Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Project Filter */}
            <select
              value={selectedProject}
              onChange={e => setSelectedProject(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-orange-500"
            >
              <option value="ALL">Todas las Iniciativas</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            {/* Owner Filter */}
            <select
              value={selectedOwner}
              onChange={e => setSelectedOwner(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-orange-500"
            >
              <option value="ALL">Todos los Consultores</option>
              {teamMembers.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={e => setSelectedPriority(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-orange-500"
            >
              <option value="ALL">Prioridad</option>
              <option value="Urgente">Urgente</option>
              <option value="Dificil">Alta / Compleja</option>
              <option value="Medio">Media</option>
              <option value="Bajo">Baja</option>
            </select>

            {/* Critical Path toggle */}
            <button
              onClick={() => setCriticalOnly(prev => !prev)}
              className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                criticalOnly
                  ? 'bg-orange-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              title="Filtrar tareas que forman parte de la Ruta Crítica (CPM)"
            >
              <Flame className={`w-3.5 h-3.5 ${criticalOnly ? 'text-white' : 'text-orange-600'}`} />
              <span>Ruta Crítica</span>
            </button>

            {/* Overdue toggle */}
            <button
              onClick={() => setOverdueOnly(prev => !prev)}
              className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                overdueOnly
                  ? 'bg-red-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${overdueOnly ? 'text-white' : 'text-red-500'}`} />
              <span>Retrasadas</span>
            </button>

            {/* Add Task Button */}
            {onOpenNewTask && (
              <button
                onClick={onOpenNewTask}
                className="px-3 py-1.5 bg-[#0f172a] hover:bg-slate-800 text-white font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer ml-auto"
              >
                <Plus className="w-3.5 h-3.5 text-orange-400" />
                <span>Nuevo Entregable</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Counter Chips */}
        <div className="flex items-center gap-4 pt-1 text-[11px] text-slate-500 border-t border-slate-100">
          <span>Mostrando <strong>{filteredTasks.length}</strong> de {tasks.length} entregables</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Por iniciar: <strong>{tasksByColumn.not_started.length}</strong>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            En progreso: <strong>{tasksByColumn.in_progress.length}</strong>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            En revisión: <strong>{tasksByColumn.under_review.length}</strong>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Completadas: <strong>{tasksByColumn.completed.length}</strong>
          </span>
        </div>
      </div>

      {/* Kanban Board Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {KANBAN_COLUMNS.map(col => {
          const colTasks = tasksByColumn[col.id] || [];
          const isDragOver = dragOverColumn === col.id;

          return (
            <div
              key={col.id}
              onDragOver={e => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, col)}
              className={`rounded-xl border-t-4 ${col.accentBorder} bg-white border border-slate-200 shadow-xs flex flex-col min-h-[500px] transition-all duration-150 ${
                isDragOver ? `${col.dropBorder} ring-2 ring-orange-400/40` : ''
              }`}
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-xs tracking-tight">{col.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${col.badgeBg} ${col.badgeText}`}>
                    {colTasks.length}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setQuickAddColumn(quickAddColumn === col.id ? null : col.id);
                    setQuickTaskName('');
                  }}
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                  title="Añadir tarjeta rápida en esta columna"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Column Subtitle / UX Helper */}
              <div className="px-3.5 py-1.5 bg-slate-50/70 border-b border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
                <span>{col.description}</span>
              </div>

              {/* Quick Inline Add Form */}
              {quickAddColumn === col.id && (
                <div className="p-2.5 bg-orange-50/60 border-b border-orange-200 space-y-2 animate-fade-in">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Título del entregable..."
                    value={quickTaskName}
                    onChange={e => setQuickTaskName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleQuickAddSubmit(col);
                      if (e.key === 'Escape') setQuickAddColumn(null);
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                  />
                  <div className="flex items-center gap-1.5">
                    <select
                      value={quickTaskProject}
                      onChange={e => setQuickTaskProject(e.target.value)}
                      className="flex-1 px-2 py-1 bg-white border border-slate-300 rounded-md text-[11px] text-slate-700"
                    >
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleQuickAddSubmit(col)}
                      className="px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-md text-[11px] transition-colors"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => setQuickAddColumn(null)}
                      className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md text-[11px] transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Task Cards Container */}
              <div className="p-2.5 flex-1 space-y-2.5 overflow-y-auto max-h-[calc(100vh-280px)]">
                {colTasks.length === 0 ? (
                  <div className="h-32 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center p-4 text-center text-slate-400">
                    <FolderKanban className="w-6 h-6 mb-1 text-slate-300 stroke-[1.5]" />
                    <span className="text-[11px]">Arrastra entregables aquí</span>
                  </div>
                ) : (
                  colTasks.map(task => {
                    const isTaskCritical = criticalTasksSet.has(task.id);
                    const taskOverdue = isOverdue(task);
                    const proj = projectMap.get(task.project_id);
                    const ownerName = teamMemberMap.get(task.owner_id || '') || 'Sin asignar';
                    const isDraggingThis = draggingTaskId === task.id;

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={e => handleDragStart(e, task.id)}
                        className={`group bg-white rounded-lg border border-slate-200 p-3 shadow-2xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing relative ${
                          isDraggingThis ? 'opacity-40 scale-95 border-orange-400' : ''
                        } ${taskOverdue ? 'border-red-300 bg-red-50/20' : ''}`}
                      >
                        {/* Card Header: Project badge & Priority */}
                        <div className="flex items-start justify-between gap-1.5 mb-2">
                          <div className="flex flex-wrap items-center gap-1 min-w-0">
                            <span 
                              className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[170px]"
                              title={proj?.name || 'Iniciativa General'}
                            >
                              <Briefcase className="w-2.5 h-2.5 shrink-0 text-slate-400" />
                              <span className="truncate">{proj?.name || 'Iniciativa General'}</span>
                            </span>

                            {isTaskCritical && (
                              <span 
                                className="inline-flex items-center gap-0.5 text-[9px] font-bold text-orange-900 bg-orange-100 border border-orange-300 px-1.5 py-0.5 rounded"
                                title="Ruta Crítica CPM (Sin holgura)"
                              >
                                <Flame className="w-2.5 h-2.5 text-orange-600 fill-orange-500" />
                                CPM
                              </span>
                            )}
                          </div>

                          <span className={`text-[10px] px-1.5 py-0.5 rounded border shrink-0 ${getPriorityStyle(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>

                        {/* Task Title with Quick Done Checkbox */}
                        <div className="flex items-start gap-2 mb-2">
                          <button
                            onClick={() => toggleTaskDone(task.id)}
                            className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                              task.is_done 
                                ? 'bg-emerald-600 border-emerald-600 text-white' 
                                : 'border-slate-300 hover:border-orange-500 bg-white'
                            }`}
                            title={task.is_done ? 'Marcar como pendiente' : 'Marcar como completada'}
                          >
                            {task.is_done && <Check className="w-3 h-3 stroke-[3]" />}
                          </button>
                          
                          <span 
                            onClick={() => onEditTask && onEditTask(task)}
                            className={`text-xs font-semibold leading-snug cursor-pointer hover:text-orange-600 transition-colors ${
                              task.is_done ? 'line-through text-slate-400' : 'text-slate-800'
                            }`}
                          >
                            {task.name}
                          </span>
                        </div>

                        {/* Metadata Footer: Owner, Due Date & Direct Move Buttons */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                          {/* Owner info */}
                          <div className="flex items-center gap-1.5 truncate max-w-[120px]" title={ownerName}>
                            <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700 uppercase shrink-0">
                              {ownerName.substring(0, 2)}
                            </div>
                            <span className="truncate text-slate-600 text-[10px]">{ownerName}</span>
                          </div>

                          {/* Due Date with Overdue Alert */}
                          {task.end_date ? (
                            <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${
                              taskOverdue 
                                ? 'bg-red-100 text-red-800 font-bold border border-red-200' 
                                : 'text-slate-500 bg-slate-50'
                            }`}>
                              <Calendar className="w-3 h-3 shrink-0" />
                              <span>{task.end_date}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Sin fecha</span>
                          )}
                        </div>

                        {/* Quick Status Shift Row (Ultra-fast UX on click) */}
                        <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 opacity-80 group-hover:opacity-100 transition-opacity">
                          <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-400">Mover:</span>
                          <div className="flex items-center gap-1">
                            {col.id !== 'not_started' && (
                              <button
                                onClick={() => handleDirectMove(task, 'No iniciada')}
                                className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[9px] font-medium transition-colors"
                                title="Mover a Por Iniciar"
                              >
                                ← Inicio
                              </button>
                            )}
                            {col.id !== 'in_progress' && (
                              <button
                                onClick={() => handleDirectMove(task, 'En progreso')}
                                className="px-1.5 py-0.5 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded text-[9px] font-medium transition-colors"
                                title="Mover a En Progreso"
                              >
                                Progreso
                              </button>
                            )}
                            {col.id !== 'under_review' && (
                              <button
                                onClick={() => handleDirectMove(task, 'En espera')}
                                className="px-1.5 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded text-[9px] font-medium transition-colors"
                                title="Mover a En Revisión"
                              >
                                Revisión
                              </button>
                            )}
                            {col.id !== 'completed' && (
                              <button
                                onClick={() => handleDirectMove(task, 'Completado')}
                                className="px-1.5 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded text-[9px] font-medium transition-colors"
                                title="Mover a Completadas"
                              >
                                Finalizar →
                              </button>
                            )}
                            
                            {onEditTask && (
                              <button
                                onClick={() => onEditTask(task)}
                                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded ml-1"
                                title="Editar detalles"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom quick add button */}
              <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                <button
                  onClick={() => {
                    setQuickAddColumn(col.id);
                    setQuickTaskName('');
                  }}
                  className="w-full py-1.5 px-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-400" />
                  <span>Añadir tarea</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
