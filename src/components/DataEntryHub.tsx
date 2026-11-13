import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Priority, ProjectStatus, InvoiceStatus } from '../types';
import {
  FilePlus2,
  Briefcase,
  CheckSquare,
  Calendar,
  Users,
  MessageSquare,
  CreditCard,
  Plus,
  Check,
  Sparkles,
  ArrowRight,
  Database,
  RefreshCw,
  SlidersHorizontal,
  Layers
} from 'lucide-react';

export default function DataEntryHub() {
  const {
    projects,
    teamMembers,
    addProject,
    addTask,
    addMeeting,
    addTeamMember,
    addCommunication,
    addInvoice,
  } = useData();

  const [activeTab, setActiveTab] = useState<'project' | 'task' | 'meeting' | 'team' | 'comm' | 'invoice'>('project');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // --- Project Form State ---
  const [projectForm, setProjectForm] = useState({
    name: '',
    category: 'Estrategía',
    status: 'No iniciado' as ProjectStatus,
    priority: 'Medio' as Priority,
    start_date: new Date().toISOString().split('T')[0],
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

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.name.trim()) return;
    await addProject(projectForm);
    showSuccess(`¡Proyecto "${projectForm.name}" guardado exitosamente!`);
    setProjectForm({
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
      responsible_id: '',
      accountable_id: '',
      consulted_id: '',
      informed_id: '',
    });
  };

  // --- Task Form State ---
  const [taskForm, setTaskForm] = useState({
    project_id: projects[0]?.id || '',
    name: '',
    status: 'No iniciado',
    priority: 'Medio' as Priority,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    owner_id: teamMembers[0]?.id || '',
    notes: '',
  });

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.name.trim() || !taskForm.project_id) return;
    await addTask({
      ...taskForm,
      is_done: taskForm.status === 'Completado',
    });
    showSuccess(`¡Tarea "${taskForm.name}" creada exitosamente!`);
    setTaskForm({
      project_id: taskForm.project_id,
      name: '',
      status: 'No iniciado',
      priority: 'Medio',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      owner_id: teamMembers[0]?.id || '',
      notes: '',
    });
  };

  // --- Meeting Form State ---
  const [meetingForm, setMeetingForm] = useState({
    project_id: projects[0]?.id || '',
    name: '',
    meeting_date: new Date().toISOString().slice(0, 16),
    meeting_type: 'Reunión de alineación',
    status: 'Reunión programada',
    attendees: '',
    notes: '',
  });

  const handleMeetingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingForm.name.trim() || !meetingForm.project_id) return;
    await addMeeting(meetingForm);
    showSuccess(`¡Reunión "${meetingForm.name}" agendada exitosamente!`);
    setMeetingForm({
      project_id: meetingForm.project_id,
      name: '',
      meeting_date: new Date().toISOString().slice(0, 16),
      meeting_type: 'Reunión de alineación',
      status: 'Reunión programada',
      attendees: '',
      notes: '',
    });
  };

  // --- Team Member Form State ---
  const [teamForm, setTeamForm] = useState({
    name: '',
    role: 'Líder de Proyecto',
    notes: '',
  });

  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamForm.name.trim()) return;
    await addTeamMember(teamForm);
    showSuccess(`¡Miembro "${teamForm.name}" registrado en el equipo!`);
    setTeamForm({
      name: '',
      role: 'Líder de Proyecto',
      notes: '',
    });
  };

  // --- Communication Form State ---
  const [commForm, setCommForm] = useState({
    project_id: projects[0]?.id || '',
    comm_date: new Date().toISOString().slice(0, 16),
    comm_type: 'Correo electrónico',
    outcome: '',
    notes: '',
  });

  const handleCommSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commForm.project_id) return;
    await addCommunication(commForm);
    showSuccess(`¡Comunicación registrada exitosamente!`);
    setCommForm({
      project_id: commForm.project_id,
      comm_date: new Date().toISOString().slice(0, 16),
      comm_type: 'Correo electrónico',
      outcome: '',
      notes: '',
    });
  };

  // --- Invoice Form State ---
  const [invoiceForm, setInvoiceForm] = useState({
    project_id: projects[0]?.id || '',
    invoice_number: '',
    amount: 0,
    sent_date: new Date().toISOString().split('T')[0],
    due_date: '',
    status: 'Aún no enviado' as InvoiceStatus,
    notes: '',
  });

  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceForm.invoice_number.trim() || !invoiceForm.project_id) return;
    await addInvoice(invoiceForm);
    showSuccess(`¡Factura "${invoiceForm.invoice_number}" registrada con éxito!`);
    setInvoiceForm({
      project_id: invoiceForm.project_id,
      invoice_number: '',
      amount: 0,
      sent_date: new Date().toISOString().split('T')[0],
      due_date: '',
      status: 'Aún no enviado',
      notes: '',
    });
  };

  const defaultProjectCategories = [
    'Desarrollo de productos',
    'Estrategía',
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

  const projectCategories = useMemo(() => {
    const fromProjects = projects.map(p => p.category).filter(Boolean) as string[];
    const combined = Array.from(new Set([...defaultProjectCategories, ...customCategories, ...fromProjects]));
    return combined.sort((a, b) => a.localeCompare('es'));
  }, [projects, customCategories]);

  const handleAddNewCategory = (nameToAdd?: string) => {
    const trimmed = (nameToAdd || newCategoryName).trim();
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
    setProjectForm(prev => ({ ...prev, category: trimmed }));
    setNewCategoryName('');
    setIsAddingCategory(false);
    showSuccess(`¡Categoría "${trimmed}" agregada y seleccionada!`);
  };

  const teamRoles = [
    'Director de Consultoría',
    'Líder de Proyecto',
    'Consultor Senior',
    'Consultor Estratégico',
    'Analista de Negocio',
    'Director de Operaciones',
    'Sponsor Ejecutivo',
    'Desarrollador Senior',
    'Diseñador UX/UI',
    'Coordinador Administrativo',
  ];

  const commTypes = [
    'Correo electrónico',
    'Llamada telefónica',
    'Mensaje / Slack / Teams',
    'Presentación ejecutiva',
    'Minuta de acuerdos',
    'Reporte de estatus',
    'Sesión de trabajo',
  ];

  const meetingTypes = [
    'Reunión de alineación',
    'Seguimiento ejecutivo',
    'Revisión de entregables',
    'Comité directivo',
    'Kick-off',
    'Retrospectiva',
    'Sesión de trabajo',
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center">
            <FilePlus2 className="w-6 h-6 mr-2.5 text-orange-600" />
            Centro de Captura e Ingreso de Datos
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ingreso centralizado de proyectos, tareas, comités, equipo, comunicaciones y facturas
          </p>
        </div>

        {successMessage && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold animate-fade-in shadow-xs">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}
      </div>

      {/* Navigation Pills */}
      <div className="bg-white p-1.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-1.5">
        <button
          onClick={() => setActiveTab('project')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'project'
              ? 'bg-[#0f172a] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5 text-orange-500" />
          <span>Nueva Iniciativa</span>
        </button>

        <button
          onClick={() => setActiveTab('task')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'task'
              ? 'bg-[#0f172a] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5 text-orange-500" />
          <span>Nuevo Entregable</span>
        </button>

        <button
          onClick={() => setActiveTab('meeting')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'meeting'
              ? 'bg-[#0f172a] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-orange-500" />
          <span>Agendar Sesión</span>
        </button>

        <button
          onClick={() => setActiveTab('team')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'team'
              ? 'bg-[#0f172a] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-orange-500" />
          <span>Consultor / Equipo</span>
        </button>

        <button
          onClick={() => setActiveTab('comm')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'comm'
              ? 'bg-[#0f172a] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-orange-500" />
          <span>Bitácora Comunicación</span>
        </button>

        <button
          onClick={() => setActiveTab('invoice')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'invoice'
              ? 'bg-[#0f172a] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5 text-orange-500" />
          <span>Nueva Factura</span>
        </button>
      </div>

      {/* Main Form Container */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 md:p-8">
        {/* ================= PROJECT FORM ================= */}
        {activeTab === 'project' && (
          <form 
            onSubmit={handleProjectSubmit} 
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') {
                e.preventDefault();
              }
            }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-indigo-600" />
                  Registro de Nuevo Proyecto / Iniciativa
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">Define los parámetros clave, cronograma y roles RACI</p>
              </div>
              <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-semibold">
                Total actuales: {projects.length}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div className="md:col-span-2">
                <label className="block font-bold text-gray-700 mb-1.5">Nombre del Proyecto *</label>
                <input
                  type="text"
                  required
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  placeholder="Ej. Implementación ERP Fase 2, Estrategia Comercial Q3..."
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-bold text-gray-700">Categoría / Área</label>
                  {!isAddingCategory && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCategory(true);
                        setNewCategoryName('');
                      }}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                      title="Agregar una nueva categoría o área de proyecto"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Nueva categoría</span>
                    </button>
                  )}
                </div>

                {isAddingCategory ? (
                  <div className="flex items-center gap-2">
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
                      placeholder="Nombre de la nueva categoría / área..."
                      className="w-full px-3.5 py-2.5 bg-white border-2 border-indigo-500 rounded-xl focus:outline-none text-xs font-semibold text-gray-900 shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddNewCategory()}
                      disabled={!newCategoryName.trim()}
                      className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shrink-0 transition-colors shadow-xs"
                    >
                      Agregar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCategory(false);
                        setNewCategoryName('');
                      }}
                      className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold shrink-0 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <select
                    value={projectForm.category}
                    onChange={(e) => {
                      if (e.target.value === '__NEW__') {
                        setIsAddingCategory(true);
                        setNewCategoryName('');
                      } else {
                        setProjectForm({ ...projectForm, category: e.target.value });
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none font-medium text-gray-900"
                  >
                    {projectCategories.map((cat, idx) => (
                      <option key={idx} value={cat}>{cat}</option>
                    ))}
                    <option value="__NEW__" className="font-bold text-indigo-600">
                      + Agregar nueva categoría / área...
                    </option>
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1.5">Estado</label>
                  <select
                    value={projectForm.status}
                    onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value as ProjectStatus })}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  >
                    <option value="No iniciado">No iniciado</option>
                    <option value="En curso">En curso</option>
                    <option value="Completado">Completado</option>
                    <option value="En espera">En espera</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1.5">Prioridad</label>
                  <select
                    value={projectForm.priority}
                    onChange={(e) => setProjectForm({ ...projectForm, priority: e.target.value as Priority })}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  >
                    <option value="Urgente">Urgente</option>
                    <option value="Dificil">Dificil</option>
                    <option value="Medio">Medio</option>
                    <option value="Fácil">Fácil</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1.5">Fecha de Inicio</label>
                  <input
                    type="date"
                    value={projectForm.start_date}
                    onChange={(e) => setProjectForm({ ...projectForm, start_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1.5">Fecha Límite (Deadline)</label>
                  <input
                    type="date"
                    value={projectForm.deadline}
                    onChange={(e) => setProjectForm({ ...projectForm, deadline: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 bg-indigo-50/60 border border-indigo-100 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-gray-700">Avance Físico (0%)</label>
                    <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100/70 px-1.5 py-0.5 rounded">
                      Cálculo Automático
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mb-1.5">
                    <div className="bg-indigo-600 h-full w-0" />
                  </div>
                  <p className="text-[11px] text-gray-500 leading-tight">
                    Se calculará automáticamente según el avance y entrega de sus tareas asociadas.
                  </p>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1.5">Valor Estimado ($)</label>
                  <div className="relative rounded-xl shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <span className="text-gray-500 font-bold text-sm">$</span>
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={projectForm.estimated_value ? projectForm.estimated_value.toLocaleString('en-US') : ''}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, '');
                        const num = raw === '' ? 0 : parseInt(raw, 10);
                        setProjectForm({ ...projectForm, estimated_value: num });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                        }
                      }}
                      placeholder="0.00"
                      className="w-full pl-8 pr-12 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none font-semibold text-gray-900 tabular-nums"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">USD</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* RACI Matrix section */}
              <div className="md:col-span-2 pt-3 border-t border-gray-100">
                <span className="block text-xs font-bold uppercase tracking-wider text-indigo-700 mb-3">
                  Asignación de Roles RACI
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Responsible (R) *</label>
                    <select
                      value={projectForm.responsible_id}
                      onChange={(e) => setProjectForm({ ...projectForm, responsible_id: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    >
                      <option value="">Seleccionar...</option>
                      {teamMembers.map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Accountable (A)</label>
                    <select
                      value={projectForm.accountable_id}
                      onChange={(e) => setProjectForm({ ...projectForm, accountable_id: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    >
                      <option value="">Seleccionar...</option>
                      {teamMembers.map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Consulted (C)</label>
                    <select
                      value={projectForm.consulted_id}
                      onChange={(e) => setProjectForm({ ...projectForm, consulted_id: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    >
                      <option value="">Seleccionar...</option>
                      {teamMembers.map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Informed (I)</label>
                    <select
                      value={projectForm.informed_id}
                      onChange={(e) => setProjectForm({ ...projectForm, informed_id: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    >
                      <option value="">Seleccionar...</option>
                      {teamMembers.map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-gray-700 mb-1.5">Enlaces a Documentos Clave</label>
                <input
                  type="text"
                  value={projectForm.key_document_links}
                  onChange={(e) => setProjectForm({ ...projectForm, key_document_links: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-2 text-xs"
              >
                <Plus className="w-4 h-4" />
                Guardar Proyecto
              </button>
            </div>
          </form>
        )}

        {/* ================= TASK FORM ================= */}
        {activeTab === 'task' && (
          <form 
            onSubmit={handleTaskSubmit} 
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') {
                e.preventDefault();
              }
            }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-indigo-600" />
                  Registro de Nueva Tarea
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">Asigna entregables a proyectos específicos con fechas de cumplimiento</p>
              </div>
              <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-semibold">
                Proyectos disponibles: {projects.length}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1.5">Proyecto Asignado *</label>
                <select
                  required
                  value={taskForm.project_id}
                  onChange={(e) => setTaskForm({ ...taskForm, project_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none font-semibold text-gray-800"
                >
                  <option value="">Selecciona un proyecto...</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1.5">Responsable / Dueño de la Tarea</label>
                <select
                  value={taskForm.owner_id}
                  onChange={(e) => setTaskForm({ ...taskForm, owner_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                >
                  <option value="">Sin asignar</option>
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-gray-700 mb-1.5">Título / Descripción de la Tarea *</label>
                <input
                  type="text"
                  required
                  value={taskForm.name}
                  onChange={(e) => setTaskForm({ ...taskForm, name: e.target.value })}
                  placeholder="Ej. Realizar pruebas de integración, diseñar interfaz de reportes..."
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1.5">Estado</label>
                  <select
                    value={taskForm.status}
                    onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  >
                    <option value="No iniciado">No iniciado</option>
                    <option value="En progreso">En progreso</option>
                    <option value="Completado">Completado</option>
                    <option value="En espera">En espera</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1.5">Prioridad</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as Priority })}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  >
                    <option value="Urgente">Urgente</option>
                    <option value="Dificil">Dificil</option>
                    <option value="Medio">Medio</option>
                    <option value="Fácil">Fácil</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1.5">Fecha de Inicio</label>
                  <input
                    type="date"
                    value={taskForm.start_date}
                    onChange={(e) => setTaskForm({ ...taskForm, start_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1.5">Fecha Límite (Fin)</label>
                  <input
                    type="date"
                    value={taskForm.end_date}
                    onChange={(e) => setTaskForm({ ...taskForm, end_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-gray-700 mb-1.5">Notas y Criterios de Aceptación</label>
                <textarea
                  rows={3}
                  value={taskForm.notes}
                  onChange={(e) => setTaskForm({ ...taskForm, notes: e.target.value })}
                  placeholder="Detalles sobre entregables, enlaces de referencia..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-2 text-xs"
              >
                <Plus className="w-4 h-4" />
                Guardar Tarea
              </button>
            </div>
          </form>
        )}

        {/* ================= MEETING FORM ================= */}
        {activeTab === 'meeting' && (
          <form 
            onSubmit={handleMeetingSubmit} 
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') {
                e.preventDefault();
              }
            }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  Agendar Nueva Reunión o Comité
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">Programa sesiones de alineación, comités directivos y seguimiento</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1.5">Proyecto Relacionado *</label>
                <select
                  required
                  value={meetingForm.project_id}
                  onChange={(e) => setMeetingForm({ ...meetingForm, project_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                >
                  <option value="">Selecciona un proyecto...</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1.5">Tipo de Sesión</label>
                <select
                  value={meetingForm.meeting_type}
                  onChange={(e) => setMeetingForm({ ...meetingForm, meeting_type: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                >
                  {meetingTypes.map((t, idx) => (
                    <option key={idx} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-gray-700 mb-1.5">Nombre / Título de la Reunión *</label>
                <input
                  type="text"
                  required
                  value={meetingForm.name}
                  onChange={(e) => setMeetingForm({ ...meetingForm, name: e.target.value })}
                  placeholder="Ej. Comité Directivo de Avance Mensual, Revisión de Entregables..."
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1.5">Fecha y Hora *</label>
                <input
                  type="datetime-local"
                  required
                  value={meetingForm.meeting_date}
                  onChange={(e) => setMeetingForm({ ...meetingForm, meeting_date: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1.5">Participantes / Asistentes</label>
                <input
                  type="text"
                  value={meetingForm.attendees}
                  onChange={(e) => setMeetingForm({ ...meetingForm, attendees: e.target.value })}
                  placeholder="Ej. Dirección General, Líderes de Proyecto, Consultores..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-gray-700 mb-1.5">Agenda / Notas Previas</label>
                <textarea
                  rows={3}
                  value={meetingForm.notes}
                  onChange={(e) => setMeetingForm({ ...meetingForm, notes: e.target.value })}
                  placeholder="Temas a tratar, preparación requerida, enlaces a salas virtuales..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-2 text-xs"
              >
                <Plus className="w-4 h-4" />
                Agendar Sesión
              </button>
            </div>
          </form>
        )}

        {/* ================= TEAM FORM ================= */}
        {activeTab === 'team' && (
          <form 
            onSubmit={handleTeamSubmit} 
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') {
                e.preventDefault();
              }
            }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Agregar Integrante al Directorio de Equipo
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">Registra consultores, líderes de área y responsables para la matriz RACI</p>
              </div>
              <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-semibold">
                Total miembros: {teamMembers.length}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div className="md:col-span-2">
                <label className="block font-bold text-gray-700 mb-1.5">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={teamForm.name}
                  onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                  placeholder="Ej. Sofía Hernández, Carlos Morales..."
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1.5">Rol / Cargo</label>
                <select
                  value={teamForm.role}
                  onChange={(e) => setTeamForm({ ...teamForm, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                >
                  {teamRoles.map((r, idx) => (
                    <option key={idx} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1.5">Notas / Especialidad / Correo</label>
                <input
                  type="text"
                  value={teamForm.notes}
                  onChange={(e) => setTeamForm({ ...teamForm, notes: e.target.value })}
                  placeholder="Ej. Especialista en finanzas, lider.proyecto@empresa.com"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-2 text-xs"
              >
                <Plus className="w-4 h-4" />
                Registrar Integrante
              </button>
            </div>
          </form>
        )}

        {/* ================= COMM FORM ================= */}
        {activeTab === 'comm' && (
          <form 
            onSubmit={handleCommSubmit} 
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') {
                e.preventDefault();
              }
            }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                  Registrar Interacción / Minuta de Comunicación
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">Lleva una bitácora auditable de acuerdos con clientes y partes interesadas</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1.5">Proyecto Asignado *</label>
                <select
                  required
                  value={commForm.project_id}
                  onChange={(e) => setCommForm({ ...commForm, project_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                >
                  <option value="">Selecciona un proyecto...</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1.5">Medio de Comunicación</label>
                <select
                  value={commForm.comm_type}
                  onChange={(e) => setCommForm({ ...commForm, comm_type: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                >
                  {commTypes.map((t, idx) => (
                    <option key={idx} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1.5">Fecha y Hora</label>
                <input
                  type="datetime-local"
                  required
                  value={commForm.comm_date}
                  onChange={(e) => setCommForm({ ...commForm, comm_date: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1.5">Resultado o Acuerdo Principal</label>
                <input
                  type="text"
                  value={commForm.outcome}
                  onChange={(e) => setCommForm({ ...commForm, outcome: e.target.value })}
                  placeholder="Ej. Aprobación de entregable, cambio de alcance pactado..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-gray-700 mb-1.5">Minuta y Notas Detalladas</label>
                <textarea
                  rows={3}
                  value={commForm.notes}
                  onChange={(e) => setCommForm({ ...commForm, notes: e.target.value })}
                  placeholder="Puntos tratados, compromisos adquiridos, siguientes pasos..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-2 text-xs"
              >
                <Plus className="w-4 h-4" />
                Registrar Bitácora
              </button>
            </div>
          </form>
        )}

        {/* ================= INVOICE FORM ================= */}
        {activeTab === 'invoice' && (
          <form 
            onSubmit={handleInvoiceSubmit} 
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') {
                e.preventDefault();
              }
            }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                  Registro de Factura y Cobranza
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">Controla folios, montos, fechas de vencimiento y estado de pago</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1.5">Proyecto Asignado *</label>
                <select
                  required
                  value={invoiceForm.project_id}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, project_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                >
                  <option value="">Selecciona un proyecto...</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1.5">Folio / Número de Factura *</label>
                <input
                  type="text"
                  required
                  value={invoiceForm.invoice_number}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, invoice_number: e.target.value })}
                  placeholder="Ej. FAC-2026-001"
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1.5">Monto ($) *</label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <span className="text-gray-500 font-bold text-sm">$</span>
                  </div>
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    value={invoiceForm.amount ? invoiceForm.amount.toLocaleString('en-US') : ''}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, '');
                      const num = raw === '' ? 0 : parseInt(raw, 10);
                      setInvoiceForm({ ...invoiceForm, amount: num });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                      }
                    }}
                    placeholder="0.00"
                    className="w-full pl-8 pr-12 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none font-bold text-gray-900 tabular-nums"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">USD</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1.5">Estado de Cobro</label>
                <select
                  value={invoiceForm.status}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, status: e.target.value as InvoiceStatus })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                >
                  <option value="Aún no enviado">Aún no enviado</option>
                  <option value="Enviada">Enviada</option>
                  <option value="Pagada">Pagada</option>
                  <option value="Atrasada">Atrasada</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 md:col-span-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1.5">Fecha de Emisión</label>
                  <input
                    type="date"
                    value={invoiceForm.sent_date}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, sent_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1.5">Fecha de Vencimiento</label>
                  <input
                    type="date"
                    value={invoiceForm.due_date}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-gray-700 mb-1.5">Notas de Facturación</label>
                <textarea
                  rows={2}
                  value={invoiceForm.notes}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                  placeholder="Condiciones de pago, cuenta bancaria, contacto..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-2 text-xs"
              >
                <Plus className="w-4 h-4" />
                Registrar Factura
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
