import React, { useState } from 'react';
import { 
  Project, 
  Task, 
  ProjectDecision, 
  ProjectAgreement, 
  ProjectRisk,
  DecisionStatus,
  DecisionImpact,
  AgreementStatus,
  AgreementPriority,
  RiskCategory,
  RiskStatus,
  RiskSeverityLevel
} from '../types';
import { X, Check, AlertTriangle, ShieldCheck, FileText, Calendar, User, Link as LinkIcon, AlertCircle } from 'lucide-react';

interface DecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  projects: Project[];
  tasks: Task[];
  risks: ProjectRisk[];
  initialData?: ProjectDecision | null;
  defaultProjectId?: string;
}

export function DecisionModal({
  isOpen,
  onClose,
  onSave,
  projects,
  tasks,
  risks,
  initialData,
  defaultProjectId,
}: DecisionModalProps) {
  const [projectId, setProjectId] = useState(initialData?.project_id || defaultProjectId || projects[0]?.id || '');
  const [code, setCode] = useState(initialData?.code || '');
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [decisionMaker, setDecisionMaker] = useState(initialData?.decision_maker || 'Comité Directivo');
  const [decisionDate, setDecisionDate] = useState(initialData?.decision_date || new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<DecisionStatus>(initialData?.status || 'Aprobada');
  const [impactLevel, setImpactLevel] = useState<DecisionImpact>(initialData?.impact_level || 'Medio');
  const [justification, setJustification] = useState(initialData?.justification || '');
  const [linkedTaskId, setLinkedTaskId] = useState(initialData?.linked_task_id || '');
  const [linkedRiskId, setLinkedRiskId] = useState(initialData?.linked_risk_id || '');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const projectTasks = tasks.filter(t => t.project_id === projectId);
  const projectRisks = risks.filter(r => r.project_id === projectId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectId) return;

    setLoading(true);
    try {
      await onSave({
        project_id: projectId,
        code: code.trim() || undefined,
        title: title.trim(),
        description: description.trim(),
        decision_maker: decisionMaker.trim(),
        decision_date: decisionDate,
        status,
        impact_level: impactLevel,
        justification: justification.trim() || undefined,
        linked_task_id: linkedTaskId || undefined,
        linked_risk_id: linkedRiskId || undefined,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-2xl w-full my-8 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0f172a] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-orange-600 rounded-lg text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-orange-400">Gobernanza CSEA v4.0 (GOB)</span>
              <h2 className="text-base font-bold text-white">
                {initialData ? 'Modificar Registro de Decisión' : 'Registrar Nueva Decisión Estratégica'}
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Proyecto Asignado *</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                required
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Código de Referencia</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ej: D-005 (auto si se deja vacío)"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Título de la Decisión *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Autorización de contratación emergente de proveedor de QA"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción y Alcance *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Detalle los fundamentos, alternativas descartadas y el impacto operativo convenido..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tomador de Decisión *</label>
              <input
                type="text"
                value={decisionMaker}
                onChange={(e) => setDecisionMaker(e.target.value)}
                placeholder="Ej: Comité de Dirección / Sponsor"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha de Decisión *</label>
              <input
                type="date"
                value={decisionDate}
                onChange={(e) => setDecisionDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Estado de Gobernanza</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DecisionStatus)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                <option value="Propuesta">Propuesta</option>
                <option value="En revisión">En revisión</option>
                <option value="Aprobada">Aprobada</option>
                <option value="Rechazada">Rechazada</option>
                <option value="Superada">Superada</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nivel de Impacto</label>
              <select
                value={impactLevel}
                onChange={(e) => setImpactLevel(e.target.value as DecisionImpact)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                <option value="Crítico">Crítico</option>
                <option value="Alto">Alto</option>
                <option value="Medio">Medio</option>
                <option value="Bajo">Bajo</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Vincular Entregable (Ruta Crítica)</label>
              <select
                value={linkedTaskId}
                onChange={(e) => setLinkedTaskId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                <option value="">-- Sin vincular --</option>
                {projectTasks.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Vincular Riesgo Mitigado</label>
              <select
                value={linkedRiskId}
                onChange={(e) => setLinkedRiskId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                <option value="">-- Sin vincular --</option>
                {projectRisks.map(r => (
                  <option key={r.id} value={r.id}>[{r.code}] {r.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Justificación Estratégica (Opcional)</label>
            <input
              type="text"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Ej: Cumple con el criterio de mitigación de retrasos en la línea base CSEA."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-[#0f172a] hover:bg-slate-800 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {loading ? 'Guardando...' : initialData ? 'Actualizar Decisión' : 'Guardar Decisión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface AgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  projects: Project[];
  tasks: Task[];
  decisions: ProjectDecision[];
  initialData?: ProjectAgreement | null;
  defaultProjectId?: string;
}

export function AgreementModal({
  isOpen,
  onClose,
  onSave,
  projects,
  tasks,
  decisions,
  initialData,
  defaultProjectId,
}: AgreementModalProps) {
  const [projectId, setProjectId] = useState(initialData?.project_id || defaultProjectId || projects[0]?.id || '');
  const [code, setCode] = useState(initialData?.code || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [responsibleName, setResponsibleName] = useState(initialData?.responsible_name || '');
  const [dueDate, setDueDate] = useState(initialData?.due_date || new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<AgreementStatus>(initialData?.status || 'Pendiente');
  const [priority, setPriority] = useState<AgreementPriority>(initialData?.priority || 'Media');
  const [linkedDecisionId, setLinkedDecisionId] = useState(initialData?.linked_decision_id || '');
  const [linkedTaskId, setLinkedTaskId] = useState(initialData?.linked_task_id || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const projectTasks = tasks.filter(t => t.project_id === projectId);
  const projectDecisions = decisions.filter(d => d.project_id === projectId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !responsibleName.trim() || !projectId) return;

    setLoading(true);
    try {
      await onSave({
        project_id: projectId,
        code: code.trim() || undefined,
        description: description.trim(),
        responsible_name: responsibleName.trim(),
        due_date: dueDate,
        status,
        priority,
        linked_decision_id: linkedDecisionId || undefined,
        linked_task_id: linkedTaskId || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-2xl w-full my-8 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0f172a] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 rounded-lg text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Disciplina de Ejecución CSEA v4.0 (DIS)</span>
              <h2 className="text-base font-bold text-white">
                {initialData ? 'Editar Acuerdo / Compromiso' : 'Registrar Nuevo Acuerdo de Gestión'}
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Proyecto Asignado *</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Código de Referencia</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ej: A-005 (auto si se deja vacío)"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción del Compromiso *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Especificar claramente el entregable comprometido, estándar de aceptación y condiciones..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Responsable Nominal *</label>
              <input
                type="text"
                value={responsibleName}
                onChange={(e) => setResponsibleName(e.target.value)}
                placeholder="Ej: Gerente de Calidad / PM Lead"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha Límite de Cumplimiento *</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Estado</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AgreementStatus)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="Pendiente">Pendiente</option>
                <option value="En proceso">En proceso</option>
                <option value="Cumplido">Cumplido</option>
                <option value="Atrasado">Atrasado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Prioridad</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as AgreementPriority)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="Alta">Alta</option>
                <option value="Media">Media</option>
                <option value="Baja">Baja</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Vincular a Decisión (GOB)</label>
              <select
                value={linkedDecisionId}
                onChange={(e) => setLinkedDecisionId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="">-- Sin vincular --</option>
                {projectDecisions.map(d => (
                  <option key={d.id} value={d.id}>[{d.code}] {d.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Vincular a Entregable / Tarea</label>
              <select
                value={linkedTaskId}
                onChange={(e) => setLinkedTaskId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="">-- Sin vincular --</option>
                {projectTasks.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notas de Seguimiento (Opcional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Validado en comité semanal de destrabe operativo."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-[#0f172a] hover:bg-slate-800 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {loading ? 'Guardando...' : initialData ? 'Actualizar Acuerdo' : 'Guardar Acuerdo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface RiskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  projects: Project[];
  tasks: Task[];
  decisions: ProjectDecision[];
  initialData?: ProjectRisk | null;
  defaultProjectId?: string;
}

export function RiskModal({
  isOpen,
  onClose,
  onSave,
  projects,
  tasks,
  decisions,
  initialData,
  defaultProjectId,
}: RiskModalProps) {
  const [projectId, setProjectId] = useState(initialData?.project_id || defaultProjectId || projects[0]?.id || '');
  const [code, setCode] = useState(initialData?.code || '');
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState<RiskCategory>(initialData?.category || 'Operativo');
  const [probability, setProbability] = useState<1 | 2 | 3 | 4 | 5>(initialData?.probability || 3);
  const [impact, setImpact] = useState<1 | 2 | 3 | 4 | 5>(initialData?.impact || 3);
  const [status, setStatus] = useState<RiskStatus>(initialData?.status || 'Activo');
  const [mitigationStrategy, setMitigationStrategy] = useState(initialData?.mitigation_strategy || '');
  const [mitigationOwner, setMitigationOwner] = useState(initialData?.mitigation_owner || 'Líder de Proyecto');
  const [contingencyPlan, setContingencyPlan] = useState(initialData?.contingency_plan || '');
  const [linkedTaskId, setLinkedTaskId] = useState(initialData?.linked_task_id || '');
  const [linkedDecisionId, setLinkedDecisionId] = useState(initialData?.linked_decision_id || '');
  const [reviewDate, setReviewDate] = useState(initialData?.review_date || new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const projectTasks = tasks.filter(t => t.project_id === projectId);
  const projectDecisions = decisions.filter(d => d.project_id === projectId);

  const score = probability * impact;
  const severityLevel: RiskSeverityLevel = score >= 16 ? 'Crítico' : score >= 10 ? 'Alto' : score >= 5 ? 'Medio' : 'Bajo';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectId) return;

    setLoading(true);
    try {
      await onSave({
        project_id: projectId,
        code: code.trim() || undefined,
        title: title.trim(),
        description: description.trim(),
        category,
        probability,
        impact,
        severity_score: score,
        severity_level: severityLevel,
        status,
        mitigation_strategy: mitigationStrategy.trim(),
        mitigation_owner: mitigationOwner.trim(),
        contingency_plan: contingencyPlan.trim() || undefined,
        linked_task_id: linkedTaskId || undefined,
        linked_decision_id: linkedDecisionId || undefined,
        review_date: reviewDate || undefined,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-2xl w-full my-8 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0f172a] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-600 rounded-lg text-white">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400">Registro de Riesgos (CSEA Sección 8)</span>
              <h2 className="text-base font-bold text-white">
                {initialData ? 'Modificar Registro de Riesgo' : 'Registrar Nuevo Riesgo en Portafolio'}
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Proyecto Asignado *</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                required
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Código de Riesgo</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ej: R-005 (auto si se deja vacío)"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Título del Evento de Riesgo *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Sobrecarga en capacidad del equipo consultivo por desfase de actividades"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción y Factores Causales</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Causa raíz, condiciones que desencadenan el riesgo y efecto estimado en los objetivos..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Categoría CSEA</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as RiskCategory)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              >
                <option value="Operativo">Operativo</option>
                <option value="Técnico">Técnico</option>
                <option value="Contractual / Alcance">Contractual / Alcance</option>
                <option value="Recursos / Equipo">Recursos / Equipo</option>
                <option value="Gobernanza / Cliente">Gobernanza / Cliente</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Estado de Exposición</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as RiskStatus)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              >
                <option value="Activo">Activo</option>
                <option value="Mitigado">Mitigado</option>
                <option value="Materializado">Materializado</option>
                <option value="Cerrado">Cerrado</option>
              </select>
            </div>
          </div>

          {/* Severity Calculation Grid */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-xs font-bold text-slate-800 mb-2.5 flex items-center justify-between">
              <span>Matriz Probabilidad × Impacto (CSEA 5×5)</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                severityLevel === 'Crítico' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                severityLevel === 'Alto' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                severityLevel === 'Medio' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                'bg-slate-200 text-slate-700'
              }`}>
                Severidad: {score}/25 ({severityLevel})
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">
                  Probabilidad (1 a 5): <span className="font-bold text-slate-900">{probability}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={probability}
                  onChange={(e) => setProbability(Number(e.target.value) as any)}
                  className="w-full accent-rose-600 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-400">
                  <span>1 (Rara)</span>
                  <span>3 (Moderada)</span>
                  <span>5 (Casi segura)</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 mb-1">
                  Impacto (1 a 5): <span className="font-bold text-slate-900">{impact}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={impact}
                  onChange={(e) => setImpact(Number(e.target.value) as any)}
                  className="w-full accent-rose-600 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-400">
                  <span>1 (Menor)</span>
                  <span>3 (Moderado)</span>
                  <span>5 (Catastrófico)</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Estrategia de Mitigación Preventiva *</label>
            <input
              type="text"
              value={mitigationStrategy}
              onChange={(e) => setMitigationStrategy(e.target.value)}
              placeholder="Acciones preventivas inmediatas para reducir la probabilidad o impacto..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Responsable de Mitigación *</label>
              <input
                type="text"
                value={mitigationOwner}
                onChange={(e) => setMitigationOwner(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha de Próxima Revisión</label>
              <input
                type="date"
                value={reviewDate}
                onChange={(e) => setReviewDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Plan de Contingencia (Si se materializa)</label>
            <input
              type="text"
              value={contingencyPlan}
              onChange={(e) => setContingencyPlan(e.target.value)}
              placeholder="Protocolo a activar en caso de que el riesgo impacte la ruta crítica..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Vincular a Entregable (Ruta Crítica)</label>
              <select
                value={linkedTaskId}
                onChange={(e) => setLinkedTaskId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              >
                <option value="">-- Sin vincular --</option>
                {projectTasks.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Vincular a Decisión de Destrabe</label>
              <select
                value={linkedDecisionId}
                onChange={(e) => setLinkedDecisionId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              >
                <option value="">-- Sin vincular --</option>
                {projectDecisions.map(d => (
                  <option key={d.id} value={d.id}>[{d.code}] {d.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-[#0f172a] hover:bg-slate-800 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {loading ? 'Guardando...' : initialData ? 'Actualizar Riesgo' : 'Guardar Riesgo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
