import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Task, Priority, Project } from '../types';
import { Plus, Search, Filter, Trash2, CheckSquare, AlertCircle, Clock, Calendar, Check, X, Edit3, Table, ListTodo, GitFork, Flame, ShieldCheck, FolderKanban } from 'lucide-react';
import ProjectGanttView from './ProjectGanttView';
import ProjectGanttModal from './ProjectGanttModal';
import BaselineComparisonView from './BaselineComparisonView';
import KanbanBoard from './KanbanBoard';

interface TaskListProps {
  initialView?: 'tasks' | 'kanban' | 'gantt' | 'baseline';
  initialEditingTask?: Task | null;
  defaultProjectId?: string;
  onClearInitialEditingTask?: () => void;
}

export default function TaskList({ 
  initialView = 'kanban',
  initialEditingTask,
  defaultProjectId,
  onClearInitialEditingTask,
}: TaskListProps) {
  const { tasks, projects, teamMembers, addTask, updateTask, deleteTask, toggleTaskDone } = useData();
  const [viewMode, setViewMode] = useState<'tasks' | 'kanban' | 'gantt' | 'baseline'>(initialView);
  const [selectedGanttProject, setSelectedGanttProject] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [ownerFilter, setOwnerFilter] = useState('ALL');
  const [highlightOverdue, setHighlightOverdue] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [formData, setFormData] = useState({
    project_id: '',
    name: '',
    start_date: '',
    end_date: '',
    status: 'No iniciada',
    priority: 'Medio' as Priority,
    owner_id: '',
    notes: '',
    dependencies: [] as string[],
  });

  const todayStr = new Date().toISOString().split('T')[0];

  // Sync viewMode if initialView changes externally
  useEffect(() => {
    if (initialView) {
      setViewMode(initialView);
    }
  }, [initialView]);

  // If a task is passed externally (e.g. from Gantt click), open it in edit mode immediately
  useEffect(() => {
    if (initialEditingTask) {
      handleOpenEdit(initialEditingTask);
      onClearInitialEditingTask?.();
    } else if (defaultProjectId) {
      setEditingTask(null);
      setFormData({
        project_id: defaultProjectId,
        name: '',
        start_date: todayStr,
        end_date: '',
        status: 'No iniciada',
        priority: 'Medio',
        owner_id: teamMembers[0]?.id || '',
        notes: '',
        dependencies: [],
      });
      setIsModalOpen(true);
      onClearInitialEditingTask?.();
    }
  }, [initialEditingTask, defaultProjectId]);

  const handleOpenAdd = () => {
    setEditingTask(null);
    setFormData({
      project_id: projects[0]?.id || '',
      name: '',
      start_date: todayStr,
      end_date: '',
      status: 'No iniciada',
      priority: 'Medio',
      owner_id: teamMembers[0]?.id || '',
      notes: '',
      dependencies: [],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: Task) => {
    setEditingTask(t);
    setFormData({
      project_id: t.project_id,
      name: t.name,
      start_date: t.start_date || '',
      end_date: t.end_date || '',
      status: t.status,
      priority: t.priority,
      owner_id: t.owner_id || '',
      notes: t.notes || '',
      dependencies: t.dependencies || [],
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.project_id) return;

    if (editingTask) {
      await updateTask(editingTask.id, formData);
    } else {
      await addTask({
        ...formData,
        is_done: formData.status === 'Completado',
      });
    }
    setIsModalOpen(false);
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'Urgente': return 'bg-orange-100 text-orange-950 border-orange-300 font-bold';
      case 'Dificil': return 'bg-orange-50 text-orange-900 border-orange-200 font-semibold';
      case 'Medio': return 'bg-slate-100 text-slate-800 border-slate-200 font-medium';
      default: return 'bg-emerald-50 text-emerald-800 border-emerald-200 font-medium';
    }
  };

  const isTaskOverdue = (task: Task) => {
    if (task.is_done || task.status === 'Completado' || !task.end_date) return false;
    return task.end_date < todayStr;
  };

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (t.notes && t.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesProject = projectFilter === 'ALL' || t.project_id === projectFilter;
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
    const matchesOwner = ownerFilter === 'ALL' || t.owner_id === ownerFilter;
    return matchesSearch && matchesProject && matchesStatus && matchesPriority && matchesOwner;
  });

  const getProjectName = (id: string) => {
    const p = projects.find(proj => proj.id === id);
    return p ? p.name : 'Iniciativa General';
  };

  const getOwnerName = (id?: string) => {
    if (!id) return 'Sin asignar';
    const m = teamMembers.find(t => t.id === id);
    return m ? m.name : id;
  };

  const tasksDueToday = tasks.filter(t => t.end_date === todayStr && !t.is_done).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center">
            <CheckSquare className="w-6 h-6 mr-2.5 text-orange-600" />
            Matriz de Tareas & Entregables
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Control de compromisos, fechas límite y asignación de consultores</p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-2xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('tasks')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                viewMode === 'tasks'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5" />
              <span>Lista</span>
            </button>
            <button
              onClick={() => setViewMode('gantt')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                viewMode === 'gantt'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Gantt</span>
            </button>
            <button
              onClick={() => setViewMode('baseline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                viewMode === 'baseline'
                  ? 'bg-[#0f172a] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />
              <span>Línea Base</span>
            </button>
          </div>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-all shadow-xs active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Nuevo Entregable
          </button>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <KanbanBoard 
          onOpenNewTask={handleOpenAdd}
          onEditTask={handleOpenEdit}
        />
      ) : viewMode === 'gantt' ? (
        <ProjectGanttView 
          onNavigateToBaseline={() => setViewMode('baseline')}
          onOpenTaskModal={(task, pId) => {
            setViewMode('tasks');
            if (task) {
              handleOpenEdit(task);
            } else {
              setEditingTask(null);
              setFormData({
                project_id: pId || projects[0]?.id || '',
                name: '',
                start_date: todayStr,
                end_date: '',
                status: 'No iniciada',
                priority: 'Medio',
                owner_id: teamMembers[0]?.id || '',
                notes: '',
                dependencies: [],
              });
              setIsModalOpen(true);
            }
          }}
        />
      ) : viewMode === 'baseline' ? (
        <BaselineComparisonView 
          onNavigateToGantt={() => setViewMode('gantt')}
          onOpenTaskModal={(task, pId) => {
            setViewMode('tasks');
            if (task) {
              handleOpenEdit(task);
            } else {
              setEditingTask(null);
              setFormData({
                project_id: pId || projects[0]?.id || '',
                name: '',
                start_date: todayStr,
                end_date: '',
                status: 'No iniciada',
                priority: 'Medio',
                owner_id: teamMembers[0]?.id || '',
                notes: '',
                dependencies: [],
              });
              setIsModalOpen(true);
            }
          }}
        />
      ) : (
        <>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500">Fecha del Sistema</span>
            <div className="text-sm font-bold text-slate-900 mt-0.5">{todayStr}</div>
          </div>
          <div className="p-2 bg-slate-100 text-blue-900 rounded-lg">
            <Calendar className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500">Vencimiento Hoy</span>
            <div className="text-sm font-bold text-slate-900 mt-0.5">{tasksDueToday} entregables</div>
          </div>
          <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500">Monitoreo de Vencidos</span>
            <div className="text-xs font-bold text-slate-900 mt-0.5">{highlightOverdue ? 'Activo (Rojo)' : 'Inactivo'}</div>
          </div>
          <button
            onClick={() => setHighlightOverdue(!highlightOverdue)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
              highlightOverdue ? 'bg-orange-100 text-orange-900 border border-orange-200' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {highlightOverdue ? 'Alerta ON' : 'Alerta OFF'}
          </button>
        </div>
      </div>

      {/* Main Task List Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        {/* Filters bar */}
        <div className="p-3.5 border-b border-slate-200 flex flex-wrap gap-2.5 items-center justify-between bg-slate-50">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar entregable o nota..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 text-slate-900 placeholder-slate-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 text-slate-700 font-semibold"
            >
              <option value="ALL">Todas las Iniciativas</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 text-slate-700 font-semibold"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="No iniciada">No iniciada</option>
              <option value="En progreso">En progreso</option>
              <option value="Completado">Completado</option>
              <option value="En espera">En espera</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 text-slate-700 font-semibold"
            >
              <option value="ALL">Prioridad</option>
              <option value="Urgente">Urgente</option>
              <option value="Dificil">Dificil</option>
              <option value="Medio">Medio</option>
              <option value="Fácil">Fácil</option>
            </select>

            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 text-slate-700 font-semibold"
            >
              <option value="ALL">Consultor Asignado</option>
              {teamMembers.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-3 py-3 w-10 text-center">Estado</th>
                <th scope="col" className="px-4 py-3">Entregable / Tarea</th>
                <th scope="col" className="px-3 py-3">Iniciativa</th>
                <th scope="col" className="px-3 py-3">Estatus</th>
                <th scope="col" className="px-3 py-3">Prioridad</th>
                <th scope="col" className="px-3 py-3">Consultor Responsable</th>
                <th scope="col" className="px-3 py-3">Dependencias</th>
                <th scope="col" className="px-3 py-3">Vencimiento</th>
                <th scope="col" className="px-3 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100 text-xs">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-400">
                    No se encontraron entregables con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const overdue = highlightOverdue && isTaskOverdue(task);
                  const predCount = task.dependencies?.length || 0;
                  return (
                    <tr 
                      key={task.id} 
                      className={`transition-colors ${
                        overdue ? 'bg-orange-50/50 hover:bg-orange-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={() => toggleTaskDone(task.id)}
                          className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                            task.is_done 
                              ? 'bg-emerald-600 text-white shadow-2xs' 
                              : 'border border-slate-300 hover:border-orange-500 bg-white'
                          }`}
                        >
                          {task.is_done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                      </td>

                      <td className="px-4 py-3">
                        <div className={`font-semibold ${task.is_done ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {task.name}
                        </div>
                        {task.notes && (
                          <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{task.notes}</p>
                        )}
                      </td>

                      <td className="px-3 py-3 text-slate-600 font-medium whitespace-nowrap">
                        {getProjectName(task.project_id)}
                      </td>

                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          task.status === 'Completado' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' :
                          task.status === 'En progreso' ? 'bg-blue-50 text-blue-900 border-blue-200' :
                          task.status === 'En espera' ? 'bg-orange-50 text-orange-900 border-orange-200' :
                          'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {task.status}
                        </span>
                      </td>

                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] border ${getPriorityBadge(task.priority)}`}>
                          {task.priority}
                        </span>
                      </td>

                      <td className="px-3 py-3 text-slate-700 whitespace-nowrap font-medium">
                        {getOwnerName(task.owner_id)}
                      </td>

                      {/* Dependencies column */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        {predCount > 0 ? (
                          <span 
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200"
                            title={`Predecesoras: ${task.dependencies?.map(id => tasks.find(t => t.id === id)?.name || id).join(', ')}`}
                          >
                            <GitFork className="w-3 h-3 text-orange-600" />
                            <span>{predCount} pred</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-300 italic">Directa</span>
                        )}
                      </td>

                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-medium ${overdue ? 'text-orange-700 font-bold' : 'text-slate-600'}`}>
                            {task.end_date || 'Sin fecha'}
                          </span>
                          {overdue && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 bg-orange-100 text-orange-900 rounded border border-orange-300">
                              Vencido
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-3 py-3 whitespace-nowrap text-right space-x-1">
                        <button
                          onClick={() => handleOpenEdit(task)}
                          className="p-1 text-slate-400 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors"
                          title="Editar"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`¿Eliminar la tarea "${task.name}"?`)) {
                              deleteTask(task.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}

      {/* Add / Edit Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-300 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900 flex items-center">
                <CheckSquare className="w-4 h-4 mr-2 text-orange-600" />
                {editingTask ? 'Editar Entregable' : 'Registrar Nuevo Entregable'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">Iniciativa Relacionada *</label>
                <select
                  required
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
                >
                  <option value="">Seleccionar iniciativa...</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">Descripción del Entregable *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej. Diagnóstico de madurez CSEA v4.0"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Estado</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="No iniciada">No iniciada</option>
                    <option value="En progreso">En progreso</option>
                    <option value="Completado">Completado</option>
                    <option value="En espera">En espera</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Prioridad</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="Fácil">Fácil</option>
                    <option value="Medio">Medio</option>
                    <option value="Dificil">Dificil</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Fecha Inicio</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Fecha Entrega / Vencimiento</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Consultor Asignado</label>
                <select
                  value={formData.owner_id}
                  onChange={(e) => setFormData({ ...formData, owner_id: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  <option value="">Sin asignar</option>
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                  ))}
                </select>
              </div>

              {/* Task Dependencies (Predecessors) */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-slate-700">
                    <GitFork className="w-3 h-3 text-[#D98236]" />
                    Tareas Predecesoras (Dependencias Fin a Inicio)
                  </span>
                  <span className="text-slate-400 text-[9px] font-normal">
                    Determina la Ruta Crítica (CPM)
                  </span>
                </label>
                
                {(() => {
                  const candidateTasks = tasks.filter(t => 
                    t.project_id === formData.project_id && (!editingTask || t.id !== editingTask.id)
                  );

                  if (candidateTasks.length === 0) {
                    return (
                      <p className="text-[11px] text-slate-400 italic bg-slate-50 p-2 rounded-lg border border-slate-200">
                        No hay otras tareas registradas en esta iniciativa para vincular como predecesoras.
                      </p>
                    );
                  }

                  return (
                    <div className="max-h-32 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                      {candidateTasks.map(cand => {
                        const isChecked = (formData.dependencies || []).includes(cand.id);
                        return (
                          <label key={cand.id} className="flex items-center gap-2 text-xs text-slate-700 hover:bg-white p-1 rounded-sm cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={e => {
                                const currentDeps = formData.dependencies || [];
                                const nextDeps = e.target.checked
                                  ? [...currentDeps, cand.id]
                                  : currentDeps.filter(id => id !== cand.id);
                                setFormData({ ...formData, dependencies: nextDeps });
                              }}
                              className="rounded-xs text-orange-600 focus:ring-orange-500"
                            />
                            <span className="truncate font-medium">{cand.name}</span>
                            <span className="text-[10px] text-slate-400 ml-auto shrink-0">
                              ({cand.start_date || 'N/A'} al {cand.end_date || 'N/A'})
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Notas / Criterios de Aceptación</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Detalles sobre entregables, acuerdos, etc."
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-xs"
                >
                  {editingTask ? 'Guardar Cambios' : 'Registrar Entregable'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
