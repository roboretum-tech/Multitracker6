import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { 
  Project, 
  Task, 
  ProjectDecision, 
  ProjectAgreement, 
  ProjectRisk,
  DecisionStatus,
  AgreementStatus,
  RiskSeverityLevel
} from '../types';
import { 
  buildCausalAnalysisForProject, 
  buildPortfolioCausalAnalysis,
  CausalChainBundle 
} from '../utils/causalNetwork';
import { 
  ShieldCheck, 
  FileText, 
  AlertTriangle, 
  GitFork, 
  Plus, 
  Filter, 
  Search, 
  CheckCircle2, 
  Clock, 
  Download, 
  Edit3, 
  Trash2, 
  CheckSquare, 
  ChevronRight, 
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { DecisionModal, AgreementModal, RiskModal } from './RAIDModals';
import RAIDHeatmap from './RAIDHeatmap';
import CausalNetworkGraph from './CausalNetworkGraph';
import { exportToCSV, exportToJSON } from '../utils/exportUtils';

interface RAIDViewProps {
  initialProjectId?: string;
}

export default function RAIDView({ initialProjectId }: RAIDViewProps) {
  const { 
    projects, 
    tasks, 
    decisions = [], 
    agreements = [], 
    risks = [],
    addDecision,
    updateDecision,
    deleteDecision,
    addAgreement,
    updateAgreement,
    deleteAgreement,
    toggleAgreementStatus,
    addRisk,
    updateRisk,
    deleteRisk
  } = useData();

  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || 'ALL');
  const [activeTab, setActiveTab] = useState<'network' | 'decisions' | 'agreements' | 'risks'>('network');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [editingDecision, setEditingDecision] = useState<ProjectDecision | null>(null);

  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false);
  const [editingAgreement, setEditingAgreement] = useState<ProjectAgreement | null>(null);

  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [editingRisk, setEditingRisk] = useState<ProjectRisk | null>(null);

  // Heatmap filtering state
  const [heatmapFilter, setHeatmapFilter] = useState<{ prob: number; imp: number } | null>(null);
  const [selectedHeatmapRisk, setSelectedHeatmapRisk] = useState<ProjectRisk | null>(null);

  // Filtered dataset
  const filteredProjects = selectedProjectId === 'ALL'
    ? projects
    : projects.filter(p => p.id === selectedProjectId);

  const filteredTasks = selectedProjectId === 'ALL'
    ? tasks
    : tasks.filter(t => t.project_id === selectedProjectId);

  const filteredDecisions = selectedProjectId === 'ALL'
    ? decisions
    : decisions.filter(d => d.project_id === selectedProjectId);

  const filteredAgreements = selectedProjectId === 'ALL'
    ? agreements
    : agreements.filter(a => a.project_id === selectedProjectId);

  const filteredRisks = selectedProjectId === 'ALL'
    ? risks
    : risks.filter(r => r.project_id === selectedProjectId);

  // Compute Causal Network Analysis
  const portfolioAnalysis = useMemo(() => {
    return buildPortfolioCausalAnalysis(
      filteredProjects,
      filteredTasks,
      filteredDecisions,
      filteredAgreements,
      filteredRisks
    );
  }, [filteredProjects, filteredTasks, filteredDecisions, filteredAgreements, filteredRisks]);

  const activeProjectAnalysis = useMemo(() => {
    if (selectedProjectId === 'ALL') return null;
    const proj = projects.find(p => p.id === selectedProjectId);
    if (!proj) return null;
    return buildCausalAnalysisForProject(proj, tasks, decisions, agreements, risks);
  }, [selectedProjectId, projects, tasks, decisions, agreements, risks]);

  // Current display chains
  const displayChains = selectedProjectId === 'ALL'
    ? portfolioAnalysis.allChains
    : (activeProjectAnalysis?.chains || []);

  // Search filter across tables
  const searchedDecisions = useMemo(() => {
    if (!searchQuery.trim()) return filteredDecisions;
    const q = searchQuery.toLowerCase();
    return filteredDecisions.filter(d => 
      d.code.toLowerCase().includes(q) ||
      d.title.toLowerCase().includes(q) ||
      d.decision_maker.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q)
    );
  }, [filteredDecisions, searchQuery]);

  const searchedAgreements = useMemo(() => {
    if (!searchQuery.trim()) return filteredAgreements;
    const q = searchQuery.toLowerCase();
    return filteredAgreements.filter(a => 
      a.code.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.responsible_name.toLowerCase().includes(q)
    );
  }, [filteredAgreements, searchQuery]);

  const searchedRisks = useMemo(() => {
    let list = filteredRisks;
    if (heatmapFilter && heatmapFilter.prob > 0 && heatmapFilter.imp > 0) {
      list = list.filter(r => r.probability === heatmapFilter.prob && r.impact === heatmapFilter.imp);
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(r => 
      r.code.toLowerCase().includes(q) ||
      r.title.toLowerCase().includes(q) ||
      r.mitigation_owner.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q)
    );
  }, [filteredRisks, searchQuery, heatmapFilter]);

  // Handler helpers
  const handleExportCSV = () => {
    if (activeTab === 'decisions') {
      exportToCSV('registro-decisiones-csea', filteredDecisions);
    } else if (activeTab === 'agreements') {
      exportToCSV('matriz-acuerdos-csea', filteredAgreements);
    } else if (activeTab === 'risks') {
      exportToCSV('registro-riesgos-seccion8-csea', filteredRisks);
    } else {
      exportToCSV(
        'red-causal-impacto-csea',
        displayChains.map(c => ({
          Proyecto: c.projectName,
          Decision: c.decision?.code || 'N/A',
          Acuerdos: c.agreements.map(a => a.code).join(', '),
          Entregable: c.task?.name || 'N/A',
          RutaCritica: c.isCriticalTask ? 'SI' : 'NO',
          HolguraDias: c.taskSlackDays,
          Riesgos: c.risks.map(r => `${r.code} (${r.severity_level})`).join(', '),
          NivelAmenaza: c.threatLevel,
          Narrativa: c.causalNarrative,
        }))
      );
    }
  };

  const getProjectName = (pId: string) => {
    return projects.find(p => p.id === pId)?.name || 'Proyecto';
  };

  const getTaskName = (tId?: string) => {
    if (!tId) return null;
    return tasks.find(t => t.id === tId)?.name || null;
  };

  const getDecisionName = (dId?: string) => {
    if (!dId) return null;
    const d = decisions.find(dec => dec.id === dId);
    return d ? `[${d.code}] ${d.title}` : null;
  };

  const stats = portfolioAnalysis.portfolioStats;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header & Strategic Brand Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#0f172a] text-orange-500 rounded-lg shadow-xs">
              <GitFork className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600">
                  CSEA v4.0 • GOB / DIS / VIS
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-[10px] text-slate-500 font-medium">
                  Red Causal & RAID Conectado
                </span>
              </div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">
                Gobernanza, Acuerdos y Red Causal de Riesgos
              </h1>
            </div>
          </div>
        </div>

        {/* Global Controls & Creation Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Project Selector */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500 mr-2 shrink-0" />
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setHeatmapFilter(null);
              }}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer text-xs"
            >
              <option value="ALL">Portafolio Consolidado ({projects.length} Proyectos)</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Export button */}
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 border border-slate-200 cursor-pointer"
            title="Exportar vista actual a CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Exportar CSV</span>
          </button>

          {/* Action Menus */}
          <button
            onClick={() => {
              setEditingDecision(null);
              setIsDecisionModalOpen(true);
            }}
            className="px-3 py-1.5 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-orange-400" />
            <span>+ Decisión (GOB)</span>
          </button>

          <button
            onClick={() => {
              setEditingAgreement(null);
              setIsAgreementModalOpen(true);
            }}
            className="px-3 py-1.5 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>+ Acuerdo (DIS)</span>
          </button>

          <button
            onClick={() => {
              setEditingRisk(null);
              setIsRiskModalOpen(true);
            }}
            className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            <span>+ Riesgo (Secc. 8)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row (CSEA Executive View) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Decisiones GOB</span>
            <ShieldCheck className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">{stats.totalDecisions}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            <span className="font-semibold text-amber-700">{stats.pendingDecisions}</span> en revisión
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Acuerdos DIS</span>
            <FileText className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">{stats.totalAgreements}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            <span className="font-semibold text-rose-700">{stats.overdueAgreements}</span> atrasados
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Cumplimiento DIS</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-700">
            {stats.totalAgreements > 0 ? Math.round((stats.completedAgreements / stats.totalAgreements) * 100) : 100}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {stats.completedAgreements} cumplidos formalmente
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Riesgos Activos</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">{stats.totalRisks}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            <span className="font-semibold text-rose-700">{stats.criticalRisks}</span> severidad crítica
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Ruta Crítica Amenazada</span>
            <GitFork className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-bold text-rose-700">{stats.totalThreatenedMilestones}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            cadenas en riesgo de hito
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Índice CSEA</span>
            <Activity className="w-4 h-4 text-blue-900" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            {stats.avgGobScore} <span className="text-xs font-normal text-slate-400">GOB</span> / {stats.avgDisScore} <span className="text-xs font-normal text-slate-400">DIS</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            evaluación sobre 100 pts
          </div>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('network')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'network'
                ? 'bg-[#0f172a] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <GitFork className="w-4 h-4 text-orange-400" />
            <span>Red Causal de Impacto ({displayChains.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('decisions')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'decisions'
                ? 'bg-[#0f172a] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-orange-400" />
            <span>Decisiones GOB ({filteredDecisions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('agreements')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'agreements'
                ? 'bg-[#0f172a] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Acuerdos DIS ({filteredAgreements.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('risks')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'risks'
                ? 'bg-[#0f172a] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Riesgos (Secc. 8) ({filteredRisks.length})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por código, texto..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0f172a]/20 focus:border-[#0f172a]"
          />
        </div>
      </div>

      {/* Main Tab Views */}
      {activeTab === 'network' && (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#0f172a] text-orange-400 rounded-lg shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900">Mapeo Causal CSEA v4.0:</span>{' '}
                <span className="text-slate-600">
                  Esta red interconecta las decisiones de gobernanza y acuerdos nominales con los entregables del cronograma (evaluando su holgura en la ruta crítica) y sus riesgos de exposición mitigados.
                </span>
              </div>
            </div>
          </div>

          <CausalNetworkGraph
            chains={displayChains}
            onSelectProject={(pId) => setSelectedProjectId(pId)}
            onOpenDecisionModal={(d) => {
              setEditingDecision(d);
              setIsDecisionModalOpen(true);
            }}
            onOpenAgreementModal={(a) => {
              setEditingAgreement(a);
              setIsAgreementModalOpen(true);
            }}
            onOpenRiskModal={(r) => {
              setEditingRisk(r);
              setIsRiskModalOpen(true);
            }}
          />
        </div>
      )}

      {activeTab === 'decisions' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600">Gobernanza CSEA v4.0</span>
              <h3 className="text-sm font-bold text-slate-900">Registro de Decisiones Estratégicas y Comités (GOB)</h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {searchedDecisions.length} decisiones registradas
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Proyecto</th>
                  <th className="py-3 px-4">Título & Justificación</th>
                  <th className="py-3 px-4">Tomador</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Impacto</th>
                  <th className="py-3 px-4">Entregable Vinculado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {searchedDecisions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 italic">
                      No se encontraron decisiones con los criterios actuales.
                    </td>
                  </tr>
                ) : (
                  searchedDecisions.map(d => {
                    const linkedTask = getTaskName(d.linked_task_id);
                    return (
                      <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                          {d.code}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700 whitespace-nowrap">
                          {getProjectName(d.project_id)}
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <div className="font-bold text-slate-900">{d.title}</div>
                          <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{d.description}</div>
                          {d.justification && (
                            <div className="text-[10px] text-orange-700 italic mt-0.5">
                              Justif: {d.justification}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-700 whitespace-nowrap font-medium">
                          {d.decision_maker}
                        </td>
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                          {d.decision_date}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            d.status === 'Aprobada' ? 'bg-emerald-100 text-emerald-800' :
                            d.status === 'Rechazada' ? 'bg-rose-100 text-rose-800' :
                            d.status === 'En revisión' ? 'bg-blue-100 text-blue-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {d.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            d.impact_level === 'Crítico' ? 'bg-rose-100 text-rose-800' :
                            d.impact_level === 'Alto' ? 'bg-amber-100 text-amber-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {d.impact_level}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          {linkedTask ? (
                            <span className="text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                              {linkedTask}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Sin vincular</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingDecision(d);
                                setIsDecisionModalOpen(true);
                              }}
                              className="p-1 hover:bg-slate-200 text-slate-600 rounded transition-colors cursor-pointer"
                              title="Editar decisión"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`¿Eliminar decisión ${d.code}?`)) {
                                  deleteDecision(d.id);
                                }
                              }}
                              className="p-1 hover:bg-rose-100 text-rose-600 rounded transition-colors cursor-pointer"
                              title="Eliminar decisión"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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

      {activeTab === 'agreements' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Disciplina de Ejecución (DIS)</span>
              <h3 className="text-sm font-bold text-slate-900">Matriz de Acuerdos y Compromisos Formales</h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {searchedAgreements.length} compromisos monitoreados
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  <th className="py-3 px-4">Cumplido</th>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Proyecto</th>
                  <th className="py-3 px-4">Descripción del Compromiso</th>
                  <th className="py-3 px-4">Responsable</th>
                  <th className="py-3 px-4">Fecha Límite</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Prioridad</th>
                  <th className="py-3 px-4">Vínculo Causal</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {searchedAgreements.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400 italic">
                      No se encontraron acuerdos registrados.
                    </td>
                  </tr>
                ) : (
                  searchedAgreements.map(a => {
                    const isDone = a.status === 'Cumplido';
                    const isOverdue = a.status === 'Atrasado';
                    const linkedDec = getDecisionName(a.linked_decision_id);
                    const linkedTask = getTaskName(a.linked_task_id);

                    return (
                      <tr key={a.id} className={`hover:bg-slate-50/70 transition-colors ${isDone ? 'bg-emerald-50/20' : ''}`}>
                        <td className="py-3 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={isDone}
                            onChange={() => toggleAgreementStatus(a.id)}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            title={isDone ? 'Marcar como pendiente' : 'Marcar como cumplido'}
                          />
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                          {a.code}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700 whitespace-nowrap">
                          {getProjectName(a.project_id)}
                        </td>
                        <td className="py-3 px-4 max-w-sm">
                          <div className={`font-semibold text-slate-900 ${isDone ? 'line-through text-slate-400' : ''}`}>
                            {a.description}
                          </div>
                          {a.notes && (
                            <div className="text-[10px] text-slate-500 mt-0.5 italic">
                              Nota: {a.notes}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">
                          {a.responsible_name}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`font-semibold ${isOverdue ? 'text-rose-700 font-bold' : 'text-slate-700'}`}>
                            {a.due_date}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            a.status === 'Cumplido' ? 'bg-emerald-100 text-emerald-800' :
                            a.status === 'Atrasado' ? 'bg-rose-100 text-rose-800 font-bold' :
                            a.status === 'En proceso' ? 'bg-blue-100 text-blue-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {a.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            a.priority === 'Alta' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            a.priority === 'Media' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-slate-50 text-slate-600'
                          }`}>
                            {a.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-xs text-[11px]">
                          {linkedDec && (
                            <div className="text-orange-700 font-medium truncate" title={linkedDec}>
                              {linkedDec}
                            </div>
                          )}
                          {linkedTask && (
                            <div className="text-blue-700 font-medium truncate" title={linkedTask}>
                              Task: {linkedTask}
                            </div>
                          )}
                          {!linkedDec && !linkedTask && (
                            <span className="text-slate-400 italic">Sin vínculo</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingAgreement(a);
                                setIsAgreementModalOpen(true);
                              }}
                              className="p-1 hover:bg-slate-200 text-slate-600 rounded transition-colors cursor-pointer"
                              title="Editar acuerdo"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`¿Eliminar acuerdo ${a.code}?`)) {
                                  deleteAgreement(a.id);
                                }
                              }}
                              className="p-1 hover:bg-rose-100 text-rose-600 rounded transition-colors cursor-pointer"
                              title="Eliminar acuerdo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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

      {activeTab === 'risks' && (
        <div className="space-y-6">
          {/* 5x5 Heatmap Matrix */}
          <RAIDHeatmap
            risks={filteredRisks}
            selectedRiskId={selectedHeatmapRisk?.id}
            onSelectRisk={(r) => setSelectedHeatmapRisk(r)}
            activeCellFilter={heatmapFilter}
            onFilterCell={(prob, imp) => {
              if (prob === 0 && imp === 0) {
                setHeatmapFilter(null);
              } else {
                setHeatmapFilter({ prob, imp });
              }
            }}
          />

          {/* Tabular Risk Register (Sección 8 CSEA Format) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-rose-600">Registro Oficial de Riesgos (CSEA Sección 8)</span>
                <h3 className="text-sm font-bold text-slate-900">Matriz Tabular de Riesgos, Severidad y Mitigación Preventiva</h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {searchedRisks.length} riesgos clasificados
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    <th className="py-3 px-4">Código</th>
                    <th className="py-3 px-4">Proyecto</th>
                    <th className="py-3 px-4">Evento de Riesgo</th>
                    <th className="py-3 px-4">Categoría</th>
                    <th className="py-3 px-4 text-center">P × I</th>
                    <th className="py-3 px-4">Severidad</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4">Estrategia de Mitigación</th>
                    <th className="py-3 px-4">Responsable</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {searchedRisks.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400 italic">
                        No se encontraron riesgos con los filtros actuales.
                      </td>
                    </tr>
                  ) : (
                    searchedRisks.map(r => {
                      const isCritical = r.severity_level === 'Crítico';
                      const linkedTask = getTaskName(r.linked_task_id);

                      return (
                        <tr 
                          key={r.id} 
                          className={`hover:bg-slate-50/70 transition-colors ${
                            selectedHeatmapRisk?.id === r.id ? 'bg-orange-50/50 ring-1 ring-orange-400' : ''
                          }`}
                        >
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                            {r.code}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-700 whitespace-nowrap">
                            {getProjectName(r.project_id)}
                          </td>
                          <td className="py-3 px-4 max-w-sm">
                            <div className="font-bold text-slate-900">{r.title}</div>
                            {r.description && (
                              <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{r.description}</div>
                            )}
                            {linkedTask && (
                              <div className="text-[10px] text-blue-700 font-semibold mt-0.5">
                                Afecta: {linkedTask}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-700 whitespace-nowrap font-medium">
                            {r.category}
                          </td>
                          <td className="py-3 px-4 text-center font-mono whitespace-nowrap">
                            P{r.probability} × I{r.impact}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              r.severity_level === 'Crítico' ? 'bg-rose-100 text-rose-800 font-bold border border-rose-300' :
                              r.severity_level === 'Alto' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                              r.severity_level === 'Medio' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {r.severity_score}/25 ({r.severity_level})
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              r.status === 'Activo' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                              r.status === 'Mitigado' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              r.status === 'Materializado' ? 'bg-red-200 text-red-900 font-bold' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 max-w-xs">
                            <div className="text-slate-800 font-medium text-[11px]">{r.mitigation_strategy}</div>
                            {r.contingency_plan && (
                              <div className="text-[10px] text-amber-800 italic mt-0.5">
                                Contingencia: {r.contingency_plan}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">
                            {r.mitigation_owner}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingRisk(r);
                                  setIsRiskModalOpen(true);
                                }}
                                className="p-1 hover:bg-slate-200 text-slate-600 rounded transition-colors cursor-pointer"
                                title="Editar riesgo"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`¿Eliminar riesgo ${r.code}?`)) {
                                    deleteRisk(r.id);
                                  }
                                }}
                                className="p-1 hover:bg-rose-100 text-rose-600 rounded transition-colors cursor-pointer"
                                title="Eliminar riesgo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CSEA v4.0 Consultive Architecture Mandate - Official Subsections for Chapters 4-13 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600">
            Marco Metodológico CSEA v4.0
          </span>
          <h3 className="text-base font-bold text-slate-900">
            Cierre Consultivo Ejecutivo: Red Causal y Registro de Riesgos (Sección 8)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700 leading-relaxed">
          {/* Subsección 1: Análisis Ejecutivo */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-600" />
              Análisis Ejecutivo
            </h4>
            <p>
              El mapeo de la red causal evidencia una concentración de tensiones operativas en los entregables sin holgura del cronograma. La evidencia indica que los retrasos en la formalización de acuerdos nominales (DIS) se correlacionan directamente con la materialización de riesgos técnicos y contractuales (Sección 8). Existe una exposición potencial en aquellos frentes donde las decisiones de comités directivos permanecen en estado de revisión y no han sido traducidas en compromisos con responsable y fecha límite de entrega.
            </p>
          </div>

          {/* Subsección 2: Recomendaciones */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              Recomendaciones
            </h4>
            <p>
              Se recomienda priorizar las sesiones de destrabe de gobernanza (GOB) para los 3 proyectos con menor holgura en su ruta crítica. Todo acuerdo de ejecución debe contar con una única persona responsable y fecha límite no negociable previa a la siguiente sesión de control. Asimismo, los riesgos catalogados con severidad crítica deben contar con protocolo de contingencia preautorizado por el Sponsor para su activación inmediata en caso de contingencia.
            </p>
          </div>

          {/* Subsección 3: Principales Conclusiones */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              Principales Conclusiones
            </h4>
            <p>
              Los proyectos con trazabilidad causal íntegra (Decisión ➔ Acuerdo ➔ Tarea de Ruta Crítica) presentan una disciplina de ejecución superior ({stats.avgDisScore}/100) en contraste con frentes desarticulados. El {stats.totalAgreements > 0 ? Math.round((stats.completedAgreements / stats.totalAgreements) * 100) : 100}% de acuerdos cumplidos confirma que la visibilidad nominal fortalece la rendición de cuentas operativa en los equipos de consultoría y contrapartes del cliente.
            </p>
          </div>

          {/* Subsección 4: Conclusión Ejecutiva */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-900" />
              Conclusión Ejecutiva
            </h4>
            <p>
              La dirección consultiva ratifica que la viabilidad del portafolio depende estrictamente de anticipar la resolución de cuellos de botella en la ruta crítica antes de que consuman la holgura remanente. La institucionalización de este registro RAID y red causal consolida el estándar CSEA v4.0 para garantizar el cumplimiento puntual de la promesa de valor hacia la alta dirección.
            </p>
          </div>
        </div>
      </div>

      {/* Modals for Create / Edit */}
      <DecisionModal
        isOpen={isDecisionModalOpen}
        onClose={() => {
          setIsDecisionModalOpen(false);
          setEditingDecision(null);
        }}
        onSave={async (data) => {
          if (editingDecision) {
            await updateDecision(editingDecision.id, data);
          } else {
            await addDecision(data);
          }
        }}
        projects={projects}
        tasks={tasks}
        risks={risks}
        initialData={editingDecision}
        defaultProjectId={selectedProjectId !== 'ALL' ? selectedProjectId : undefined}
      />

      <AgreementModal
        isOpen={isAgreementModalOpen}
        onClose={() => {
          setIsAgreementModalOpen(false);
          setEditingAgreement(null);
        }}
        onSave={async (data) => {
          if (editingAgreement) {
            await updateAgreement(editingAgreement.id, data);
          } else {
            await addAgreement(data);
          }
        }}
        projects={projects}
        tasks={tasks}
        decisions={decisions}
        initialData={editingAgreement}
        defaultProjectId={selectedProjectId !== 'ALL' ? selectedProjectId : undefined}
      />

      <RiskModal
        isOpen={isRiskModalOpen}
        onClose={() => {
          setIsRiskModalOpen(false);
          setEditingRisk(null);
        }}
        onSave={async (data) => {
          if (editingRisk) {
            await updateRisk(editingRisk.id, data);
          } else {
            await addRisk(data);
          }
        }}
        projects={projects}
        tasks={tasks}
        decisions={decisions}
        initialData={editingRisk}
        defaultProjectId={selectedProjectId !== 'ALL' ? selectedProjectId : undefined}
      />
    </div>
  );
}
