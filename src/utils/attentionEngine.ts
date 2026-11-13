import { 
  Project, 
  Task, 
  Meeting, 
  Communication, 
  Invoice, 
  TeamMember,
  ProjectDecision,
  ProjectAgreement,
  ProjectRisk
} from '../types';
import { calculateCriticalPath, getDaysDifference } from './criticalPath';

export type AttentionUrgency = 'CRITICAL' | 'ATTENTION' | 'MONITOR' | 'STABLE';

export interface AttentionFlag {
  type: 'critical' | 'warning' | 'info';
  text: string;
}

export interface ProjectAttentionEvaluation {
  project: Project;
  urgency: AttentionUrgency;
  urgencyLabel: string;
  attentionScore: number; // 0 to 100
  pmName: string;
  pmRole: string;
  pmInitials: string;

  // Progress Analysis
  actualProgress: number;
  expectedProgress: number;
  progressGap: number; // expected - actual
  isProgressLagging: boolean;

  // Critical Path & Deliverables
  criticalTasksCount: number;
  delayedCriticalTasksCount: number;
  overdueCriticalTasks: Task[];
  totalOverdueTasksCount: number;
  totalTasksCount: number;

  // Baseline & Schedule Variance
  hasBaseline: boolean;
  baselineDeadline?: string;
  scheduleVarianceDays: number; // positive = delayed
  daysRemaining: number | null;

  // Governance & Admin
  daysSinceLastGovernance: number | null;
  overdueInvoicesCount: number;

  // Phase 2 RAID Integration
  raidSummary?: {
    overdueAgreements: number;
    criticalRisks: number;
    pendingDecisions: number;
  };

  // C-Level Synthesis (Cause, Impact, Required Action)
  cause: string;
  impact: string;
  requiredAction: string;
  flags: AttentionFlag[];
}

export interface AttentionEnginePortfolioSummary {
  totalProjects: number;
  activeProjects: number;
  criticalCount: number;
  attentionCount: number;
  monitoringCount: number;
  stableCount: number;
  topAttentionProjects: ProjectAttentionEvaluation[];
  allEvaluations: ProjectAttentionEvaluation[];
  totalOverdueTasks: number;
  totalCriticalTasksDelayed: number;
  overloadedMembers: { memberName: string; projectCount: number; criticalCount: number }[];
}

/**
 * Calculates calendar days elapsed percentage between start and deadline.
 */
function calculateExpectedProgress(startDateStr?: string, deadlineStr?: string, todayStr?: string): number {
  if (!startDateStr || !deadlineStr) return 50;
  const start = new Date(startDateStr).getTime();
  const end = new Date(deadlineStr).getTime();
  const now = todayStr ? new Date(todayStr).getTime() : Date.now();

  if (isNaN(start) || isNaN(end) || end <= start) return 50;
  if (now <= start) return 0;
  if (now >= end) return 100;

  const totalDuration = end - start;
  const elapsed = now - start;
  return Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));
}

/**
 * Derives avatar initials from a name (e.g. "Rodrigo Silva" -> "RS").
 */
function getInitials(name: string): string {
  if (!name) return 'PM';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Main Attention Engine: evaluates a project using CPM, baseline variance,
 * deliverables, governance cadence, and resource allocation.
 */
export function evaluateProjectAttention(
  project: Project,
  allTasks: Task[],
  allMeetings: Meeting[],
  allCommunications: Communication[],
  allInvoices: Invoice[],
  allTeamMembers: TeamMember[],
  todayStr: string = new Date().toISOString().split('T')[0],
  allDecisions: ProjectDecision[] = [],
  allAgreements: ProjectAgreement[] = [],
  allRisks: ProjectRisk[] = []
): ProjectAttentionEvaluation {
  const projectTasks = allTasks.filter(t => t.project_id === project.id);
  const projectMeetings = allMeetings.filter(m => m.project_id === project.id);
  const projectComms = allCommunications.filter(c => c.project_id === project.id);
  const projectInvoices = allInvoices.filter(i => i.project_id === project.id);
  const projectDecisions = allDecisions.filter(d => d.project_id === project.id);
  const projectAgreements = allAgreements.filter(a => a.project_id === project.id);
  const projectRisks = allRisks.filter(r => r.project_id === project.id);

  // Identify Responsible PM
  const responsibleMember = allTeamMembers.find(
    m => m.id === project.responsible_id || m.id === project.accountable_id
  );
  const pmName = responsibleMember ? responsibleMember.name : 'Director de Consultoría';
  const pmRole = responsibleMember?.role || 'Líder de Iniciativa';
  const pmInitials = getInitials(pmName);

  // 1. Critical Path Analysis
  const cpmAnalysis = calculateCriticalPath(project, allTasks);
  const criticalTaskIds = cpmAnalysis.criticalTaskIds;
  const criticalTasks = projectTasks.filter(t => criticalTaskIds.has(t.id));

  // Overdue and delayed tasks
  const overdueTasks = projectTasks.filter(
    t => !t.is_done && t.status !== 'Completado' && t.end_date && t.end_date < todayStr
  );
  const overdueCriticalTasks = overdueTasks.filter(t => criticalTaskIds.has(t.id));

  // 2. Expected vs Actual Progress
  const actualProgress = Number(project.progress_percentage) || 0;
  const expectedProgress = calculateExpectedProgress(project.start_date, project.deadline, todayStr);
  const progressGap = expectedProgress - actualProgress;
  const isProgressLagging = progressGap > 15 && project.status !== 'Completado';

  // 3. Days remaining and Deadline Status
  let daysRemaining: number | null = null;
  if (project.deadline) {
    const diffTime = new Date(project.deadline).getTime() - new Date(todayStr).getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  const isPastDeadline = daysRemaining !== null && daysRemaining < 0 && project.status !== 'Completado';

  // 4. Baseline Schedule Variance
  const hasBaseline = Boolean(project.baseline_deadline);
  let scheduleVarianceDays = 0;
  if (hasBaseline && project.baseline_deadline && project.deadline) {
    scheduleVarianceDays = getDaysDifference(project.baseline_deadline, project.deadline);
  }

  // 5. Governance and Meetings
  let daysSinceLastGovernance: number | null = null;
  const latestInteractionDates: number[] = [];
  projectMeetings.forEach(m => {
    if (m.meeting_date) latestInteractionDates.push(new Date(m.meeting_date).getTime());
  });
  projectComms.forEach(c => {
    if (c.comm_date) latestInteractionDates.push(new Date(c.comm_date).getTime());
  });
  if (latestInteractionDates.length > 0) {
    const maxDate = Math.max(...latestInteractionDates);
    const diff = new Date(todayStr).getTime() - maxDate;
    daysSinceLastGovernance = Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  // 6. Overdue Invoices
  const overdueInvoices = projectInvoices.filter(i => i.status === 'Atrasada');

  // -------------------------------------------------------------
  // HEURISTIC SCORING ENGINE (0 to 100)
  // -------------------------------------------------------------
  let score = 0;
  const flags: AttentionFlag[] = [];

  // Completed projects are Stable
  if (project.status === 'Completado') {
    return {
      project,
      urgency: 'STABLE',
      urgencyLabel: 'Concluido',
      attentionScore: 0,
      pmName,
      pmRole,
      pmInitials,
      actualProgress: 100,
      expectedProgress: 100,
      progressGap: 0,
      isProgressLagging: false,
      criticalTasksCount: criticalTasks.length,
      delayedCriticalTasksCount: 0,
      overdueCriticalTasks: [],
      totalOverdueTasksCount: 0,
      totalTasksCount: projectTasks.length,
      hasBaseline,
      baselineDeadline: project.baseline_deadline,
      scheduleVarianceDays: 0,
      daysRemaining,
      daysSinceLastGovernance,
      overdueInvoicesCount: 0,
      cause: 'Iniciativa concluida satisfactoriamente conforme a entregables.',
      impact: 'Objetivos estratégicos y entregables formalmente entregados.',
      requiredAction: 'Monitoreo de cierre administrativo y archivo de evidencias.',
      flags: [{ type: 'info', text: 'Iniciativa cerrada' }],
    };
  }

  // Priority weight
  if (project.priority === 'Urgente') score += 12;
  else if (project.priority === 'Dificil') score += 8;

  // Deadline Exceeded
  if (isPastDeadline) {
    const daysLate = Math.abs(daysRemaining || 0);
    score += Math.min(30, 20 + daysLate * 1.5);
    flags.push({
      type: 'critical',
      text: `Fecha compromiso excedida por ${daysLate} días`,
    });
  } else if (daysRemaining !== null && daysRemaining <= 7 && actualProgress < 85) {
    score += 18;
    flags.push({
      type: 'critical',
      text: `Vencimiento próximo (${daysRemaining} días) con avance al ${actualProgress}%`,
    });
  }

  // Critical Path & Deliverables Delay
  if (overdueCriticalTasks.length > 0) {
    score += Math.min(28, overdueCriticalTasks.length * 12);
    flags.push({
      type: 'critical',
      text: `${overdueCriticalTasks.length} entregable(s) en ruta crítica con retraso`,
    });
  } else if (overdueTasks.length > 0) {
    score += Math.min(18, overdueTasks.length * 5);
    flags.push({
      type: 'warning',
      text: `${overdueTasks.length} entregable(s) fuera de plazo comprometido`,
    });
  }

  // Baseline Schedule Deviation
  if (hasBaseline && scheduleVarianceDays > 0) {
    score += Math.min(22, scheduleVarianceDays * 1.5);
    flags.push({
      type: 'warning',
      text: `Desvío de +${scheduleVarianceDays} días respecto a Línea Base aprobada`,
    });
  }

  // Progress Lag vs Calendar Time
  if (progressGap > 30) {
    score += 20;
    flags.push({
      type: 'critical',
      text: `Rezago crítico: ${actualProgress}% de avance vs ${expectedProgress}% esperado`,
    });
  } else if (progressGap > 15) {
    score += 12;
    flags.push({
      type: 'warning',
      text: `Brecha de avance: ${actualProgress}% real vs ${expectedProgress}% de calendario`,
    });
  }

  // Overdue Invoices
  if (overdueInvoices.length > 0) {
    score += Math.min(12, overdueInvoices.length * 6);
    flags.push({
      type: 'warning',
      text: `${overdueInvoices.length} factura(s) de proveedor o consultoría atrasada(s)`,
    });
  }

  // Governance Cadence
  if (daysSinceLastGovernance !== null && daysSinceLastGovernance > 25 && project.priority !== 'Fácil') {
    score += 10;
    flags.push({
      type: 'info',
      text: `Sin comités ni acuerdos registrados en los últimos ${daysSinceLastGovernance} días`,
    });
  }

  // 7. Phase 2 RAID Exposure (CSEA GOB/DIS/VIS)
  const overdueAgreements = projectAgreements.filter(
    a => a.status === 'Atrasado' || (a.status === 'Pendiente' && a.due_date < todayStr)
  ).length;
  const criticalRisks = projectRisks.filter(
    r => (r.severity_level === 'Crítico' || r.severity_level === 'Alto') && r.status === 'Activo'
  ).length;
  const pendingDecisions = projectDecisions.filter(
    d => d.status === 'Propuesta' || d.status === 'En revisión'
  ).length;

  if (overdueAgreements > 0) {
    score += Math.min(20, overdueAgreements * 10);
    flags.push({
      type: 'critical',
      text: `${overdueAgreements} acuerdo(s) de ejecución con plazo vencido`,
    });
  }

  if (criticalRisks > 0) {
    score += Math.min(18, criticalRisks * 9);
    flags.push({
      type: 'warning',
      text: `${criticalRisks} riesgo(s) de severidad crítica/alta activo(s)`,
    });
  }

  if (pendingDecisions > 0) {
    flags.push({
      type: 'info',
      text: `${pendingDecisions} decisión(es) de comités pendiente(s) de aprobación`,
    });
  }

  // Bound score to 100
  score = Math.min(100, Math.round(score));

  // Determine Urgency Level
  let urgency: AttentionUrgency = 'STABLE';
  let urgencyLabel = 'Estable';

  if (score >= 50 || isPastDeadline || overdueCriticalTasks.length >= 2) {
    urgency = 'CRITICAL';
    urgencyLabel = 'Atención Crítica';
  } else if (score >= 30 || overdueCriticalTasks.length === 1 || progressGap >= 20) {
    urgency = 'ATTENTION';
    urgencyLabel = 'Atención Requerida';
  } else if (score >= 15 || overdueTasks.length > 0 || scheduleVarianceDays > 0) {
    urgency = 'MONITOR';
    urgencyLabel = 'Bajo Monitoreo';
  }

  // -------------------------------------------------------------
  // SYNTHESIS: CAUSE, IMPACT, REQUIRED ACTION (C-Level Tone)
  // -------------------------------------------------------------
  let cause = '';
  let impact = '';
  let requiredAction = '';

  if (urgency === 'CRITICAL') {
    if (overdueCriticalTasks.length > 0) {
      const taskNames = overdueCriticalTasks.slice(0, 2).map(t => `"${t.name}"`).join(' y ');
      cause = `${overdueCriticalTasks.length} entregable(s) en ruta crítica (${taskNames}) presentan retraso frente al calendario operativo.`;
      impact = `Exposición directa a aplazar la fecha objetivo final del ${project.deadline || 'proyecto'} y consumir la holgura de fases posteriores.`;
      requiredAction = `Convocar sesión de destrabe técnico con ${pmName} y el sponsor para reasignar tareas o ajustar dependencias críticas.`;
    } else if (isPastDeadline) {
      cause = `La fecha límite comprometida (${project.deadline}) fue superada con un avance físico registrado de ${actualProgress}%.`;
      impact = `Riesgo de escalación con el cliente/sponsor y posible impacto contractual o presupuestario en los entregables clave.`;
      requiredAction = `Solicitar formalmente aprobación de ventana de cierre o reestructurar el alcance pendiente con el comité directivo.`;
    } else {
      cause = `Brecha de avance sustancial: avance real de ${actualProgress}% frente al ${expectedProgress}% del periodo transcurrido.`;
      impact = `Concentración de entregables hacia el cierre del periodo con riesgo de sobrecarga del equipo e incumplimiento de hitos.`;
      requiredAction = `Priorizar los entregables de mayor impacto y rebalancear la asignación de recursos con ${pmName}.`;
    }
  } else if (urgency === 'ATTENTION') {
    if (scheduleVarianceDays > 0) {
      cause = `Desalineación de +${scheduleVarianceDays} días frente a la Línea Base congelada (${project.baseline_deadline}).`;
      impact = `Deterioro paulatino de la holgura del cronograma que podría trasladar retrasos a hitos interconectados.`;
      requiredAction = `Revisar con el líder técnico el plan de recuperación para reabsorber la desviación en el siguiente ciclo.`;
    } else if (overdueTasks.length > 0) {
      cause = `${overdueTasks.length} entregable(s) pendientes de cierre fuera de su fecha estipulada.`;
      impact = `Generación de cuellos de botella en tareas sucesoras y potencial afectación en la visibilidad del portafolio.`;
      requiredAction = `Dar seguimiento focalizado a los responsables de los entregables atrasados y fijar nueva fecha de corte.`;
    } else {
      cause = `Avance al ${actualProgress}% con ritmo inferior al calendario proyectado (${expectedProgress}% esperado).`;
      impact = `Los resultados sugieren pérdida de tracción operativa en las semanas recientes.`;
      requiredAction = `Programar sesión de alineación con el equipo para verificar si existen bloqueos externos o dependencias no resueltas.`;
    }
  } else if (urgency === 'MONITOR') {
    cause = `Iniciativa en curso con pequeñas variaciones de calendario o facturación en proceso de conciliación.`;
    impact = `No se detecta afectación a hitos mayores, pero requiere seguimiento de la tendencia semanal.`;
    requiredAction = `Mantener el ritmo de supervisión en los comités ordinarios y monitorear la entrega de las próximas 2 semanas.`;
  } else {
    cause = `Parámetros de ejecución alineados con el cronograma y línea base formal.`;
    impact = `Sin desviaciones materiales reportadas en ruta crítica ni en entregables.`;
    requiredAction = `Continuar con la gobernanza ordinaria y registro periódico de avances.`;
  }

  return {
    project,
    urgency,
    urgencyLabel,
    attentionScore: score,
    pmName,
    pmRole,
    pmInitials,
    actualProgress,
    expectedProgress,
    progressGap,
    isProgressLagging,
    criticalTasksCount: criticalTasks.length,
    delayedCriticalTasksCount: overdueCriticalTasks.length,
    overdueCriticalTasks,
    totalOverdueTasksCount: overdueTasks.length,
    totalTasksCount: projectTasks.length,
    hasBaseline,
    baselineDeadline: project.baseline_deadline,
    scheduleVarianceDays,
    daysRemaining,
    daysSinceLastGovernance,
    overdueInvoicesCount: overdueInvoices.length,
    raidSummary: {
      overdueAgreements,
      criticalRisks,
      pendingDecisions,
    },
    cause,
    impact,
    requiredAction,
    flags,
  };
}

/**
 * Evaluates all projects across the portfolio and summarizes results.
 */
export function evaluatePortfolioAttention(
  projects: Project[],
  tasks: Task[],
  meetings: Meeting[],
  communications: Communication[],
  invoices: Invoice[],
  teamMembers: TeamMember[],
  decisions: ProjectDecision[] = [],
  agreements: ProjectAgreement[] = [],
  risks: ProjectRisk[] = []
): AttentionEnginePortfolioSummary {
  const todayStr = new Date().toISOString().split('T')[0];

  const allEvaluations = projects.map(p =>
    evaluateProjectAttention(
      p, 
      tasks, 
      meetings, 
      communications, 
      invoices, 
      teamMembers, 
      todayStr, 
      decisions, 
      agreements, 
      risks
    )
  );

  // Sort descending by attention score (highest urgency first)
  allEvaluations.sort((a, b) => {
    // Non-completed projects first
    if (a.project.status === 'Completado' && b.project.status !== 'Completado') return 1;
    if (a.project.status !== 'Completado' && b.project.status === 'Completado') return -1;
    return b.attentionScore - a.attentionScore;
  });

  const activeProjects = allEvaluations.filter(e => e.project.status !== 'Completado');
  const criticalEvaluations = activeProjects.filter(e => e.urgency === 'CRITICAL');
  const attentionEvaluations = activeProjects.filter(e => e.urgency === 'ATTENTION');
  const monitorEvaluations = activeProjects.filter(e => e.urgency === 'MONITOR');
  const stableEvaluations = activeProjects.filter(e => e.urgency === 'STABLE');

  // Top 3 attention candidates (guaranteed 3 if active projects >= 3)
  const topAttentionProjects = activeProjects.slice(0, 3);

  // Aggregate totals
  const totalOverdueTasks = allEvaluations.reduce((sum, e) => sum + e.totalOverdueTasksCount, 0);
  const totalCriticalTasksDelayed = allEvaluations.reduce((sum, e) => sum + e.delayedCriticalTasksCount, 0);

  // Member workload analysis
  const memberCounts: Record<string, { memberName: string; projectCount: number; criticalCount: number }> = {};
  allEvaluations.forEach(e => {
    if (e.project.status === 'Completado') return;
    const name = e.pmName;
    if (!memberCounts[name]) {
      memberCounts[name] = { memberName: name, projectCount: 0, criticalCount: 0 };
    }
    memberCounts[name].projectCount += 1;
    if (e.urgency === 'CRITICAL' || e.urgency === 'ATTENTION') {
      memberCounts[name].criticalCount += 1;
    }
  });

  const overloadedMembers = Object.values(memberCounts)
    .filter(m => m.projectCount >= 3 || m.criticalCount >= 2)
    .sort((a, b) => b.projectCount - a.projectCount);

  return {
    totalProjects: projects.length,
    activeProjects: activeProjects.length,
    criticalCount: criticalEvaluations.length,
    attentionCount: attentionEvaluations.length,
    monitoringCount: monitorEvaluations.length,
    stableCount: stableEvaluations.length,
    topAttentionProjects,
    allEvaluations,
    totalOverdueTasks,
    totalCriticalTasksDelayed,
    overloadedMembers,
  };
}
