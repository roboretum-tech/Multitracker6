import { 
  Project, 
  Task, 
  ProjectDecision, 
  ProjectAgreement, 
  ProjectRisk,
  CriticalPathAnalysis 
} from '../types';
import { calculateCriticalPath } from './criticalPath';

export interface CausalChainBundle {
  id: string;
  projectId: string;
  projectName: string;
  
  // Elements in the causal flow
  decision?: ProjectDecision;
  agreements: ProjectAgreement[];
  task?: Task;
  risks: ProjectRisk[];
  
  // Critical Path & Schedule Intelligence
  isCriticalTask: boolean;
  taskSlackDays: number;
  taskVarianceDays: number;
  threatLevel: 'CRITICAL' | 'WARNING' | 'HEALTHY' | 'INFO';
  
  // Consultive CSEA v4.0 Narrative
  causalNarrative: string;
  governanceRecommendation: string;
  isThreateningMilestone: boolean;
}

export interface ProjectCausalAnalysis {
  projectId: string;
  projectName: string;
  criticalPath: CriticalPathAnalysis;
  chains: CausalChainBundle[];
  orphanDecisions: ProjectDecision[];
  orphanAgreements: ProjectAgreement[];
  orphanRisks: ProjectRisk[];
  stats: {
    totalDecisions: number;
    pendingDecisions: number;
    totalAgreements: number;
    overdueAgreements: number;
    completedAgreements: number;
    totalRisks: number;
    criticalRisks: number;
    criticalRisksOnCriticalPath: number;
    threatenedMilestones: number;
    cseaGobScore: number; // 0 - 100
    cseaDisScore: number; // 0 - 100
  };
}

/**
 * Builds the Causal Chain Network for a specific project.
 * Interconnects Decisions (GOB) -> Agreements (DIS) -> Critical Tasks -> Risks (DIS/VIS).
 */
export function buildCausalAnalysisForProject(
  project: Project,
  allTasks: Task[],
  allDecisions: ProjectDecision[],
  allAgreements: ProjectAgreement[],
  allRisks: ProjectRisk[]
): ProjectCausalAnalysis {
  const projectTasks = allTasks.filter(t => t.project_id === project.id);
  const projectDecisions = allDecisions.filter(d => d.project_id === project.id);
  const projectAgreements = allAgreements.filter(a => a.project_id === project.id);
  const projectRisks = allRisks.filter(r => r.project_id === project.id);

  // Compute critical path & CPM nodes
  const cpAnalysis = calculateCriticalPath(project, projectTasks);
  const criticalTaskIds = cpAnalysis.criticalTaskIds;
  const varianceMap = new Map(cpAnalysis.variances.map(v => [v.task.id, v]));

  const todayStr = new Date().toISOString().split('T')[0];

  const claimedDecisionIds = new Set<string>();
  const claimedAgreementIds = new Set<string>();
  const claimedRiskIds = new Set<string>();

  const chains: CausalChainBundle[] = [];

  // 1. Trace chains starting from Tasks (since tasks represent execution reality)
  projectTasks.forEach(task => {
    const isCritical = criticalTaskIds.has(task.id);
    const variance = varianceMap.get(task.id);
    const slack = variance ? variance.slackDays : 0;
    const endVariance = variance ? variance.endVarianceDays : 0;

    // Associated decisions
    const linkedDecisions = projectDecisions.filter(d => d.linked_task_id === task.id);
    // Associated agreements
    const linkedAgreements = projectAgreements.filter(a => a.linked_task_id === task.id);
    // Associated risks
    const linkedRisks = projectRisks.filter(r => r.linked_task_id === task.id);

    if (linkedDecisions.length > 0 || linkedAgreements.length > 0 || linkedRisks.length > 0) {
      linkedDecisions.forEach(d => claimedDecisionIds.add(d.id));
      linkedAgreements.forEach(a => claimedAgreementIds.add(a.id));
      linkedRisks.forEach(r => claimedRiskIds.add(r.id));

      // Determine Threat Level based on CSEA v4.0 criteria
      const hasCriticalRisk = linkedRisks.some(r => (r.severity_level === 'Crítico' || r.severity_level === 'Alto') && r.status === 'Activo');
      const hasOverdueAgreement = linkedAgreements.some(a => a.status === 'Atrasado' || (a.status === 'Pendiente' && a.due_date < todayStr));
      const hasUnapprovedDecision = linkedDecisions.some(d => d.status === 'Propuesta' || d.status === 'En revisión');

      let threatLevel: 'CRITICAL' | 'WARNING' | 'HEALTHY' | 'INFO' = 'HEALTHY';
      let isThreateningMilestone = false;

      if (isCritical && (hasCriticalRisk || hasOverdueAgreement)) {
        threatLevel = 'CRITICAL';
        isThreateningMilestone = true;
      } else if (hasCriticalRisk || hasOverdueAgreement || (isCritical && hasUnapprovedDecision)) {
        threatLevel = 'WARNING';
        isThreateningMilestone = isCritical;
      } else if (linkedAgreements.every(a => a.status === 'Cumplido') && linkedRisks.every(r => r.status === 'Mitigado' || r.status === 'Cerrado')) {
        threatLevel = 'HEALTHY';
      } else {
        threatLevel = 'INFO';
      }

      // Build consultive narrative (CSEA v4.0 C-Level tone)
      const primaryDec = linkedDecisions[0];
      const parts: string[] = [];
      if (primaryDec) {
        parts.push(`Decisión ${primaryDec.code} (${primaryDec.status})`);
      }
      if (linkedAgreements.length > 0) {
        const agrsSummary = linkedAgreements.map(a => `${a.code} [${a.status}]`).join(', ');
        parts.push(`Acuerdos: ${agrsSummary}`);
      }
      parts.push(`Entregable: "${task.name}" (${isCritical ? 'Ruta Crítica' : `Holgura: ${slack}d`})`);
      if (linkedRisks.length > 0) {
        const rsksSummary = linkedRisks.map(r => `${r.code} (${r.severity_level})`).join(', ');
        parts.push(`Riesgos asociados: ${rsksSummary}`);
      }

      const causalNarrative = parts.join(' ➔ ');

      let recommendation = '';
      if (threatLevel === 'CRITICAL') {
        recommendation = `Exposición crítica en ruta crítica: Destrabar con urgencia el acuerdo de ejecución y activar plan de contingencia para preservar el hito final de "${project.name}".`;
      } else if (threatLevel === 'WARNING') {
        recommendation = `Riesgo o compromiso con potencial de desvío: Monitorear cumplimiento en el próximo comité de gobernanza y verificar holgura disponible (${slack} días).`;
      } else {
        recommendation = 'Cadena causal estabilizada conforme a la disciplina de ejecución esperada.';
      }

      chains.push({
        id: `chain-task-${task.id}`,
        projectId: project.id,
        projectName: project.name,
        decision: primaryDec,
        agreements: linkedAgreements,
        task,
        risks: linkedRisks,
        isCriticalTask: isCritical,
        taskSlackDays: slack,
        taskVarianceDays: endVariance,
        threatLevel,
        causalNarrative,
        governanceRecommendation: recommendation,
        isThreateningMilestone,
      });
    }
  });

  // 2. Add chains from Decisions that might be linked to Risks directly but not Tasks
  projectDecisions.forEach(dec => {
    if (!claimedDecisionIds.has(dec.id)) {
      const linkedRisks = projectRisks.filter(r => r.linked_decision_id === dec.id || dec.linked_risk_id === r.id);
      const linkedAgreements = projectAgreements.filter(a => a.linked_decision_id === dec.id);

      if (linkedRisks.length > 0 || linkedAgreements.length > 0) {
        claimedDecisionIds.add(dec.id);
        linkedAgreements.forEach(a => claimedAgreementIds.add(a.id));
        linkedRisks.forEach(r => claimedRiskIds.add(r.id));

        const hasActiveHighRisk = linkedRisks.some(r => (r.severity_level === 'Crítico' || r.severity_level === 'Alto') && r.status === 'Activo');

        chains.push({
          id: `chain-dec-${dec.id}`,
          projectId: project.id,
          projectName: project.name,
          decision: dec,
          agreements: linkedAgreements,
          risks: linkedRisks,
          isCriticalTask: false,
          taskSlackDays: 0,
          taskVarianceDays: 0,
          threatLevel: hasActiveHighRisk ? 'WARNING' : 'INFO',
          causalNarrative: `Decisión ${dec.code} vinculada directamente a ${linkedRisks.length} riesgo(s) y ${linkedAgreements.length} acuerdo(s) de gobernanza.`,
          governanceRecommendation: 'Formalizar asignación de entregables específicos para garantizar la trazabilidad operativa de la decisión.',
          isThreateningMilestone: false,
        });
      }
    }
  });

  // Collect orphans
  const orphanDecisions = projectDecisions.filter(d => !claimedDecisionIds.has(d.id));
  const orphanAgreements = projectAgreements.filter(a => !claimedAgreementIds.has(a.id));
  const orphanRisks = projectRisks.filter(r => !claimedRiskIds.has(r.id));

  // Compute CSEA Scores
  const overdueAgreements = projectAgreements.filter(a => a.status === 'Atrasado' || (a.status === 'Pendiente' && a.due_date < todayStr)).length;
  const completedAgreements = projectAgreements.filter(a => a.status === 'Cumplido').length;
  const pendingDecisions = projectDecisions.filter(d => d.status === 'Propuesta' || d.status === 'En revisión').length;
  const criticalRisks = projectRisks.filter(r => r.severity_level === 'Crítico' && r.status === 'Activo').length;
  const criticalRisksOnCriticalPath = chains.filter(c => c.isCriticalTask && c.risks.some(r => r.severity_level === 'Crítico' && r.status === 'Activo')).length;
  const threatenedMilestones = chains.filter(c => c.isThreateningMilestone).length;

  // CSEA Gobernanza (GOB) Score calculation: baseline 100, penalized by unresolved critical decisions and missing links
  let gobScore = 100;
  if (pendingDecisions > 0) gobScore -= Math.min(30, pendingDecisions * 15);
  if (orphanDecisions.length > 0) gobScore -= Math.min(15, orphanDecisions.length * 5);
  gobScore = Math.max(20, Math.round(gobScore));

  // CSEA Disciplina de Ejecución (DIS) Score calculation: based on agreement fulfillment and risk mitigation
  let disScore = 100;
  if (overdueAgreements > 0) disScore -= Math.min(40, overdueAgreements * 20);
  if (criticalRisksOnCriticalPath > 0) disScore -= Math.min(35, criticalRisksOnCriticalPath * 25);
  disScore = Math.max(15, Math.round(disScore));

  return {
    projectId: project.id,
    projectName: project.name,
    criticalPath: cpAnalysis,
    chains,
    orphanDecisions,
    orphanAgreements,
    orphanRisks,
    stats: {
      totalDecisions: projectDecisions.length,
      pendingDecisions,
      totalAgreements: projectAgreements.length,
      overdueAgreements,
      completedAgreements,
      totalRisks: projectRisks.length,
      criticalRisks,
      criticalRisksOnCriticalPath,
      threatenedMilestones,
      cseaGobScore: gobScore,
      cseaDisScore: disScore,
    },
  };
}

/**
 * Builds cross-portfolio causal summary across all projects.
 */
export function buildPortfolioCausalAnalysis(
  projects: Project[],
  tasks: Task[],
  decisions: ProjectDecision[],
  agreements: ProjectAgreement[],
  risks: ProjectRisk[]
): {
  projectAnalyses: ProjectCausalAnalysis[];
  allChains: CausalChainBundle[];
  criticalChains: CausalChainBundle[];
  portfolioStats: {
    totalDecisions: number;
    pendingDecisions: number;
    totalAgreements: number;
    overdueAgreements: number;
    completedAgreements: number;
    totalRisks: number;
    criticalRisks: number;
    criticalRisksOnCriticalPath: number;
    totalThreatenedMilestones: number;
    avgGobScore: number;
    avgDisScore: number;
  };
} {
  const projectAnalyses = projects.map(p => 
    buildCausalAnalysisForProject(p, tasks, decisions, agreements, risks)
  );

  const allChains = projectAnalyses.flatMap(pa => pa.chains);
  const criticalChains = allChains.filter(c => c.threatLevel === 'CRITICAL' || c.isThreateningMilestone);

  const totalDecisions = decisions.length;
  const pendingDecisions = decisions.filter(d => d.status === 'Propuesta' || d.status === 'En revisión').length;
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueAgreements = agreements.filter(a => a.status === 'Atrasado' || (a.status === 'Pendiente' && a.due_date < todayStr)).length;
  const completedAgreements = agreements.filter(a => a.status === 'Cumplido').length;
  const totalRisks = risks.length;
  const criticalRisks = risks.filter(r => r.severity_level === 'Crítico' && r.status === 'Activo').length;
  const criticalRisksOnCriticalPath = criticalChains.reduce((acc, c) => acc + c.risks.filter(r => r.severity_level === 'Crítico').length, 0);
  const totalThreatenedMilestones = criticalChains.length;

  const totalGob = projectAnalyses.reduce((acc, pa) => acc + pa.stats.cseaGobScore, 0);
  const totalDis = projectAnalyses.reduce((acc, pa) => acc + pa.stats.cseaDisScore, 0);
  const count = Math.max(1, projectAnalyses.length);

  return {
    projectAnalyses,
    allChains,
    criticalChains,
    portfolioStats: {
      totalDecisions,
      pendingDecisions,
      totalAgreements: agreements.length,
      overdueAgreements,
      completedAgreements,
      totalRisks,
      criticalRisks,
      criticalRisksOnCriticalPath,
      totalThreatenedMilestones,
      avgGobScore: Math.round(totalGob / count),
      avgDisScore: Math.round(totalDis / count),
    },
  };
}
