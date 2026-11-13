import { supabase, supabaseUrl, supabaseAnonKey, projectRef } from './supabase';
import { Project, ProjectStatus, Task, Meeting, Communication, Invoice, TeamMember, DashboardSummary, ProjectDecision, ProjectAgreement, ProjectRisk } from '../types';
import { initialProjects, initialTasks, initialMeetings, initialCommunications, initialInvoices, initialTeamMembers, initialDecisions, initialAgreements, initialRisks } from '../data/initialData';

export interface DataState {
  projects: Project[];
  tasks: Task[];
  meetings: Meeting[];
  communications: Communication[];
  invoices: Invoice[];
  teamMembers: TeamMember[];
  decisions: ProjectDecision[];
  agreements: ProjectAgreement[];
  risks: ProjectRisk[];
  isUsingSupabase: boolean;
  supabaseError: string | null;
}

export interface SupabaseTableReport {
  name: string;
  exists: boolean;
  count: number;
  status: 'ready' | 'missing' | 'error';
  errorMessage?: string;
  errorCode?: string;
}

export interface SupabaseDiagnosticReport {
  timestamp: string;
  endpoint: string;
  projectRef: string;
  authHealthy: boolean;
  authVersion?: string;
  latencyMs: number;
  tables: Record<string, SupabaseTableReport>;
  allTablesExist: boolean;
  hasDataInCloud: boolean;
  statusSummary: 'connected_ready' | 'connected_missing_tables' | 'connection_failed';
  message: string;
}

const LOCAL_STORAGE_KEY = 'project_central_local_data_v1';

function cleanGoogleDocsLinks(projects: Project[]): Project[] {
  if (!Array.isArray(projects)) return [];
  return projects.map((p) => {
    if (p.key_document_links && p.key_document_links.includes('docs.google.com')) {
      return { ...p, key_document_links: '' };
    }
    return p;
  });
}

export function syncProjectsWithTasks(projects: Project[], tasks: Task[]): Project[] {
  const today = new Date().toISOString().split('T')[0];
  const tasksByProject: Record<string, Task[]> = {};
  
  tasks.forEach((t) => {
    if (!t.project_id) return;
    if (!tasksByProject[t.project_id]) {
      tasksByProject[t.project_id] = [];
    }
    tasksByProject[t.project_id].push(t);
  });

  return projects.map((p) => {
    const pTasks = tasksByProject[p.id] || [];
    const totalTasks = pTasks.length;

    if (totalTasks === 0) {
      return {
        ...p,
        task_count: 0,
        overdue_task_count: 0,
        progress_percentage: p.progress_percentage || 0,
      };
    }

    const completedTasks = pTasks.filter((t) => t.is_done || t.status === 'Completado').length;
    const overdueTasks = pTasks.filter((t) => !t.is_done && t.status !== 'Completado' && t.end_date && t.end_date < today).length;
    const progressPercentage = Math.round((completedTasks / totalTasks) * 100);

    let newStatus: ProjectStatus = p.status;
    if (progressPercentage === 100 && (p.status === 'En curso' || p.status === 'No iniciado')) {
      newStatus = 'Completado';
    } else if (progressPercentage > 0 && progressPercentage < 100 && (p.status === 'No iniciado' || p.status === 'Completado')) {
      newStatus = 'En curso';
    }

    return {
      ...p,
      task_count: totalTasks,
      overdue_task_count: overdueTasks,
      progress_percentage: progressPercentage,
      status: newStatus,
    };
  });
}

export interface StoredLocalData {
  projects: Project[];
  tasks: Task[];
  meetings: Meeting[];
  communications: Communication[];
  invoices: Invoice[];
  teamMembers: TeamMember[];
  decisions: ProjectDecision[];
  agreements: ProjectAgreement[];
  risks: ProjectRisk[];
}

export function getStoredLocalData(): StoredLocalData {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.projects && parsed.tasks) {
        parsed.projects = syncProjectsWithTasks(cleanGoogleDocsLinks(parsed.projects), parsed.tasks);
      } else if (parsed.projects) {
        parsed.projects = cleanGoogleDocsLinks(parsed.projects);
      }
      if (!Array.isArray(parsed.decisions) || parsed.decisions.length === 0) {
        parsed.decisions = initialDecisions;
      }
      if (!Array.isArray(parsed.agreements) || parsed.agreements.length === 0) {
        parsed.agreements = initialAgreements;
      }
      if (!Array.isArray(parsed.risks) || parsed.risks.length === 0) {
        parsed.risks = initialRisks;
      }
      return parsed as StoredLocalData;
    }
  } catch (e) {
    console.warn('Failed to read localStorage:', e);
  }
  return {
    projects: syncProjectsWithTasks(cleanGoogleDocsLinks(initialProjects), initialTasks),
    tasks: initialTasks,
    meetings: initialMeetings,
    communications: initialCommunications,
    invoices: initialInvoices,
    teamMembers: initialTeamMembers,
    decisions: initialDecisions,
    agreements: initialAgreements,
    risks: initialRisks,
  };
}

export function saveStoredLocalData(data: Partial<DataState>) {
  try {
    const current = getStoredLocalData();
    const updated = { ...current, ...data };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save to localStorage:', e);
  }
}

export function cleanDateForDb(v: any): string | null {
  if (!v || typeof v !== 'string' || v.trim() === '') return null;
  return v.trim();
}

export function cleanFkForDb(v: any): string | null {
  if (!v || typeof v !== 'string' || v.trim() === '') return null;
  return v.trim();
}

export function cleanProjectForDb(p: any) {
  return {
    id: p.id,
    user_id: cleanFkForDb(p.user_id),
    organization_id: cleanFkForDb(p.organization_id) || 'org-capricorn-corp',
    name: p.name || 'Iniciativa Sin Título',
    category: p.category || 'Estrategía',
    status: p.status || 'No iniciado',
    priority: p.priority || 'Medio',
    custom_tags: Array.isArray(p.custom_tags) ? p.custom_tags : [],
    start_date: cleanDateForDb(p.start_date),
    deadline: cleanDateForDb(p.deadline),
    completion_date: cleanDateForDb(p.completion_date),
    progress_percentage: typeof p.progress_percentage === 'number' ? p.progress_percentage : Number(p.progress_percentage) || 0,
    estimated_value: typeof p.estimated_value === 'number' ? p.estimated_value : Number(p.estimated_value) || 0,
    key_document_links: p.key_document_links && !p.key_document_links.includes('docs.google.com') ? p.key_document_links : null,
    baseline_captured_at: cleanDateForDb(p.baseline_captured_at),
    baseline_start_date: cleanDateForDb(p.baseline_start_date),
    baseline_deadline: cleanDateForDb(p.baseline_deadline),
    responsible_id: cleanFkForDb(p.responsible_id),
    accountable_id: cleanFkForDb(p.accountable_id),
    consulted_id: cleanFkForDb(p.consulted_id),
    informed_id: cleanFkForDb(p.informed_id),
    task_count: Number(p.task_count) || 0,
    overdue_task_count: Number(p.overdue_task_count) || 0,
    meeting_count: Number(p.meeting_count) || 0,
    comm_count: Number(p.comm_count) || 0,
    total_invoiced: Number(p.total_invoiced) || 0,
    created_at: p.created_at || new Date().toISOString(),
    updated_at: p.updated_at || new Date().toISOString(),
  };
}

export function cleanTaskForDb(t: any) {
  return {
    id: t.id,
    project_id: t.project_id,
    user_id: cleanFkForDb(t.user_id),
    organization_id: cleanFkForDb(t.organization_id) || 'org-capricorn-corp',
    name: t.name || 'Entregable',
    start_date: cleanDateForDb(t.start_date),
    end_date: cleanDateForDb(t.end_date),
    status: t.status || (t.is_done ? 'Completado' : 'No iniciada'),
    priority: t.priority || 'Medio',
    owner_id: cleanFkForDb(t.owner_id),
    is_done: Boolean(t.is_done || t.status === 'Completado'),
    notes: t.notes || null,
    dependencies: Array.isArray(t.dependencies) ? t.dependencies : [],
    baseline_start_date: cleanDateForDb(t.baseline_start_date),
    baseline_end_date: cleanDateForDb(t.baseline_end_date),
    baseline_duration_days: t.baseline_duration_days ? Number(t.baseline_duration_days) : null,
    created_at: t.created_at || new Date().toISOString(),
    updated_at: t.updated_at || new Date().toISOString(),
  };
}

export function cleanMeetingForDb(m: any) {
  return {
    id: m.id,
    project_id: m.project_id,
    user_id: cleanFkForDb(m.user_id),
    organization_id: cleanFkForDb(m.organization_id) || 'org-capricorn-corp',
    name: m.name || 'Comité / Sesión',
    meeting_date: m.meeting_date || new Date().toISOString(),
    meeting_type: m.meeting_type || 'Reunión de alineación',
    status: m.status || 'Reunión programada',
    attendees: m.attendees || null,
    notes: m.notes || null,
    created_at: m.created_at || new Date().toISOString(),
  };
}

export function cleanCommunicationForDb(c: any) {
  return {
    id: c.id,
    project_id: c.project_id,
    user_id: cleanFkForDb(c.user_id),
    organization_id: cleanFkForDb(c.organization_id) || 'org-capricorn-corp',
    comm_date: c.comm_date || new Date().toISOString(),
    comm_type: c.comm_type || 'Correo electrónico',
    outcome: c.outcome || null,
    notes: c.notes || null,
    created_at: c.created_at || new Date().toISOString(),
  };
}

export function cleanInvoiceForDb(i: any) {
  return {
    id: i.id,
    project_id: i.project_id,
    user_id: cleanFkForDb(i.user_id),
    organization_id: cleanFkForDb(i.organization_id) || 'org-capricorn-corp',
    invoice_number: i.invoice_number || 'INV-001',
    amount: Number(i.amount) || 0,
    sent_date: cleanDateForDb(i.sent_date),
    due_date: cleanDateForDb(i.due_date),
    status: i.status || 'Aún no enviado',
    notes: i.notes || null,
    created_at: i.created_at || new Date().toISOString(),
  };
}

export function cleanTeamMemberForDb(tm: any) {
  return {
    id: tm.id,
    user_id: cleanFkForDb(tm.user_id),
    organization_id: cleanFkForDb(tm.organization_id) || 'org-capricorn-corp',
    name: tm.name || 'Consultor',
    role: tm.role || null,
    notes: tm.notes || (tm.email ? `Email: ${tm.email}` : null),
    created_at: tm.created_at || new Date().toISOString(),
  };
}

export function cleanDecisionForDb(d: any) {
  return {
    id: d.id,
    code: d.code || 'D-000',
    project_id: d.project_id,
    user_id: cleanFkForDb(d.user_id),
    organization_id: cleanFkForDb(d.organization_id) || 'org-capricorn-corp',
    title: d.title || 'Decisión Sin Título',
    description: d.description || '',
    decision_maker: d.decision_maker || 'Comité Directivo',
    decision_date: cleanDateForDb(d.decision_date) || new Date().toISOString().split('T')[0],
    status: d.status || 'Propuesta',
    impact_level: d.impact_level || 'Medio',
    justification: d.justification || null,
    linked_task_id: cleanFkForDb(d.linked_task_id),
    linked_risk_id: cleanFkForDb(d.linked_risk_id),
    created_at: d.created_at || new Date().toISOString(),
    updated_at: d.updated_at || new Date().toISOString(),
  };
}

export function cleanAgreementForDb(a: any) {
  return {
    id: a.id,
    code: a.code || 'A-000',
    project_id: a.project_id,
    user_id: cleanFkForDb(a.user_id),
    organization_id: cleanFkForDb(a.organization_id) || 'org-capricorn-corp',
    description: a.description || 'Acuerdo de gestión',
    responsible_name: a.responsible_name || 'Sin Asignar',
    due_date: cleanDateForDb(a.due_date) || new Date().toISOString().split('T')[0],
    status: a.status || 'Pendiente',
    priority: a.priority || 'Media',
    linked_decision_id: cleanFkForDb(a.linked_decision_id),
    linked_task_id: cleanFkForDb(a.linked_task_id),
    meeting_id: cleanFkForDb(a.meeting_id),
    completion_date: cleanDateForDb(a.completion_date),
    notes: a.notes || null,
    created_at: a.created_at || new Date().toISOString(),
    updated_at: a.updated_at || new Date().toISOString(),
  };
}

export function cleanRiskForDb(r: any) {
  const prob = Number(r.probability) || 3;
  const imp = Number(r.impact) || 3;
  const score = prob * imp;
  let level = r.severity_level;
  if (!level) {
    level = score >= 16 ? 'Crítico' : score >= 10 ? 'Alto' : score >= 5 ? 'Medio' : 'Bajo';
  }

  return {
    id: r.id,
    code: r.code || 'R-000',
    project_id: r.project_id,
    user_id: cleanFkForDb(r.user_id),
    organization_id: cleanFkForDb(r.organization_id) || 'org-capricorn-corp',
    title: r.title || 'Riesgo Sin Título',
    description: r.description || '',
    category: r.category || 'Operativo',
    probability: prob,
    impact: imp,
    severity_score: score,
    severity_level: level,
    status: r.status || 'Activo',
    mitigation_strategy: r.mitigation_strategy || 'Monitoreo preventivo continuo',
    mitigation_owner: r.mitigation_owner || 'Líder de Proyecto',
    contingency_plan: r.contingency_plan || null,
    linked_task_id: cleanFkForDb(r.linked_task_id),
    linked_decision_id: cleanFkForDb(r.linked_decision_id),
    review_date: cleanDateForDb(r.review_date),
    created_at: r.created_at || new Date().toISOString(),
    updated_at: r.updated_at || new Date().toISOString(),
  };
}

export interface FetchDataFilterOptions {
  userId?: string;
  organizationId?: string;
  isSuperAdmin?: boolean;
}

export function filterByTenant<T extends { user_id?: string; organization_id?: string }>(
  items: T[], 
  options?: FetchDataFilterOptions
): T[] {
  if (!items || !Array.isArray(items)) return [];
  if (!options || (!options.userId && !options.organizationId)) return items;
  
  const { userId, organizationId } = options;
  return items.filter(item => {
    // If item explicitly has user_id matching current user
    if (userId && item.user_id && item.user_id === userId) return true;
    // If item explicitly has organization_id matching current org
    if (organizationId && item.organization_id && item.organization_id === organizationId) return true;
    // If item has no tenant assigned yet (e.g. legacy/initial project data), allow access to default organization
    if (!item.user_id && !item.organization_id && (!organizationId || organizationId === 'org-capricorn-corp')) return true;
    return false;
  });
}

async function queryTableWithTenantFilter(
  tableName: string,
  filterOptions?: FetchDataFilterOptions,
  orderBy?: { column: string; ascending: boolean }
) {
  let query = supabase.from(tableName).select('*');
  if (orderBy) {
    query = query.order(orderBy.column, { ascending: orderBy.ascending });
  }

  // Include user_id or organization_id in query if provided
  if (filterOptions?.userId || filterOptions?.organizationId) {
    const { userId, organizationId } = filterOptions;
    if (userId && organizationId) {
      query = query.or(`user_id.eq.${userId},organization_id.eq.${organizationId}`);
    } else if (userId) {
      query = query.eq('user_id', userId);
    } else if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }
  }

  try {
    const res = await query;
    if (res.error) {
      // If error indicates column does not exist on table yet (e.g., PGRST100 / 42703 / column not found)
      const errMsg = res.error.message || '';
      if (errMsg.toLowerCase().includes('column') || res.error.code === '42703' || res.error.code === 'PGRST100') {
        console.warn(`[Supabase Query] Columna user_id u organization_id no detectada en '${tableName}'. Ejecutando consulta general y aplicando filtro privado en memoria.`);
        let fallbackQuery = supabase.from(tableName).select('*');
        if (orderBy) fallbackQuery = fallbackQuery.order(orderBy.column, { ascending: orderBy.ascending });
        return await fallbackQuery;
      }
    }
    return res;
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function fetchAllData(filterOptions?: FetchDataFilterOptions): Promise<DataState> {
  let isUsingSupabase = false;
  let supabaseError: string | null = null;

  try {
    // 1. Query Supabase with tenant filter (user_id / organization_id)
    let { data: projData, error: projErr } = await queryTableWithTenantFilter(
      'projects', 
      filterOptions, 
      { column: 'created_at', ascending: false }
    );

    if (projErr) {
      throw projErr;
    }

    let { data: taskData } = await queryTableWithTenantFilter('tasks', filterOptions);
    let { data: meetData } = await queryTableWithTenantFilter('meetings', filterOptions);
    let { data: commData } = await queryTableWithTenantFilter('communications', filterOptions);
    let { data: invData } = await queryTableWithTenantFilter('invoices', filterOptions);
    let { data: teamData } = await queryTableWithTenantFilter('team_members', filterOptions);

    isUsingSupabase = true;

    // Retrieve any local data that may have been loaded in this browser previously
    const local = getStoredLocalData();

    // In-memory merge if local has items not yet in cloud, without hammering Supabase with automatic background upserts
    const cloudProjIds = new Set((projData || []).map((p: Project) => p.id));
    const localUnsyncedProjects = (local.projects || []).filter((p: Project) => p.id && !cloudProjIds.has(p.id));
    const rawProjects = projData && projData.length > 0 
      ? [...projData, ...localUnsyncedProjects]
      : (local.projects && local.projects.length > 0 ? local.projects : initialProjects);
    const rawTasks = taskData && taskData.length > 0 ? taskData : (local.tasks && local.tasks.length > 0 ? local.tasks : initialTasks);
    const rawMeetings = meetData && meetData.length > 0 ? meetData : (local.meetings && local.meetings.length > 0 ? local.meetings : initialMeetings);
    const rawComms = commData && commData.length > 0 ? commData : (local.communications && local.communications.length > 0 ? local.communications : initialCommunications);
    const rawInvoices = invData && invData.length > 0 ? invData : (local.invoices && local.invoices.length > 0 ? local.invoices : initialInvoices);
    const rawTeam = teamData && teamData.length > 0 ? teamData : (local.teamMembers && local.teamMembers.length > 0 ? local.teamMembers : initialTeamMembers);
    const rawDecisions = local.decisions && local.decisions.length > 0 ? local.decisions : initialDecisions;
    const rawAgreements = local.agreements && local.agreements.length > 0 ? local.agreements : initialAgreements;
    const rawRisks = local.risks && local.risks.length > 0 ? local.risks : initialRisks;

    // Apply tenant privacy filtering ensuring user only accesses their authorized private information
    const projects = filterByTenant<Project>(syncProjectsWithTasks(cleanGoogleDocsLinks(rawProjects), rawTasks), filterOptions);
    const tasks = filterByTenant<Task>(rawTasks, filterOptions);
    const meetings = filterByTenant<Meeting>(rawMeetings, filterOptions);
    const communications = filterByTenant<Communication>(rawComms, filterOptions);
    const invoices = filterByTenant<Invoice>(rawInvoices, filterOptions);
    const teamMembers = filterByTenant<TeamMember>(rawTeam, filterOptions);
    const decisions = filterByTenant<ProjectDecision>(rawDecisions, filterOptions);
    const agreements = filterByTenant<ProjectAgreement>(rawAgreements, filterOptions);
    const risks = filterByTenant<ProjectRisk>(rawRisks, filterOptions);

    // Keep local cache mirrored with cloud data
    saveStoredLocalData({
      projects,
      tasks,
      meetings,
      communications,
      invoices,
      teamMembers,
      decisions,
      agreements,
      risks,
    });

    return {
      projects,
      tasks,
      meetings,
      communications,
      invoices,
      teamMembers,
      decisions,
      agreements,
      risks,
      isUsingSupabase,
      supabaseError: null,
    };
  } catch (err: any) {
    console.warn('Supabase offline or tables missing, using local storage fallback:', err?.message || err);
    supabaseError = err?.message || 'Tables not found in Supabase schema cache';
    const local = getStoredLocalData();
    const rawTasks = local.tasks || initialTasks;
    const rawProjects = syncProjectsWithTasks(local.projects || initialProjects, rawTasks);
    return {
      projects: filterByTenant<Project>(rawProjects, filterOptions),
      tasks: filterByTenant<Task>(rawTasks, filterOptions),
      meetings: filterByTenant<Meeting>(local.meetings || initialMeetings, filterOptions),
      communications: filterByTenant<Communication>(local.communications || initialCommunications, filterOptions),
      invoices: filterByTenant<Invoice>(local.invoices || initialInvoices, filterOptions),
      teamMembers: filterByTenant<TeamMember>(local.teamMembers || initialTeamMembers, filterOptions),
      decisions: filterByTenant<ProjectDecision>(local.decisions || initialDecisions, filterOptions),
      agreements: filterByTenant<ProjectAgreement>(local.agreements || initialAgreements, filterOptions),
      risks: filterByTenant<ProjectRisk>(local.risks || initialRisks, filterOptions),
      isUsingSupabase: false,
      supabaseError,
    };
  }
}

export function computeDashboardSummary(projects: Project[], tasks: Task[], meetings: Meeting[], comms: Communication[]): DashboardSummary {
  const totalProjects = projects.length;
  const totalTasks = tasks.length;
  
  const todayStr = new Date().toISOString().split('T')[0];
  const totalOverdueTasks = tasks.filter(t => !t.is_done && t.status !== 'Completado' && t.end_date && t.end_date < todayStr).length;
  
  const totalMeetings = meetings.length;
  const totalCommunications = comms.length;
  const totalEstimatedValue = projects.reduce((acc, p) => acc + (Number(p.estimated_value) || 0), 0);

  return {
    total_projects: totalProjects,
    total_tasks: totalTasks,
    total_overdue_tasks: totalOverdueTasks,
    total_meetings: totalMeetings,
    total_communications: totalCommunications,
    total_estimated_value: totalEstimatedValue,
  };
}

/**
 * Executes a full diagnostic probe on the Supabase project connection and tables
 */
export async function runSupabaseDiagnostic(): Promise<SupabaseDiagnosticReport> {
  const startTime = Date.now();
  let authHealthy = false;
  let authVersion = 'Desconocida';

  // 1. Probe Auth / Gateway endpoint
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/health`, {
      headers: {
        apikey: supabaseAnonKey,
      },
    });
    if (res.ok) {
      authHealthy = true;
      const json = await res.json();
      if (json.version) authVersion = json.version;
    }
  } catch (err) {
    console.warn('Supabase Auth health probe failed:', err);
  }

  const latencyMs = Date.now() - startTime;

  // 2. Probe Table Availability
  const targetTables = ['projects', 'tasks', 'team_members', 'meetings', 'communications', 'invoices'];
  const tableReports: Record<string, SupabaseTableReport> = {};
  let allTablesExist = true;
  let hasDataInCloud = false;

  for (const tableName of targetTables) {
    try {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .limit(1);

      if (error) {
        allTablesExist = false;
        const isPgrst205 = error.code === 'PGRST205';
        tableReports[tableName] = {
          name: tableName,
          exists: false,
          count: 0,
          status: isPgrst205 ? 'missing' : 'error',
          errorMessage: isPgrst205 
            ? "Tabla no encontrada en el esquema de base de datos (Ejecuta el Script DDL en el SQL Editor)" 
            : error.message,
          errorCode: error.code || 'UNKNOWN',
        };
      } else {
        const rowCount = count !== null ? count : (data ? data.length : 0);
        if (rowCount > 0) hasDataInCloud = true;
        tableReports[tableName] = {
          name: tableName,
          exists: true,
          count: rowCount,
          status: 'ready',
        };
      }
    } catch (err: any) {
      allTablesExist = false;
      tableReports[tableName] = {
        name: tableName,
        exists: false,
        count: 0,
        status: 'error',
        errorMessage: err?.message || 'Error de red al consultar tabla',
        errorCode: 'NETWORK_ERR',
      };
    }
  }

  let statusSummary: 'connected_ready' | 'connected_missing_tables' | 'connection_failed';
  let message = '';

  if (allTablesExist) {
    statusSummary = 'connected_ready';
    message = 'La conexión con Supabase está 100% activa, autenticada y todas las tablas del esquema están listas.';
  } else if (authHealthy) {
    statusSummary = 'connected_missing_tables';
    message = 'La conexión y autenticación con Supabase son exitosas, pero las tablas en PostgreSQL aún no han sido creadas. La aplicación opera con respaldo en Local Storage.';
  } else {
    statusSummary = 'connection_failed';
    message = 'No fue posible establecer comunicación con el endpoint de Supabase.';
  }

  return {
    timestamp: new Date().toISOString(),
    endpoint: supabaseUrl,
    projectRef,
    authHealthy,
    authVersion,
    latencyMs,
    tables: tableReports,
    allTablesExist,
    hasDataInCloud,
    statusSummary,
    message,
  };
}

/**
 * Uploads local or supplied records to Supabase tables with robust schema sanitization
 */
export async function syncLocalDataToSupabase(dataToSync?: Partial<DataState>): Promise<{
  success: boolean;
  message: string;
  syncedCounts?: Record<string, number>;
}> {
  const local = dataToSync || getStoredLocalData();
  const counts: Record<string, number> = {};

  try {
    // 1. Sync Team Members first (FK dependencies)
    if (local.teamMembers && local.teamMembers.length > 0) {
      const sanitizedTeam = local.teamMembers.map(cleanTeamMemberForDb);
      const { error: tmErr } = await supabase.from('team_members').upsert(sanitizedTeam);
      if (tmErr) throw new Error(`Error sincronizando equipo: ${tmErr.message}`);
      counts.team_members = sanitizedTeam.length;
    }

    // 2. Sync Projects
    if (local.projects && local.projects.length > 0) {
      const sanitizedProjects = local.projects.map(cleanProjectForDb);
      const { error: pErr } = await supabase.from('projects').upsert(sanitizedProjects);
      if (pErr) throw new Error(`Error sincronizando proyectos: ${pErr.message}`);
      counts.projects = sanitizedProjects.length;
    }

    // 3. Sync Tasks
    if (local.tasks && local.tasks.length > 0) {
      const sanitizedTasks = local.tasks.map(cleanTaskForDb);
      const { error: tErr } = await supabase.from('tasks').upsert(sanitizedTasks);
      if (tErr) throw new Error(`Error sincronizando tareas: ${tErr.message}`);
      counts.tasks = sanitizedTasks.length;
    }

    // 4. Sync Meetings
    if (local.meetings && local.meetings.length > 0) {
      const sanitizedMeetings = local.meetings.map(cleanMeetingForDb);
      const { error: mErr } = await supabase.from('meetings').upsert(sanitizedMeetings);
      if (mErr) throw new Error(`Error sincronizando reuniones: ${mErr.message}`);
      counts.meetings = sanitizedMeetings.length;
    }

    // 5. Sync Communications
    if (local.communications && local.communications.length > 0) {
      const sanitizedComms = local.communications.map(cleanCommunicationForDb);
      const { error: cErr } = await supabase.from('communications').upsert(sanitizedComms);
      if (cErr) throw new Error(`Error sincronizando comunicaciones: ${cErr.message}`);
      counts.communications = sanitizedComms.length;
    }

    // 6. Sync Invoices
    if (local.invoices && local.invoices.length > 0) {
      const sanitizedInvoices = local.invoices.map(cleanInvoiceForDb);
      const { error: iErr } = await supabase.from('invoices').upsert(sanitizedInvoices);
      if (iErr) throw new Error(`Error sincronizando facturación: ${iErr.message}`);
      counts.invoices = sanitizedInvoices.length;
    }

    return {
      success: true,
      message: 'Todos los datos fueron sincronizados exitosamente con la base de datos Supabase en la nube.',
      syncedCounts: counts,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Fallo durante la sincronización con Supabase.',
    };
  }
}

/**
 * Restores a full JSON backup into both local storage and the Supabase Cloud database
 */
export async function restoreDataFromBackup(backupRaw: any): Promise<{
  success: boolean;
  message: string;
  counts?: Record<string, number>;
}> {
  try {
    if (!backupRaw || typeof backupRaw !== 'object') {
      throw new Error('El archivo de respaldo no tiene un formato JSON válido.');
    }

    // Extract records supporting both root level and nested portfolio format
    const projects: Project[] = Array.isArray(backupRaw.projects)
      ? backupRaw.projects
      : (backupRaw.portfolio?.projects || []);

    const tasks: Task[] = Array.isArray(backupRaw.tasks)
      ? backupRaw.tasks
      : (backupRaw.portfolio?.tasks || []);

    const meetings: Meeting[] = Array.isArray(backupRaw.meetings)
      ? backupRaw.meetings
      : (backupRaw.portfolio?.meetings || []);

    const communications: Communication[] = Array.isArray(backupRaw.communications)
      ? backupRaw.communications
      : (backupRaw.portfolio?.communications || []);

    const invoices: Invoice[] = Array.isArray(backupRaw.invoices)
      ? backupRaw.invoices
      : (backupRaw.portfolio?.invoices || []);

    const teamMembers: TeamMember[] = Array.isArray(backupRaw.teamMembers)
      ? backupRaw.teamMembers
      : (backupRaw.portfolio?.team_members || backupRaw.portfolio?.teamMembers || []);

    const decisions: ProjectDecision[] = Array.isArray(backupRaw.decisions)
      ? backupRaw.decisions
      : (backupRaw.portfolio?.decisions || initialDecisions);

    const agreements: ProjectAgreement[] = Array.isArray(backupRaw.agreements)
      ? backupRaw.agreements
      : (backupRaw.portfolio?.agreements || initialAgreements);

    const risks: ProjectRisk[] = Array.isArray(backupRaw.risks)
      ? backupRaw.risks
      : (backupRaw.portfolio?.risks || initialRisks);

    if (projects.length === 0 && tasks.length === 0) {
      throw new Error('El archivo no contiene proyectos o tareas para restaurar.');
    }

    const payload: Partial<DataState> = {
      projects: syncProjectsWithTasks(cleanGoogleDocsLinks(projects), tasks),
      tasks,
      meetings,
      communications,
      invoices,
      teamMembers,
      decisions,
      agreements,
      risks,
    };

    // Save to local storage first
    saveStoredLocalData(payload);

    // Sync to Supabase
    const syncRes = await syncLocalDataToSupabase(payload);

    return {
      success: true,
      message: `Respaldo restaurado con éxito. Se importaron ${projects.length} proyectos, ${tasks.length} entregables y ${invoices.length} facturas.`,
      counts: syncRes.syncedCounts || {
        projects: projects.length,
        tasks: tasks.length,
        meetings: meetings.length,
        communications: communications.length,
        invoices: invoices.length,
        team_members: teamMembers.length,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Error al restaurar el respaldo.',
    };
  }
}
