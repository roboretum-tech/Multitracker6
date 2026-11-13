import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Project, Priority, ProjectStatus, Task } from '../types';
import { Plus, Search, Filter, Trash2, Edit3, Briefcase, ExternalLink, X, Check, Users, Calendar, Table, LayoutGrid } from 'lucide-react';
import { sanitizeUrl, isSafeUrl } from '../utils/security';
import ProjectGanttView from './ProjectGanttView';
import ProjectGanttModal from './ProjectGanttModal';

interface ProjectDatabaseProps {
  onOpenTaskModal?: (task?: Task, defaultProjectId?: string) => void;
}

export default function ProjectDatabase({ onOpenTaskModal }: ProjectDatabaseProps = {}) {
  const { projects, tasks, teamMembers, addProject, updateProject, deleteProject } = useData();
  const [viewMode, setViewMode] = useState<'table' | 'gantt'>('table');
  const [selectedGanttProject, setSelectedGanttProject] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'Estrategía',
    status: 'No iniciado' as ProjectStatus,
    priority: 'Medio' as Priority,
    start_date: '',
    deadline: '',
    completion_date: '',
    progress_percentage: 0,
    estimated_value: 0,
    key_document_links: '',
    responsible_id: '',
    accountable_id: '',
    consulted_id: '',
    informed_id: '',
  });

  const defaultCategories = [
    'Estrategía',
    'Desarrollo de productos',
    'Finanzas',
    'Ventas',
    'Marketing',
    'RRHH',
    'Operaciones',
    'Capacitación',
    'Desarrollo de software',
    'Planeación',
    'Atención al cliente',
  ];

  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('csea_custom_project_categories');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const categories = useMemo(() => {
    const fromProjects = projects.map(p => p.category).filter(Boolean) as string[];
    const combined = Array.from(new Set([...defaultCategories, ...customCategories, ...fromProjects]));
    return combined.sort((a, b) => a.localeCompare('es'));
  }, [projects, customCategories]);

  const handleAddNewCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (!customCategories.includes(trimmed)) {
      const updated = [...customCategories, trimmed];
      setCustomCategories(updated);
      try {
        localStorage.setItem('csea_custom_project_categories', JSON.stringify(updated));
      } catch (err) {
        console.error('Error saving custom categories:', err);
      }
    }
    setFormData(prev => ({ ...prev, category: trimmed }));
    setNewCategoryName('');
    setIsAddingCategory(false);
  };

  const handleOpenAdd = () => {
    setEditingProject(null);
    setFormData({
      name: '',
      category: 'Estrategía',
      status: 'No iniciado',
      priority: 'Medio',
      start_date: new Date().toISOString().split('T')[0],
      deadline: '',
      completion_date: '',
      progress_percentage: 0,
      estimated_value: 0,
      key_document_links: '',
      responsible_id: teamMembers[0]?.id || '',
      accountable_id: '',
      consulted_id: '',
      informed_id: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Project) => {
    setEditingProject(p);
    setFormData({
      name: p.name,
      category: p.category || 'Estrategía',
      status: p.status,
      priority: p.priority,
      start_date: p.start_date || '',
      deadline: p.deadline || '',
      completion_date: p.completion_date || '',
      progress_percentage: p.progress_percentage || 0,
      estimated_value: p.estimated_value || 0,
      key_document_links: p.key_document_links || '',
      responsible_id: p.responsible_id || '',
      accountable_id: p.accountable_id || '',
      consulted_id: p.consulted_id || '',
      informed_id: p.informed_id || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingProject) {
      await updateProject(editingProject.id, formData);
    } else {
      await addProject(formData);
    }
    setIsModalOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completado': return 'bg-emerald-50 text-emerald-900 border-emerald-200';
      case 'En curso': return 'bg-blue-50 text-blue-900 border-blue-200';
      case 'En espera': return 'bg-orange-50 text-orange-900 border-orange-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgente': return 'text-orange-950 bg-orange-100 border-orange-300 font-bold';
      case 'Dificil': return 'text-orange-900 bg-orange-50 border-orange-200 font-semibold';
      case 'Medio': return 'text-slate-800 bg-slate-100 border-slate-200 font-medium';
      default: return 'text-emerald-800 bg-emerald-50 border-emerald-200 font-medium';
    }
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || p.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getMemberName = (id?: string) => {
    if (!id) return '--';
    const m = teamMembers.find(t => t.id === id);
    return m ? m.name : id;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header with View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center">
            <Briefcase className="w-6 h-6 mr-2.5 text-orange-600" />
            Base de Datos de Iniciativas & Proyectos
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Control central de portafolio, matriz RACI y seguimiento de entregables</p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Switcher: Table vs Gantt */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-2xs">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Tabla</span>
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
              <span>Cronograma Gantt</span>
            </button>
          </div>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-all shadow-xs active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Nueva Iniciativa
          </button>
        </div>
      </div>

      {/* Conditionally Render Gantt View or Table View */}
      {viewMode === 'gantt' ? (
        <ProjectGanttView 
          onOpenProjectModal={handleOpenEdit}
          onOpenTaskModal={onOpenTaskModal}
        />
      ) : (
        /* Main Table Container */
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-3 justify-between items-center bg-slate-50">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar iniciativa o categoría..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 text-slate-900 placeholder-slate-400"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 text-slate-700 font-semibold"
              >
                <option value="ALL">Todos los Estados</option>
                <option value="No iniciado">No iniciado</option>
                <option value="En curso">En curso</option>
                <option value="Completado">Completado</option>
                <option value="En espera">En espera</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 text-slate-700 font-semibold"
              >
                <option value="ALL">Todas las Prioridades</option>
                <option value="Urgente">Urgente</option>
                <option value="Dificil">Dificil</option>
                <option value="Medio">Medio</option>
                <option value="Fácil">Fácil</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-4 py-3">Iniciativa / Proyecto</th>
                  <th scope="col" className="px-3 py-3">Categoría</th>
                  <th scope="col" className="px-3 py-3">Estado</th>
                  <th scope="col" className="px-3 py-3">Prioridad</th>
                  <th scope="col" className="px-3 py-3">Fechas Clave</th>
                  <th scope="col" className="px-3 py-3">Progreso</th>
                  <th scope="col" className="px-3 py-3">Presupuesto</th>
                  <th scope="col" className="px-3 py-3">Matriz RACI</th>
                  <th scope="col" className="px-3 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100 text-xs">
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-slate-400">
                      No se encontraron iniciativas con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((project) => (
                    <tr key={project.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{project.name}</span>
                          {project.key_document_links && isSafeUrl(project.key_document_links) && !project.key_document_links.includes('docs.google.com') && (
                            <a 
                              href={sanitizeUrl(project.key_document_links)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-orange-600 hover:text-orange-700"
                              title="Documento vinculado"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                          {project.task_count} entregables • {project.meeting_count} comités
                        </div>
                      </td>

                      <td className="px-3 py-3 text-slate-600 whitespace-nowrap font-medium">
                        {project.category || 'General'}
                      </td>

                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusColor(project.status)}`}>
                          {project.status}
                        </span>
                      </td>

                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] border ${getPriorityColor(project.priority)}`}>
                          {project.priority}
                        </span>
                      </td>

                      <td className="px-3 py-3 whitespace-nowrap text-slate-600 text-[11px]">
                        <div>Inicio: <span className="font-semibold text-slate-800">{project.start_date || 'N/A'}</span></div>
                        <div>Límite: <span className="font-semibold text-slate-800">{project.deadline || 'N/A'}</span></div>
                      </td>

                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="bg-orange-600 h-1.5 rounded-full" 
                              style={{ width: `${project.progress_percentage}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-800 text-[11px]">{project.progress_percentage}%</span>
                        </div>
                      </td>

                      <td className="px-3 py-3 whitespace-nowrap font-semibold text-slate-900">
                        ${(Number(project.estimated_value) || 0).toLocaleString()}
                      </td>

                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-[10px]">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-700" title="Responsable">R: {getMemberName(project.responsible_id)}</span>
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-700" title="Accountable">A: {getMemberName(project.accountable_id)}</span>
                        </div>
                      </td>

                      <td className="px-3 py-3 whitespace-nowrap text-right space-x-1">
                        <button
                          onClick={() => setSelectedGanttProject(project)}
                          className="px-2 py-1 bg-orange-50 hover:bg-orange-100 text-[#D98236] text-[11px] font-bold rounded-md border border-orange-200 transition-colors inline-flex items-center gap-1"
                          title="Ver Cronograma Gantt de este proyecto"
                        >
                          <Calendar className="w-3 h-3" />
                          <span>Gantt</span>
                        </button>
                        <button
                          onClick={() => handleOpenEdit(project)}
                          className="p-1 text-slate-400 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors inline-flex items-center"
                          title="Editar"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`¿Estás seguro de eliminar "${project.name}"?`)) {
                              deleteProject(project.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100 transition-colors inline-flex items-center"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Project-Specific Gantt Modal */}
      {selectedGanttProject && (
        <ProjectGanttModal
          project={selectedGanttProject}
          onClose={() => setSelectedGanttProject(null)}
          onEditProject={handleOpenEdit}
          onOpenTaskModal={onOpenTaskModal}
        />
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full border border-slate-300 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900 flex items-center">
                <Briefcase className="w-4 h-4 mr-2 text-orange-600" />
                {editingProject ? 'Editar Iniciativa Estratégica' : 'Registrar Nueva Iniciativa'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Nombre de la Iniciativa *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej. Plan Maestro de Transformación Digital"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Categoría</label>
                      {!isAddingCategory && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingCategory(true);
                            setNewCategoryName('');
                          }}
                          className="text-[10px] font-bold text-orange-600 hover:text-orange-800 flex items-center gap-0.5"
                          title="Agregar nueva categoría"
                        >
                          <Plus className="w-2.5 h-2.5" /> Nueva
                        </button>
                      )}
                    </div>

                    {isAddingCategory ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          autoFocus
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddNewCategory();
                            } else if (e.key === 'Escape') {
                              setIsAddingCategory(false);
                            }
                          }}
                          placeholder="Nombre..."
                          className="w-full px-2 py-1 text-xs bg-white border border-orange-500 rounded-lg focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleAddNewCategory}
                          className="px-2 py-1 bg-orange-600 text-white rounded-lg text-xs font-bold shrink-0"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddingCategory(false)}
                          className="px-1.5 py-1 text-slate-400 hover:text-slate-600 text-xs shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <select
                        value={formData.category}
                        onChange={(e) => {
                          if (e.target.value === '__NEW__') {
                            setIsAddingCategory(true);
                            setNewCategoryName('');
                          } else {
                            setFormData({ ...formData, category: e.target.value });
                          }
                        }}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
                      >
                        {categories.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                        <option value="__NEW__" className="font-bold text-orange-600">
                          + Nueva categoría...
                        </option>
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Estado</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
                    >
                      <option value="No iniciado">No iniciado</option>
                      <option value="En curso">En curso</option>
                      <option value="Completado">Completado</option>
                      <option value="En espera">En espera</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Prioridad</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
                    >
                      <option value="Fácil">Fácil</option>
                      <option value="Medio">Medio</option>
                      <option value="Dificil">Dificil</option>
                      <option value="Urgente">Urgente</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Fecha de Inicio</label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Fecha Límite</label>
                    <input
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Fecha Conclusión</label>
                    <input
                      type="date"
                      value={formData.completion_date}
                      onChange={(e) => setFormData({ ...formData, completion_date: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">
                        Avance Físico ({formData.progress_percentage}%)
                      </label>
                      <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded">
                        Cálculo Automático
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-1.5">
                      <div
                        className="bg-orange-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${formData.progress_percentage}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      {editingProject ? (
                        tasks.filter(t => t.project_id === editingProject.id).length > 0 ? (
                          <>
                            {tasks.filter(t => t.project_id === editingProject.id && (t.is_done || t.status === 'Completado')).length} de {tasks.filter(t => t.project_id === editingProject.id).length} tareas completadas.
                          </>
                        ) : (
                          'Sin tareas asignadas. Se calculará al agregar y completar tareas.'
                        )
                      ) : (
                        'Se calculará automáticamente al crear y completar las tareas de este proyecto.'
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Valor Estimado / Presupuesto ($)
                    </label>
                    <div className="relative rounded-lg shadow-2xs">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                        <span className="text-slate-400 font-bold text-xs">$</span>
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formData.estimated_value ? formData.estimated_value.toLocaleString('en-US') : ''}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/[^0-9]/g, '');
                          const num = raw === '' ? 0 : parseInt(raw, 10);
                          setFormData({ ...formData, estimated_value: num });
                        }}
                        placeholder="0.00"
                        className="w-full pl-6 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium tabular-nums"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Enlace a Documentación Clave
                  </label>
                  <input
                    type="url"
                    value={formData.key_document_links}
                    onChange={(e) => setFormData({ ...formData, key_document_links: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                {/* Matriz RACI */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block">
                    Asignación de Matriz RACI
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Responsable (R) *</label>
                      <select
                        value={formData.responsible_id}
                        onChange={(e) => setFormData({ ...formData, responsible_id: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
                      >
                        <option value="">Seleccionar consultor...</option>
                        {teamMembers.map((m) => (
                          <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">A cargo / Accountable (A)</label>
                      <select
                        value={formData.accountable_id}
                        onChange={(e) => setFormData({ ...formData, accountable_id: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
                      >
                        <option value="">Seleccionar responsable final...</option>
                        {teamMembers.map((m) => (
                          <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Consultado (C)</label>
                      <select
                        value={formData.consulted_id}
                        onChange={(e) => setFormData({ ...formData, consulted_id: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
                      >
                        <option value="">Seleccionar consultor técnico...</option>
                        {teamMembers.map((m) => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Informado (I)</label>
                      <select
                        value={formData.informed_id}
                        onChange={(e) => setFormData({ ...formData, informed_id: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
                      >
                        <option value="">Seleccionar interesado...</option>
                        {teamMembers.map((m) => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
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
                  {editingProject ? 'Guardar Cambios' : 'Registrar Iniciativa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
