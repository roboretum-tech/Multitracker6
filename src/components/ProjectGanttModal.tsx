import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Project, Task, Priority } from '../types';
import { 
  X, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Plus, 
  Briefcase, 
  Edit3, 
  Sparkles,
  Layers,
  ArrowRight,
  TrendingUp,
  Tag
} from 'lucide-react';

interface ProjectGanttModalProps {
  project: Project;
  onClose: () => void;
  onEditProject?: (p: Project) => void;
  onOpenTaskModal?: (task: Task, defaultProjectId?: string) => void;
}

export default function ProjectGanttModal({
  project,
  onClose,
  onEditProject,
  onOpenTaskModal,
}: ProjectGanttModalProps) {
  const { tasks, teamMembers, addTask, updateTask, updateProject } = useData();
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskStart, setNewTaskStart] = useState(project.start_date || new Date().toISOString().split('T')[0]);
  const [newTaskEnd, setNewTaskEnd] = useState(project.deadline || new Date().toISOString().split('T')[0]);
  const [newTaskOwner, setNewTaskOwner] = useState(project.responsible_id || '');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('Medio');

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayDate = useMemo(() => new Date(), []);

  // Filter tasks belonging to this project
  const projectTasks = useMemo(() => {
    return tasks.filter(t => t.project_id === project.id);
  }, [tasks, project.id]);

  const responsibleMember = teamMembers.find(m => m.id === project.responsible_id);

  // Timeline calculation
  const { timelineStart, timelineEnd, totalDays } = useMemo(() => {
    let minDate = project.start_date ? new Date(project.start_date) : new Date();
    let maxDate = project.deadline ? new Date(project.deadline) : new Date();

    projectTasks.forEach(t => {
      if (t.start_date) {
        const d = new Date(t.start_date);
        if (!isNaN(d.getTime()) && d < minDate) minDate = d;
      }
      if (t.end_date) {
        const d = new Date(t.end_date);
        if (!isNaN(d.getTime()) && d > maxDate) maxDate = d;
      }
    });

    const paddedStart = new Date(minDate);
    paddedStart.setDate(paddedStart.getDate() - 3);
    paddedStart.setHours(0, 0, 0, 0);

    const paddedEnd = new Date(maxDate);
    paddedEnd.setDate(paddedEnd.getDate() + 7);
    paddedEnd.setHours(23, 59, 59, 999);

    const diff = Math.max(14, Math.ceil((paddedEnd.getTime() - paddedStart.getTime()) / (1000 * 60 * 60 * 24)));

    return {
      timelineStart: paddedStart,
      timelineEnd: paddedEnd,
      totalDays: diff,
    };
  }, [project, projectTasks]);

  // Timeline columns
  const timelineColumns = useMemo(() => {
    const cols = [];
    const curr = new Date(timelineStart);
    while (curr <= timelineEnd) {
      const dateStr = curr.toISOString().split('T')[0];
      cols.push({
        date: new Date(curr),
        dateStr,
        dayNum: curr.getDate(),
        monthShort: curr.toLocaleDateString('es-ES', { month: 'short' }),
        dayName: curr.toLocaleDateString('es-ES', { weekday: 'narrow' }),
        isToday: dateStr === todayStr,
        isWeekend: curr.getDay() === 0 || curr.getDay() === 6,
      });
      curr.setDate(curr.getDate() + 1);
    }
    return cols;
  }, [timelineStart, timelineEnd, todayStr]);

  // Bar position helper
  const getBarPos = (startStr?: string, endStr?: string) => {
    if (!startStr && !endStr) return { left: 0, width: 0, visible: false, days: 0 };
    const s = startStr ? new Date(startStr) : new Date(endStr!);
    const e = endStr ? new Date(endStr) : new Date(startStr!);

    const diffStart = (s.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24);
    const duration = Math.max(1, (e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24) + 1);

    const left = Math.max(0, (diffStart / totalDays) * 100);
    const width = Math.min(100 - left, Math.max(1.5, (duration / totalDays) * 100));

    return { left, width, visible: true, days: Math.round(duration) };
  };

  const todayPos = useMemo(() => {
    const diff = (todayDate.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24);
    if (diff < 0 || diff > totalDays) return null;
    return (diff / totalDays) * 100;
  }, [todayDate, timelineStart, totalDays]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;

    await addTask({
      project_id: project.id,
      name: newTaskName.trim(),
      start_date: newTaskStart,
      end_date: newTaskEnd,
      owner_id: newTaskOwner || project.responsible_id || '',
      priority: newTaskPriority,
      status: 'No iniciada',
      is_done: false,
    });

    setNewTaskName('');
    setIsAddingTask(false);
  };

  const handleToggleTask = async (task: Task) => {
    const newDone = !task.is_done;
    await updateTask(task.id, {
      is_done: newDone,
      status: newDone ? 'Completado' : 'En curso',
    });
  };

  const completedCount = projectTasks.filter(t => t.is_done || t.status === 'Completado').length;
  const projectPos = getBarPos(project.start_date, project.deadline);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-5xl w-full flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 border-b border-slate-800 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-[#D98236] text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm">
                Cronograma Gantt
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ID: {project.id.slice(0, 8)}
              </span>
            </div>
            <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-orange-400" />
              {project.name}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 pt-1">
              <span><strong>Categoría:</strong> {project.category || 'Estratégico'}</span>
              <span>•</span>
              <span><strong>Responsable:</strong> {responsibleMember?.name || 'Sin asignar'}</span>
              <span>•</span>
              <span><strong>Plazo:</strong> {project.start_date || 'N/A'} al {project.deadline || 'N/A'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onEditProject && (
              <button
                onClick={() => {
                  onClose();
                  onEditProject(project);
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" /> Editar Proyecto
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Project Summary Metrics Strip */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400">Avance de la Iniciativa</span>
            <div className="text-base font-extrabold text-[#D98236]">
              {project.progress_percentage || 0}%
            </div>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400">Entregables Concluidos</span>
            <div className="text-base font-extrabold text-slate-800">
              {completedCount} de {projectTasks.length}
            </div>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400">Duración Estimada</span>
            <div className="text-base font-extrabold text-slate-800">
              {projectPos.days} días
            </div>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Estado</span>
              <div className="font-bold text-slate-800">{project.status}</div>
            </div>
            <button
              onClick={() => setIsAddingTask(true)}
              className="px-2.5 py-1 bg-[#D98236] hover:bg-[#c47128] text-white text-xs font-bold rounded-md shadow-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Entregable
            </button>
          </div>
        </div>

        {/* Quick Add Task Drawer */}
        {isAddingTask && (
          <form onSubmit={handleCreateTask} className="p-4 bg-orange-50/50 border-b border-orange-200 flex flex-wrap items-center gap-3 text-xs">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Nombre del Entregable</label>
              <input
                type="text"
                placeholder="Ej. Diagnóstico de procesos..."
                value={newTaskName}
                onChange={e => setNewTaskName(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-orange-500 text-xs"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Fecha Inicio</label>
              <input
                type="date"
                value={newTaskStart}
                onChange={e => setNewTaskStart(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-300 rounded-md text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Fecha Término</label>
              <input
                type="date"
                value={newTaskEnd}
                onChange={e => setNewTaskEnd(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-300 rounded-md text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Responsable</label>
              <select
                value={newTaskOwner}
                onChange={e => setNewTaskOwner(e.target.value)}
                className="px-2 py-1.5 bg-white border border-slate-300 rounded-md text-xs"
              >
                {teamMembers.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2 pt-3">
              <button
                type="submit"
                className="px-3 py-1.5 bg-[#D98236] text-white font-bold rounded-md hover:bg-orange-700 shadow-xs"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setIsAddingTask(false)}
                className="px-3 py-1.5 bg-slate-200 text-slate-700 font-medium rounded-md hover:bg-slate-300"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Scrollable Gantt Timeline Area */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-4">
          <div className="min-w-[800px] border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            
            {/* Header */}
            <div className="bg-slate-900 text-white flex text-xs font-bold border-b border-slate-800">
              <div className="w-72 shrink-0 p-3 border-r border-slate-800">
                Entregable / Actividad
              </div>
              <div className="flex-1 flex relative">
                {timelineColumns.map((col, idx) => (
                  <div
                    key={idx}
                    className={`py-2 text-center border-r border-slate-800 text-[10px] flex flex-col justify-center ${
                      col.isToday ? 'bg-orange-500 text-white font-black' : 
                      col.isWeekend ? 'bg-slate-800/60 text-slate-500' : 'text-slate-300'
                    }`}
                    style={{ width: `${(1 / totalDays) * 100}%` }}
                  >
                    <span>{col.monthShort}</span>
                    <span className="font-mono text-[11px]">{col.dayNum}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Grid & Bars */}
            <div className="relative divide-y divide-slate-100 bg-white">
              {/* Background grid lines */}
              <div className="absolute inset-0 left-72 flex pointer-events-none z-0">
                {timelineColumns.map((col, idx) => (
                  <div
                    key={idx}
                    className={`h-full border-r border-slate-100 ${col.isWeekend ? 'bg-slate-50/60' : ''}`}
                    style={{ width: `${(1 / totalDays) * 100}%` }}
                  />
                ))}
                {todayPos !== null && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-20"
                    style={{ left: `${todayPos}%` }}
                  />
                )}
              </div>

              {/* Master Project Row */}
              <div className="flex items-center bg-slate-50 relative z-10 min-h-[44px]">
                <div className="w-72 shrink-0 px-3 py-2 border-r border-slate-200 font-bold text-xs text-slate-900 truncate">
                  ★ {project.name} (Iniciativa Madre)
                </div>
                <div className="flex-1 relative h-9 flex items-center px-1">
                  {projectPos.visible && (
                    <div
                      className="absolute h-6 rounded-md bg-slate-900 text-white text-[11px] font-bold px-2 flex items-center shadow-xs truncate"
                      style={{
                        left: `${projectPos.left}%`,
                        width: `${projectPos.width}%`,
                      }}
                    >
                      <div
                        className="absolute top-0 bottom-0 left-0 bg-orange-500/40"
                        style={{ width: `${project.progress_percentage || 0}%` }}
                      />
                      <span className="relative z-10 truncate">{project.name} ({projectPos.days} días)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Task Rows */}
              {projectTasks.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Aún no hay entregables definidos en esta iniciativa. Pulsa "+ Entregable" arriba para registrar el primero.
                </div>
              ) : (
                projectTasks.map((t) => {
                  const tPos = getBarPos(t.start_date, t.end_date);
                  const isDone = t.is_done || t.status === 'Completado';
                  const owner = teamMembers.find(m => m.id === t.owner_id);

                  return (
                    <div key={t.id} className="flex items-center hover:bg-slate-50 relative z-10 min-h-[38px]">
                      <div className="w-72 shrink-0 px-3 py-1.5 border-r border-slate-200 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={isDone}
                            onChange={() => handleToggleTask(t)}
                            className="rounded-sm text-[#D98236] focus:ring-orange-500 cursor-pointer"
                          />
                          <span 
                            onClick={() => {
                              if (onOpenTaskModal) {
                                onClose();
                                onOpenTaskModal(t, project.id);
                              }
                            }}
                            className={`text-xs truncate ${onOpenTaskModal ? 'cursor-pointer hover:text-[#D98236] transition-colors' : ''} ${isDone ? 'line-through text-slate-400' : 'text-slate-800 font-medium'}`}
                            title={onOpenTaskModal ? `Clic para editar: ${t.name}` : t.name}
                          >
                            {t.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {owner?.name?.split(' ')[0] || ''}
                        </span>
                      </div>

                      <div className="flex-1 relative h-8 flex items-center px-1">
                        {tPos.visible ? (
                          <div
                            onClick={() => {
                              if (onOpenTaskModal) {
                                onClose();
                                onOpenTaskModal(t, project.id);
                              }
                            }}
                            className={`absolute h-4.5 rounded-sm shadow-2xs text-white text-[10px] font-semibold px-1.5 flex items-center transition-all ${
                              onOpenTaskModal ? 'cursor-pointer hover:ring-2 hover:ring-orange-400' : ''
                            } ${
                              isDone ? 'bg-emerald-600' : 'bg-[#D98236]'
                            }`}
                            style={{
                              left: `${tPos.left}%`,
                              width: `${tPos.width}%`,
                            }}
                            title={onOpenTaskModal ? `Clic para editar en Tareas: ${t.name}` : undefined}
                          >
                            <span className="truncate">{t.name} ({tPos.days}d)</span>
                          </div>
                        ) : (
                          <span 
                            onClick={() => {
                              if (onOpenTaskModal) {
                                onClose();
                                onOpenTaskModal(t, project.id);
                              }
                            }}
                            className={`text-[10px] text-slate-300 italic pl-2 ${onOpenTaskModal ? 'cursor-pointer hover:text-slate-500' : ''}`}
                          >
                            Sin fecha
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-slate-900 rounded-xs inline-block" /> Iniciativa
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-[#D98236] rounded-xs inline-block" /> Entregable
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-emerald-600 rounded-xs inline-block" /> Concluido
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors"
          >
            Cerrar Cronograma
          </button>
        </div>

      </div>
    </div>
  );
}
