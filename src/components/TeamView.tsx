import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { TeamMember, Project } from '../types';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Search, 
  Filter, 
  Copy, 
  Check, 
  Layers, 
  UserCheck, 
  SlidersHorizontal,
  ChevronRight,
  Briefcase,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';

type TabView = 'matrix' | 'by-consultant' | 'directory';
type RaciRole = 'R' | 'A' | 'C' | 'I' | null;

export default function TeamView() {
  const { teamMembers, projects, tasks, addTeamMember, updateTeamMember, deleteTeamMember, updateProject } = useData();
  
  const [currentTab, setCurrentTab] = useState<TabView>('matrix');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [onlyGovernanceGaps, setOnlyGovernanceGaps] = useState(false);
  const [copiedMatrix, setCopiedMatrix] = useState(false);

  // Modals
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [isQuickAssignModalOpen, setIsQuickAssignModalOpen] = useState(false);
  const [selectedProjectForRaci, setSelectedProjectForRaci] = useState<Project | null>(null);

  // Cell popover for quick role toggle
  const [activeCell, setActiveCell] = useState<{ projectId: string; memberId: string } | null>(null);

  // Member Form
  const [memberFormData, setMemberFormData] = useState({
    name: '',
    role: 'Líder de Proyecto',
    notes: '',
  });

  const roles = [
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

  // Helper to determine RACI role for a given project & member
  const getRaciRole = (project: Project, memberId: string): RaciRole => {
    if (project.responsible_id === memberId) return 'R';
    if (project.accountable_id === memberId) return 'A';
    if (project.consulted_id === memberId) return 'C';
    if (project.informed_id === memberId) return 'I';
    return null;
  };

  // Helper to set RACI role
  const handleSetRaciRole = async (projectId: string, memberId: string, role: RaciRole) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const updates: Partial<Project> = {};

    // Remove member from current roles if assigned
    if (project.responsible_id === memberId) updates.responsible_id = '';
    if (project.accountable_id === memberId) updates.accountable_id = '';
    if (project.consulted_id === memberId) updates.consulted_id = '';
    if (project.informed_id === memberId) updates.informed_id = '';

    // Assign new role
    if (role === 'R') updates.responsible_id = memberId;
    if (role === 'A') updates.accountable_id = memberId;
    if (role === 'C') updates.consulted_id = memberId;
    if (role === 'I') updates.informed_id = memberId;

    await updateProject(projectId, updates);
    setActiveCell(null);
  };

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    projects.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [projects]);

  // Governance analysis
  const governanceStats = useMemo(() => {
    let complete = 0;
    let missingR = 0;
    let missingA = 0;
    let total = projects.length;

    projects.forEach(p => {
      const hasR = Boolean(p.responsible_id);
      const hasA = Boolean(p.accountable_id);

      if (hasR && hasA) complete++;
      if (!hasR) missingR++;
      if (!hasA) missingA++;
    });

    const healthPct = total > 0 ? Math.round((complete / total) * 100) : 100;
    return { complete, missingR, missingA, total, healthPct };
  }, [projects]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
      
      const hasGap = !p.responsible_id || !p.accountable_id;
      const matchesGap = !onlyGovernanceGaps || hasGap;

      return matchesSearch && matchesCategory && matchesStatus && matchesGap;
    });
  }, [projects, searchTerm, categoryFilter, statusFilter, onlyGovernanceGaps]);

  // Member CRUD handlers
  const handleOpenAddMember = () => {
    setEditingMember(null);
    setMemberFormData({
      name: '',
      role: 'Líder de Proyecto',
      notes: '',
    });
    setIsMemberModalOpen(true);
  };

  const handleOpenEditMember = (m: TeamMember) => {
    setEditingMember(m);
    setMemberFormData({
      name: m.name,
      role: m.role || 'Líder de Proyecto',
      notes: m.notes || '',
    });
    setIsMemberModalOpen(true);
  };

  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberFormData.name.trim()) return;
    if (editingMember) {
      await updateTeamMember(editingMember.id, memberFormData);
    } else {
      await addTeamMember(memberFormData);
    }
    setIsMemberModalOpen(false);
  };

  // Copy Markdown RACI Table
  const handleCopyMarkdown = () => {
    let md = `| Iniciativa Estratégica | Responsable (R) | Aprobador (A) | Consultado (C) | Informado (I) |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- |\n`;

    projects.forEach(p => {
      const r = teamMembers.find(m => m.id === p.responsible_id)?.name || 'Sin Asignar';
      const a = teamMembers.find(m => m.id === p.accountable_id)?.name || 'Sin Asignar';
      const c = teamMembers.find(m => m.id === p.consulted_id)?.name || '-';
      const i = teamMembers.find(m => m.id === p.informed_id)?.name || '-';
      md += `| ${p.name} | **${r}** | **${a}** | ${c} | ${i} |\n`;
    });

    navigator.clipboard.writeText(md);
    setCopiedMatrix(true);
    setTimeout(() => setCopiedMatrix(false), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-200 uppercase tracking-wider">
              Gobernanza & Roles
            </span>
            <span className="text-[10px] font-semibold text-slate-500">
              CSEA Matriz de Responsabilidades
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center mt-1">
            <ShieldCheck className="w-6 h-6 mr-2 text-orange-600" />
            Matriz RACI & Directorio de Equipo
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Asignación de roles ejecutivos: Responsable (R), Accountable (A), Consultado (C) e Informado (I)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyMarkdown}
            className="inline-flex items-center px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 transition-all shadow-xs active:scale-95"
            title="Copiar matriz en formato tabla Markdown"
          >
            {copiedMatrix ? <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1.5 text-slate-500" />}
            {copiedMatrix ? 'Copiada al Portapapeles' : 'Copiar Tabla Markdown'}
          </button>

          <button
            onClick={handleOpenAddMember}
            className="inline-flex items-center px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-all shadow-xs active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Nuevo Consultor
          </button>
        </div>
      </div>

      {/* RACI Definition Legend & Governance KPI Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: RACI Code Legend */}
        <div className="lg:col-span-8 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
              Guía de Roles RACI Capricorn
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Regla: Cada iniciativa debe tener 1 A y al menos 1 R</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            {/* R */}
            <div className="p-2.5 rounded-lg bg-orange-50/80 border border-orange-200">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-5 h-5 rounded-md bg-orange-600 text-white flex items-center justify-center font-extrabold text-xs shadow-xs">
                  R
                </span>
                <span className="text-xs font-bold text-orange-950">Responsable</span>
              </div>
              <p className="text-[11px] text-orange-900/90 leading-tight">
                <strong>Quien ejecuta</strong> y entrega las actividades del proyecto directamente.
              </p>
            </div>

            {/* A */}
            <div className="p-2.5 rounded-lg bg-indigo-50/80 border border-indigo-200">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-5 h-5 rounded-md bg-indigo-700 text-white flex items-center justify-center font-extrabold text-xs shadow-xs">
                  A
                </span>
                <span className="text-xs font-bold text-indigo-950">Accountable</span>
              </div>
              <p className="text-[11px] text-indigo-900/90 leading-tight">
                <strong>Autoridad única</strong> que aprueba y rinde cuentas del resultado final.
              </p>
            </div>

            {/* C */}
            <div className="p-2.5 rounded-lg bg-teal-50/80 border border-teal-200">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-5 h-5 rounded-md bg-teal-700 text-white flex items-center justify-center font-extrabold text-xs shadow-xs">
                  C
                </span>
                <span className="text-xs font-bold text-teal-950">Consultado</span>
              </div>
              <p className="text-[11px] text-teal-900/90 leading-tight">
                <strong>Experto</strong> que aporta insumos y opinión técnica previa a la decisión.
              </p>
            </div>

            {/* I */}
            <div className="p-2.5 rounded-lg bg-slate-100/90 border border-slate-300">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-5 h-5 rounded-md bg-slate-700 text-white flex items-center justify-center font-extrabold text-xs shadow-xs">
                  I
                </span>
                <span className="text-xs font-bold text-slate-900">Informado</span>
              </div>
              <p className="text-[11px] text-slate-700 leading-tight">
                <strong>Stakeholder</strong> que recibe avances y minutas de forma unidireccional.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Governance Health Stats */}
        <div className="lg:col-span-4 bg-[#0f172a] text-white p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Salud de Gobernanza RACI</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
              governanceStats.healthPct >= 80 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {governanceStats.healthPct}% Alineado
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 my-2">
            <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/60 text-center">
              <span className="text-[9px] text-slate-400 block font-semibold">Completos</span>
              <span className="text-base font-extrabold text-emerald-400">{governanceStats.complete}</span>
            </div>
            <div className={`p-2 rounded-lg border text-center ${governanceStats.missingR > 0 ? 'bg-orange-950/40 border-orange-500/40 text-orange-300' : 'bg-slate-800/80 border-slate-700/60 text-slate-400'}`}>
              <span className="text-[9px] block font-semibold">Sin 'R'</span>
              <span className="text-base font-extrabold">{governanceStats.missingR}</span>
            </div>
            <div className={`p-2 rounded-lg border text-center ${governanceStats.missingA > 0 ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300' : 'bg-slate-800/80 border-slate-700/60 text-slate-400'}`}>
              <span className="text-[9px] block font-semibold">Sin 'A'</span>
              <span className="text-base font-extrabold">{governanceStats.missingA}</span>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 leading-tight">
            {governanceStats.missingR === 0 && governanceStats.missingA === 0
              ? '✓ Todas las iniciativas tienen Responsable (R) y Aprobador (A) asignados.'
              : `⚠️ Existen ${governanceStats.missingR + governanceStats.missingA} brechas de asignación en el portafolio.`}
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setCurrentTab('matrix')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center space-x-2 transition-colors ${
            currentTab === 'matrix'
              ? 'border-orange-600 text-orange-600 bg-orange-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Matriz RACI Interactiva ({projects.length})</span>
        </button>

        <button
          onClick={() => setCurrentTab('by-consultant')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center space-x-2 transition-colors ${
            currentTab === 'by-consultant'
              ? 'border-orange-600 text-orange-600 bg-orange-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Carga por Consultor ({teamMembers.length})</span>
        </button>

        <button
          onClick={() => setCurrentTab('directory')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center space-x-2 transition-colors ${
            currentTab === 'directory'
              ? 'border-orange-600 text-orange-600 bg-orange-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Directorio de Equipo</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: INTERACTIVE RACI MATRIX (HIGH LEGIBILITY)                          */}
      {/* ========================================================================= */}
      {currentTab === 'matrix' && (
        <div className="space-y-4">
          {/* Controls & Filter Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar iniciativa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              {/* Category */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-orange-500 text-slate-700 font-semibold"
              >
                <option value="ALL">Todas las Categorías</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Status */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-orange-500 text-slate-700 font-semibold"
              >
                <option value="ALL">Todos los Estados</option>
                <option value="No iniciado">No iniciado</option>
                <option value="En curso">En curso</option>
                <option value="Completado">Completado</option>
                <option value="En espera">En espera</option>
              </select>

              {/* Toggle Governance Gaps */}
              <button
                onClick={() => setOnlyGovernanceGaps(!onlyGovernanceGaps)}
                className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-colors ${
                  onlyGovernanceGaps
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-slate-50 text-slate-600 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Solo con Brecha (Sin R o Sin A)</span>
              </button>
            </div>

            <div className="text-xs font-semibold text-slate-500">
              Mostrando {filteredProjects.length} de {projects.length} iniciativas
            </div>
          </div>

          {/* Interactive Matrix Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0f172a] text-white">
                    {/* Left Sticky Header: Project Info */}
                    <th className="sticky left-0 z-20 bg-[#0f172a] px-4 py-3.5 min-w-[260px] max-w-[320px] font-bold text-[11px] uppercase tracking-wider text-slate-200 shadow-xs">
                      Iniciativa Estratégica
                    </th>
                    <th className="px-3 py-3.5 font-bold text-[10px] uppercase tracking-wider text-slate-300 whitespace-nowrap text-center">
                      Estado
                    </th>
                    <th className="px-3 py-3.5 font-bold text-[10px] uppercase tracking-wider text-slate-300 whitespace-nowrap text-center">
                      Prioridad
                    </th>

                    {/* Team Members Columns */}
                    {teamMembers.map((member) => (
                      <th
                        key={member.id}
                        className="px-3 py-3 font-bold text-[11px] text-center border-l border-slate-700 min-w-[120px] max-w-[150px]"
                      >
                        <div className="flex flex-col items-center">
                          <div className="w-7 h-7 rounded-full bg-slate-800 text-orange-400 border border-slate-700 flex items-center justify-center font-bold text-[10px] mb-1">
                            {member.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-white font-bold truncate max-w-[120px]" title={member.name}>
                            {member.name}
                          </span>
                          <span className="text-[9px] text-slate-400 font-normal truncate max-w-[120px]">
                            {member.role || 'Consultor'}
                          </span>
                        </div>
                      </th>
                    ))}

                    <th className="px-3 py-3.5 font-bold text-[10px] uppercase tracking-wider text-slate-300 text-right whitespace-nowrap border-l border-slate-700">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredProjects.map((project, idx) => {
                    const hasR = Boolean(project.responsible_id);
                    const hasA = Boolean(project.accountable_id);
                    const isFullyAssigned = hasR && hasA;

                    return (
                      <tr 
                        key={project.id} 
                        className={`hover:bg-slate-50/80 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'}`}
                      >
                        {/* Sticky Left Column: Project Name & Category */}
                        <td className="sticky left-0 z-10 bg-inherit px-4 py-3 border-r border-slate-200">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              {!isFullyAssigned && (
                                <span className="p-0.5 rounded bg-amber-100 text-amber-800" title="Falta asignar R o A">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                </span>
                              )}
                              <span className="font-bold text-slate-900 text-xs leading-snug">
                                {project.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px]">
                              {project.category && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                                  {project.category}
                                </span>
                              )}
                              <span className="text-slate-400 font-mono">
                                Avance: {project.progress_percentage}%
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            project.status === 'Completado' ? 'bg-emerald-100 text-emerald-800' :
                            project.status === 'En curso' ? 'bg-blue-100 text-blue-800' :
                            project.status === 'En espera' ? 'bg-amber-100 text-amber-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {project.status}
                          </span>
                        </td>

                        {/* Priority */}
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            project.priority === 'Urgente' ? 'bg-red-100 text-red-800' :
                            project.priority === 'Dificil' ? 'bg-orange-100 text-orange-800' :
                            project.priority === 'Medio' ? 'bg-amber-100 text-amber-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {project.priority}
                          </span>
                        </td>

                        {/* RACI Matrix Cells */}
                        {teamMembers.map((member) => {
                          const role = getRaciRole(project, member.id);
                          const isPopoverOpen = activeCell?.projectId === project.id && activeCell?.memberId === member.id;

                          return (
                            <td
                              key={member.id}
                              className="px-2 py-2 text-center border-l border-slate-200 relative"
                            >
                              <div className="flex items-center justify-center">
                                {role ? (
                                  <button
                                    onClick={() => setActiveCell(isPopoverOpen ? null : { projectId: project.id, memberId: member.id })}
                                    className={`w-8 h-8 rounded-lg font-extrabold text-sm flex items-center justify-center transition-transform hover:scale-110 shadow-xs cursor-pointer ${
                                      role === 'R' ? 'bg-orange-600 text-white ring-2 ring-orange-200' :
                                      role === 'A' ? 'bg-indigo-700 text-white ring-2 ring-indigo-200' :
                                      role === 'C' ? 'bg-teal-700 text-white ring-2 ring-teal-200' :
                                      'bg-slate-600 text-white ring-2 ring-slate-200'
                                    }`}
                                    title={`Click para cambiar rol (${role})`}
                                  >
                                    {role}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => setActiveCell(isPopoverOpen ? null : { projectId: project.id, memberId: member.id })}
                                    className="w-7 h-7 rounded-md border border-dashed border-slate-300 text-slate-300 hover:border-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center text-xs transition-colors"
                                    title="Click para asignar rol RACI"
                                  >
                                    -
                                  </button>
                                )}
                              </div>

                              {/* Role Selector Popover */}
                              {isPopoverOpen && (
                                <div className="absolute z-30 top-full left-1/2 -translate-x-1/2 mt-1 bg-[#0f172a] text-white p-2 rounded-xl shadow-xl border border-slate-700 w-36 flex flex-col gap-1 text-left animate-fade-in">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-1">
                                    Asignar Rol:
                                  </span>
                                  <button
                                    onClick={() => handleSetRaciRole(project.id, member.id, 'R')}
                                    className={`px-2 py-1 rounded text-xs font-bold flex items-center justify-between hover:bg-orange-600 transition-colors ${role === 'R' ? 'bg-orange-600 text-white' : 'text-slate-200'}`}
                                  >
                                    <span>R - Responsable</span>
                                    {role === 'R' && <Check className="w-3 h-3" />}
                                  </button>
                                  <button
                                    onClick={() => handleSetRaciRole(project.id, member.id, 'A')}
                                    className={`px-2 py-1 rounded text-xs font-bold flex items-center justify-between hover:bg-indigo-600 transition-colors ${role === 'A' ? 'bg-indigo-600 text-white' : 'text-slate-200'}`}
                                  >
                                    <span>A - Accountable</span>
                                    {role === 'A' && <Check className="w-3 h-3" />}
                                  </button>
                                  <button
                                    onClick={() => handleSetRaciRole(project.id, member.id, 'C')}
                                    className={`px-2 py-1 rounded text-xs font-bold flex items-center justify-between hover:bg-teal-600 transition-colors ${role === 'C' ? 'bg-teal-600 text-white' : 'text-slate-200'}`}
                                  >
                                    <span>C - Consultado</span>
                                    {role === 'C' && <Check className="w-3 h-3" />}
                                  </button>
                                  <button
                                    onClick={() => handleSetRaciRole(project.id, member.id, 'I')}
                                    className={`px-2 py-1 rounded text-xs font-bold flex items-center justify-between hover:bg-slate-700 transition-colors ${role === 'I' ? 'bg-slate-700 text-white' : 'text-slate-200'}`}
                                  >
                                    <span>I - Informado</span>
                                    {role === 'I' && <Check className="w-3 h-3" />}
                                  </button>
                                  <button
                                    onClick={() => handleSetRaciRole(project.id, member.id, null)}
                                    className="px-2 py-1 rounded text-xs font-semibold text-red-400 hover:bg-red-950/60 transition-colors border-t border-slate-700 mt-0.5"
                                  >
                                    Desasignar Rol
                                  </button>
                                </div>
                              )}
                            </td>
                          );
                        })}

                        {/* Quick Project Config */}
                        <td className="px-3 py-3 text-right whitespace-nowrap border-l border-slate-200">
                          <button
                            onClick={() => {
                              setSelectedProjectForRaci(project);
                              setIsQuickAssignModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors inline-flex items-center gap-1"
                          >
                            <SlidersHorizontal className="w-3 h-3 text-slate-500" />
                            Ajustar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredProjects.length === 0 && (
                    <tr>
                      <td colSpan={4 + teamMembers.length} className="py-12 text-center text-slate-400 text-xs">
                        No se encontraron iniciativas con los filtros seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CONSULTANT WORKLOAD BREAKDOWN                                       */}
      {/* ========================================================================= */}
      {currentTab === 'by-consultant' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamMembers.map((member) => {
            const asR = projects.filter(p => p.responsible_id === member.id);
            const asA = projects.filter(p => p.accountable_id === member.id);
            const asC = projects.filter(p => p.consulted_id === member.id);
            const asI = projects.filter(p => p.informed_id === member.id);
            const memberTasks = tasks.filter(t => t.owner_id === member.id);
            const completedTasks = memberTasks.filter(t => t.is_done || t.status === 'Completado').length;

            return (
              <div key={member.id} className="bg-white rounded-xl p-4.5 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
                <div className="space-y-3.5">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-[#0f172a] text-orange-400 flex items-center justify-center font-extrabold text-sm shadow-xs">
                        {member.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 leading-tight">{member.name}</h3>
                        <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 mt-0.5 inline-block">
                          {member.role || 'Consultor'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Badges */}
                  <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-1.5">
                      <span className="text-[9px] font-extrabold text-orange-800 uppercase block">R</span>
                      <span className="text-sm font-extrabold text-orange-950">{asR.length}</span>
                    </div>
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-1.5">
                      <span className="text-[9px] font-extrabold text-indigo-800 uppercase block">A</span>
                      <span className="text-sm font-extrabold text-indigo-950">{asA.length}</span>
                    </div>
                    <div className="bg-teal-50 border border-teal-200 rounded-lg p-1.5">
                      <span className="text-[9px] font-extrabold text-teal-800 uppercase block">C</span>
                      <span className="text-sm font-extrabold text-teal-950">{asC.length}</span>
                    </div>
                    <div className="bg-slate-100 border border-slate-200 rounded-lg p-1.5">
                      <span className="text-[9px] font-extrabold text-slate-700 uppercase block">I</span>
                      <span className="text-sm font-extrabold text-slate-900">{asI.length}</span>
                    </div>
                  </div>

                  {/* Responsible Projects List */}
                  {asR.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-orange-800 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-orange-600"></span>
                        Responsable de Ejecución ({asR.length})
                      </span>
                      <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                        {asR.map(p => (
                          <div key={p.id} className="text-[11px] bg-slate-50 p-1.5 rounded border border-slate-200 flex items-center justify-between">
                            <span className="font-semibold text-slate-800 truncate">{p.name}</span>
                            <span className="text-[9px] font-mono text-slate-500 shrink-0">{p.progress_percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Accountable Projects List */}
                  {asA.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                        Aprobador / Dueño Final ({asA.length})
                      </span>
                      <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                        {asA.map(p => (
                          <div key={p.id} className="text-[11px] bg-slate-50 p-1.5 rounded border border-slate-200 flex items-center justify-between">
                            <span className="font-semibold text-slate-800 truncate">{p.name}</span>
                            <span className="text-[9px] font-bold text-indigo-700 shrink-0">{p.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Deliverables / Tasks */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span className="text-[11px]">Entregables asignados:</span>
                    <span className="font-bold text-slate-900">{memberTasks.length} ({completedTasks} completados)</span>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-mono">ID: {member.id.slice(0, 8)}</span>
                  <button
                    onClick={() => handleOpenEditMember(member)}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700"
                  >
                    Editar Perfil
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TEAM DIRECTORY                                                     */}
      {/* ========================================================================= */}
      {currentTab === 'directory' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamMembers.map((member) => (
              <div key={member.id} className="bg-white rounded-xl p-4.5 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-[#0f172a] text-orange-400 flex items-center justify-center font-bold text-sm shadow-xs">
                      {member.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">{member.name}</h3>
                      <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 mt-0.5 inline-block">
                        {member.role || 'Consultor'}
                      </span>
                    </div>
                  </div>

                  {member.notes && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {member.notes}
                    </p>
                  )}
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-mono">ID: {member.id.slice(0, 8)}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditMember(member)}
                      className="p-1 text-slate-400 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors"
                      title="Editar consultor"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteTeamMember(member.id)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100 transition-colors"
                      title="Eliminar consultor"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* QUICK ASSIGN RACI MODAL FOR A PROJECT                                     */}
      {/* ========================================================================= */}
      {isQuickAssignModalOpen && selectedProjectForRaci && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-300 p-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600">Ajuste de Gobernanza</span>
                <h2 className="text-sm font-bold text-slate-900 truncate max-w-sm">
                  {selectedProjectForRaci.name}
                </h2>
              </div>
              <button onClick={() => setIsQuickAssignModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* R */}
              <div>
                <label className="block text-[11px] font-bold text-orange-950 mb-1 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-orange-600 text-white flex items-center justify-center text-[10px] font-extrabold">R</span>
                  Responsable (Ejecuta) *
                </label>
                <select
                  value={selectedProjectForRaci.responsible_id || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedProjectForRaci({ ...selectedProjectForRaci, responsible_id: val });
                    updateProject(selectedProjectForRaci.id, { responsible_id: val });
                  }}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-orange-500 font-medium"
                >
                  <option value="">-- Sin Responsable asignado --</option>
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                  ))}
                </select>
              </div>

              {/* A */}
              <div>
                <label className="block text-[11px] font-bold text-indigo-950 mb-1 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-indigo-700 text-white flex items-center justify-center text-[10px] font-extrabold">A</span>
                  Accountable (Aprueba / Dueño) *
                </label>
                <select
                  value={selectedProjectForRaci.accountable_id || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedProjectForRaci({ ...selectedProjectForRaci, accountable_id: val });
                    updateProject(selectedProjectForRaci.id, { accountable_id: val });
                  }}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 font-medium"
                >
                  <option value="">-- Sin Aprobador asignado --</option>
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                  ))}
                </select>
              </div>

              {/* C */}
              <div>
                <label className="block text-[11px] font-bold text-teal-950 mb-1 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-teal-700 text-white flex items-center justify-center text-[10px] font-extrabold">C</span>
                  Consultado (Aporta insumos técnicos)
                </label>
                <select
                  value={selectedProjectForRaci.consulted_id || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedProjectForRaci({ ...selectedProjectForRaci, consulted_id: val });
                    updateProject(selectedProjectForRaci.id, { consulted_id: val });
                  }}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-500 font-medium"
                >
                  <option value="">-- Sin Consultado --</option>
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                  ))}
                </select>
              </div>

              {/* I */}
              <div>
                <label className="block text-[11px] font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-slate-700 text-white flex items-center justify-center text-[10px] font-extrabold">I</span>
                  Informado (Recibe reportes)
                </label>
                <select
                  value={selectedProjectForRaci.informed_id || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedProjectForRaci({ ...selectedProjectForRaci, informed_id: val });
                    updateProject(selectedProjectForRaci.id, { informed_id: val });
                  }}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-500 font-medium"
                >
                  <option value="">-- Sin Informado --</option>
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsQuickAssignModalOpen(false)}
                  className="px-4 py-1.5 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  Cerrar y Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD / EDIT MEMBER MODAL                                                    */}
      {/* ========================================================================= */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-300 p-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-600" />
                {editingMember ? 'Editar Consultor' : 'Registrar Nuevo Consultor'}
              </h2>
              <button onClick={() => setIsMemberModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleMemberSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={memberFormData.name}
                  onChange={(e) => setMemberFormData({ ...memberFormData, name: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-orange-500 focus:outline-none text-xs"
                  placeholder="Ej. Sofía Hernández"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">Rol / Cargo</label>
                <select
                  value={memberFormData.role}
                  onChange={(e) => setMemberFormData({ ...memberFormData, role: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-orange-500 focus:outline-none"
                >
                  {roles.map((r, idx) => (
                    <option key={idx} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">Especialidad / Perfil</label>
                <textarea
                  rows={2}
                  value={memberFormData.notes}
                  onChange={(e) => setMemberFormData({ ...memberFormData, notes: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-orange-500 focus:outline-none"
                  placeholder="Áreas de especialidad, experiencia..."
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMemberModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-xs"
                >
                  {editingMember ? 'Guardar Cambios' : 'Registrar Consultor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
