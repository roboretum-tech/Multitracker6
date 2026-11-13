import { Project, Task, TaskCpmNode, TaskVarianceMetric, CriticalPathAnalysis, VarianceStatus } from '../types';

/**
 * Calculates calendar duration in days between two ISO dates (inclusive).
 */
export function getDurationInDays(startDateStr?: string, endDateStr?: string): number {
  if (!startDateStr || !endDateStr) return 1;
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
  const diffTime = end.getTime() - start.getTime();
  const days = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, days);
}

/**
 * Calculates difference in days between two date strings (dateB - dateA).
 * Positive if dateB is later than dateA.
 */
export function getDaysDifference(dateAStr?: string, dateBStr?: string): number {
  if (!dateAStr || !dateBStr) return 0;
  const a = new Date(dateAStr);
  const b = new Date(dateBStr);
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return 0;
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Adds days to a Date object and returns a new Date.
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Topologically sorts tasks by dependencies.
 * Returns sorted tasks and whether cycles were detected.
 */
function topologicalSort(tasks: Task[]): { sorted: Task[]; hasCycles: boolean } {
  const inDegree: Record<string, number> = {};
  const adj: Record<string, string[]> = {};
  const taskMap = new Map<string, Task>();

  tasks.forEach(t => {
    taskMap.set(t.id, t);
    inDegree[t.id] = 0;
    adj[t.id] = [];
  });

  tasks.forEach(t => {
    const deps = (t.dependencies || []).filter(depId => taskMap.has(depId) && depId !== t.id);
    deps.forEach(depId => {
      adj[depId].push(t.id);
      inDegree[t.id] = (inDegree[t.id] || 0) + 1;
    });
  });

  const queue: string[] = [];
  Object.keys(inDegree).forEach(id => {
    if (inDegree[id] === 0) queue.push(id);
  });

  const sortedIds: string[] = [];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    sortedIds.push(curr);
    for (const neighbor of adj[curr] || []) {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) {
        queue.push(neighbor);
      }
    }
  }

  const hasCycles = sortedIds.length < tasks.length;
  // If cycles, fallback to ordering by start_date
  if (hasCycles) {
    const fallbackSorted = [...tasks].sort((a, b) => {
      const aTime = a.start_date ? new Date(a.start_date).getTime() : 0;
      const bTime = b.start_date ? new Date(b.start_date).getTime() : 0;
      return aTime - bTime;
    });
    return { sorted: fallbackSorted, hasCycles: true };
  }

  return { sorted: sortedIds.map(id => taskMap.get(id)!), hasCycles: false };
}

/**
 * Main Critical Path Method (CPM) calculation for a project's tasks.
 */
export function calculateCriticalPath(project: Project, tasks: Task[]): CriticalPathAnalysis {
  const projectTasks = tasks.filter(t => t.project_id === project.id);
  
  if (projectTasks.length === 0) {
    return {
      projectId: project.id,
      projectName: project.name,
      tasks: [],
      criticalTasks: [],
      criticalTaskIds: new Set<string>(),
      criticalPathDurationDays: 0,
      hasCycles: false,
      variances: [],
      baselineCapturedAt: project.baseline_captured_at,
      baselineEndDate: project.baseline_deadline || project.deadline,
      currentEndDate: project.deadline,
      projectEndVarianceDays: 0,
    };
  }

  // Predecessor and Successor relations
  const predecessorsMap: Record<string, string[]> = {};
  const successorsMap: Record<string, string[]> = {};
  const taskMap = new Map<string, Task>();

  projectTasks.forEach(t => {
    taskMap.set(t.id, t);
    predecessorsMap[t.id] = [];
    successorsMap[t.id] = [];
  });

  projectTasks.forEach(t => {
    const deps = (t.dependencies || []).filter(depId => taskMap.has(depId) && depId !== t.id);
    predecessorsMap[t.id] = deps;
    deps.forEach(depId => {
      successorsMap[depId].push(t.id);
    });
  });

  const { sorted: sortedTasks, hasCycles } = topologicalSort(projectTasks);

  // Reference base date for calculating network offsets
  let baseDate = project.start_date ? new Date(project.start_date) : new Date();
  projectTasks.forEach(t => {
    if (t.start_date) {
      const d = new Date(t.start_date);
      if (!isNaN(d.getTime()) && d < baseDate) {
        baseDate = d;
      }
    }
  });

  // 1. FORWARD PASS: Calculate Early Start (ES) and Early Finish (EF)
  const earlyStartMap: Record<string, Date> = {};
  const earlyFinishMap: Record<string, Date> = {};

  sortedTasks.forEach(task => {
    const duration = getDurationInDays(task.start_date, task.end_date);
    const preds = predecessorsMap[task.id];

    let taskES: Date;
    if (preds.length === 0) {
      taskES = task.start_date ? new Date(task.start_date) : new Date(baseDate);
    } else {
      let maxPredEF = new Date(0);
      preds.forEach(predId => {
        const predEF = earlyFinishMap[predId];
        if (predEF && predEF.getTime() > maxPredEF.getTime()) {
          maxPredEF = predEF;
        }
      });
      // Predecessor must finish before this task starts (FS Finish-to-Start)
      const afterPredDate = addDays(maxPredEF, 1);
      const plannedStart = task.start_date ? new Date(task.start_date) : afterPredDate;
      taskES = plannedStart.getTime() > afterPredDate.getTime() ? plannedStart : afterPredDate;
    }

    const taskEF = addDays(taskES, duration - 1);
    earlyStartMap[task.id] = taskES;
    earlyFinishMap[task.id] = taskEF;
  });

  // Project completion date is the maximum EF among all tasks or project.deadline
  let projectEF = project.deadline ? new Date(project.deadline) : new Date(baseDate);
  projectTasks.forEach(t => {
    const ef = earlyFinishMap[t.id];
    if (ef && ef.getTime() > projectEF.getTime()) {
      projectEF = ef;
    }
  });

  // 2. BACKWARD PASS: Calculate Late Finish (LF) and Late Start (LS)
  const lateFinishMap: Record<string, Date> = {};
  const lateStartMap: Record<string, Date> = {};

  const reverseSorted = [...sortedTasks].reverse();

  reverseSorted.forEach(task => {
    const duration = getDurationInDays(task.start_date, task.end_date);
    const succs = successorsMap[task.id];

    let taskLF: Date;
    if (succs.length === 0) {
      // If task has explicit end_date later than projectEF, or projectEF
      const plannedEnd = task.end_date ? new Date(task.end_date) : projectEF;
      taskLF = plannedEnd.getTime() > projectEF.getTime() ? plannedEnd : projectEF;
    } else {
      let minSuccLS = new Date(8640000000000000);
      succs.forEach(succId => {
        const succLS = lateStartMap[succId];
        if (succLS && succLS.getTime() < minSuccLS.getTime()) {
          minSuccLS = succLS;
        }
      });
      taskLF = addDays(minSuccLS, -1);
    }

    const taskLS = addDays(taskLF, -(duration - 1));
    lateFinishMap[task.id] = taskLF;
    lateStartMap[task.id] = taskLS;
  });

  // 3. SLACK / FLOAT & CRITICAL PATH IDENTIFICATION
  const nodes: TaskCpmNode[] = [];
  const criticalTaskIds = new Set<string>();

  // Determine minimum slack across project
  let minSlackDays = Number.MAX_SAFE_INTEGER;

  projectTasks.forEach(task => {
    const es = earlyStartMap[task.id];
    const ls = lateStartMap[task.id];
    const ef = earlyFinishMap[task.id];
    const duration = getDurationInDays(task.start_date, task.end_date);
    
    const slackMillis = ls.getTime() - es.getTime();
    const rawSlack = Math.round(slackMillis / (1000 * 60 * 60 * 24));
    const slack = Math.max(0, rawSlack);

    if (slack < minSlackDays) {
      minSlackDays = slack;
    }

    nodes.push({
      task,
      durationDays: duration,
      predecessors: predecessorsMap[task.id],
      successors: successorsMap[task.id],
      earlyStart: es,
      earlyFinish: ef,
      lateStart: ls,
      lateFinish: lateFinishMap[task.id],
      slackDays: slack,
      isCritical: false, // will update below
    });
  });

  // Critical tasks have slack <= 0, or equal to the minimum slack if tight schedule
  nodes.forEach(node => {
    // If slack is 0 (or within 0 days of minSlack when minSlack > 0)
    if (node.slackDays <= 0 || (minSlackDays > 0 && node.slackDays === minSlackDays)) {
      node.isCritical = true;
      criticalTaskIds.add(node.task.id);
    }
  });

  const criticalTasks = nodes.filter(n => n.isCritical);

  // 4. BASELINE & SCHEDULE VARIANCE ANALYSIS
  const variances: TaskVarianceMetric[] = projectTasks.map(task => {
    const isCrit = criticalTaskIds.has(task.id);
    const hasBaseline = Boolean(task.baseline_start_date || task.baseline_end_date);
    const baselineDuration = hasBaseline 
      ? (task.baseline_duration_days || getDurationInDays(task.baseline_start_date, task.baseline_end_date))
      : getDurationInDays(task.start_date, task.end_date);
    
    const currentDuration = getDurationInDays(task.start_date, task.end_date);
    const durationVariance = currentDuration - baselineDuration;

    const startVariance = hasBaseline && task.baseline_start_date && task.start_date
      ? getDaysDifference(task.baseline_start_date, task.start_date)
      : 0;

    const endVariance = hasBaseline && task.baseline_end_date && task.end_date
      ? getDaysDifference(task.baseline_end_date, task.end_date)
      : 0;

    const node = nodes.find(n => n.task.id === task.id);
    const slack = node ? node.slackDays : 0;

    // Impact on Project End Date
    let impactOnProjectEndDays = 0;
    if (isCrit) {
      // Critical tasks propagate delay 100% to project completion
      impactOnProjectEndDays = Math.max(0, endVariance);
    } else {
      // Non-critical tasks only impact project end date if delay exceeds total slack
      impactOnProjectEndDays = Math.max(0, endVariance - slack);
    }

    let status: VarianceStatus = 'no_baseline';
    if (hasBaseline) {
      if (endVariance > 0) {
        status = 'delayed';
      } else if (endVariance < 0) {
        status = 'ahead';
      } else {
        status = 'on_track';
      }
    }

    return {
      task,
      isCritical: isCrit,
      hasBaseline,
      baselineStart: task.baseline_start_date,
      baselineEnd: task.baseline_end_date,
      currentStart: task.start_date,
      currentEnd: task.end_date,
      baselineDuration,
      currentDuration,
      durationVarianceDays: durationVariance,
      startVarianceDays: startVariance,
      endVarianceDays: endVariance,
      slackDays: slack,
      impactOnProjectEndDays,
      status,
    };
  });

  // Calculate project-level baseline variance
  const baselineProjectEnd = project.baseline_deadline || project.deadline;
  const currentProjectEnd = project.deadline || (projectEF ? projectEF.toISOString().split('T')[0] : undefined);
  const projectEndVarianceDays = (baselineProjectEnd && currentProjectEnd) 
    ? getDaysDifference(baselineProjectEnd, currentProjectEnd)
    : 0;

  // Critical path duration in calendar days
  let earliestStart: Date | undefined;
  let latestFinish: Date | undefined;
  criticalTasks.forEach(ct => {
    if (!earliestStart || ct.earlyStart < earliestStart) earliestStart = ct.earlyStart;
    if (!latestFinish || ct.earlyFinish > latestFinish) latestFinish = ct.earlyFinish;
  });

  const cpDuration = earliestStart && latestFinish 
    ? Math.max(1, Math.round((latestFinish.getTime() - earliestStart.getTime()) / (1000 * 60 * 60 * 24)) + 1)
    : 0;

  return {
    projectId: project.id,
    projectName: project.name,
    tasks: nodes,
    criticalTasks,
    criticalTaskIds,
    criticalPathDurationDays: cpDuration,
    earliestStartDate: earliestStart,
    latestFinishDate: latestFinish,
    hasCycles,
    variances,
    baselineCapturedAt: project.baseline_captured_at,
    baselineEndDate: baselineProjectEnd,
    currentEndDate: currentProjectEnd,
    projectEndVarianceDays,
  };
}

/**
 * Format variance number with friendly styling (+N días, -N días, A tiempo)
 */
export function formatVarianceDays(days: number): { text: string; badgeClass: string; isDelayed: boolean; isAhead: boolean } {
  if (days > 0) {
    return {
      text: `+${days} d`,
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
      isDelayed: true,
      isAhead: false,
    };
  } else if (days < 0) {
    return {
      text: `${days} d`,
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
      isDelayed: false,
      isAhead: true,
    };
  }
  return {
    text: '0 d (En tiempo)',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300 font-medium',
    isDelayed: false,
    isAhead: false,
  };
}
