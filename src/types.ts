export type ProjectStatus = 'No iniciado' | 'En curso' | 'Completado' | 'En espera';
export type Priority = 'Urgente' | 'Dificil' | 'Medio' | 'Fácil';
export type InvoiceStatus = 'Aún no enviado' | 'Enviada' | 'Pagada' | 'Atrasada';

export interface TeamMember {
  id: string;
  tenantId?: string;
  user_id?: string;
  organization_id?: string;
  name: string;
  role?: string;
  notes?: string;
  created_at: string;
}

export interface Project {
  id: string;
  tenantId?: string;
  user_id?: string;
  organization_id?: string;
  name: string;
  category?: string;
  status: ProjectStatus;
  priority: Priority;
  custom_tags?: string[];
  start_date?: string;
  deadline?: string;
  completion_date?: string;
  progress_percentage: number;
  estimated_value: number;
  key_document_links?: string;
  
  // Baseline fields
  baseline_captured_at?: string;
  baseline_start_date?: string;
  baseline_deadline?: string;

  responsible_id?: string;
  accountable_id?: string;
  consulted_id?: string;
  informed_id?: string;

  task_count: number;
  overdue_task_count: number;
  meeting_count: number;
  comm_count: number;
  total_invoiced: number;
  next_meeting_date?: string;
  last_meeting_date?: string;
  last_comm_date?: string;

  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  tenantId?: string;
  project_id: string;
  user_id?: string;
  organization_id?: string;
  name: string;
  start_date?: string;
  end_date?: string;
  is_done: boolean;
  status: string;
  priority: Priority;
  owner_id?: string;
  notes?: string;

  // CPM & Dependencies (predecessor task IDs)
  dependencies?: string[];

  // Baseline fields
  baseline_start_date?: string;
  baseline_end_date?: string;
  baseline_duration_days?: number;

  created_at: string;
  updated_at: string;
}

export interface Meeting {
  id: string;
  tenantId?: string;
  project_id: string;
  user_id?: string;
  organization_id?: string;
  name: string;
  meeting_date: string;
  meeting_type?: string;
  status: string;
  attendees?: string;
  notes?: string;
  created_at: string;
}

export interface Communication {
  id: string;
  tenantId?: string;
  project_id: string;
  user_id?: string;
  organization_id?: string;
  comm_date: string;
  comm_type?: string;
  outcome?: string;
  notes?: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  tenantId?: string;
  project_id: string;
  user_id?: string;
  organization_id?: string;
  invoice_number: string;
  amount: number;
  sent_date?: string;
  due_date?: string;
  status: string;
  notes?: string;
  created_at: string;
}

export interface DashboardSummary {
  total_projects: number;
  total_tasks: number;
  total_overdue_tasks: number;
  total_meetings: number;
  total_communications: number;
  total_estimated_value: number;
}

export type UserRole = 
  | 'Super Admin' 
  | 'Director de Consultoría' 
  | 'Consultor Senior' 
  | 'Líder de Proyecto' 
  | 'Sponsor Ejecutivo / Cliente';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  department: string;
  organization_id?: string;
  status: 'active' | 'inactive';
  avatar_initials?: string;
  last_login?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_name: string;
  user_role: string;
  action: string;
  module: string;
  details: string;
  timestamp: string;
}

export interface SystemSettings {
  company_name: string;
  client_name: string;
  assessment_title: string;
  currency: 'MXN' | 'USD' | 'EUR';
  default_payment_terms_days: number;
  audit_logging_enabled: boolean;
  two_factor_simulation: boolean;
}

// Critical Path Method & Baseline Variance Models
export interface TaskCpmNode {
  task: Task;
  durationDays: number;
  predecessors: string[];
  successors: string[];
  earlyStart: Date;
  earlyFinish: Date;
  lateStart: Date;
  lateFinish: Date;
  slackDays: number;
  isCritical: boolean;
}

export type VarianceStatus = 'ahead' | 'on_track' | 'delayed' | 'no_baseline';

export interface TaskVarianceMetric {
  task: Task;
  isCritical: boolean;
  hasBaseline: boolean;
  baselineStart?: string;
  baselineEnd?: string;
  currentStart?: string;
  currentEnd?: string;
  baselineDuration: number;
  currentDuration: number;
  durationVarianceDays: number; // currentDuration - baselineDuration
  startVarianceDays: number;    // >0 means delayed start
  endVarianceDays: number;      // >0 means delayed end, <0 means ahead
  slackDays: number;
  impactOnProjectEndDays: number; // critical tasks pass 100% delay to project end; non-critical absorb with slack
  status: VarianceStatus;
}

export interface CriticalPathAnalysis {
  projectId: string;
  projectName: string;
  tasks: TaskCpmNode[];
  criticalTasks: TaskCpmNode[];
  criticalTaskIds: Set<string>;
  criticalPathDurationDays: number;
  earliestStartDate?: Date;
  latestFinishDate?: Date;
  hasCycles: boolean;
  variances: TaskVarianceMetric[];
  baselineCapturedAt?: string;
  baselineEndDate?: string;
  currentEndDate?: string;
  projectEndVarianceDays: number;
}

// -------------------------------------------------------------
// PHASE 2: CONNECTED RAID & CAUSAL NETWORK (CSEA v4.0 GOB/DIS)
// -------------------------------------------------------------
export type DecisionStatus = 'Propuesta' | 'En revisión' | 'Aprobada' | 'Rechazada' | 'Superada';
export type DecisionImpact = 'Crítico' | 'Alto' | 'Medio' | 'Bajo';

export interface ProjectDecision {
  id: string;
  tenantId?: string;
  code: string; // e.g. D-001
  project_id: string;
  user_id?: string;
  organization_id?: string;
  title: string;
  description: string;
  decision_maker: string; // e.g. "Comité Directivo", "Sponsor Ejecutivo", "PM Lead"
  decision_date: string;
  status: DecisionStatus;
  impact_level: DecisionImpact;
  justification?: string;
  linked_task_id?: string;
  linked_risk_id?: string;
  created_at: string;
  updated_at?: string;
}

export type AgreementStatus = 'Pendiente' | 'En proceso' | 'Cumplido' | 'Atrasado' | 'Cancelado';
export type AgreementPriority = 'Alta' | 'Media' | 'Baja';

export interface ProjectAgreement {
  id: string;
  tenantId?: string;
  code: string; // e.g. A-001
  project_id: string;
  user_id?: string;
  organization_id?: string;
  description: string;
  responsible_name: string;
  due_date: string;
  status: AgreementStatus;
  priority: AgreementPriority;
  linked_decision_id?: string;
  linked_task_id?: string;
  meeting_id?: string;
  completion_date?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export type RiskCategory = 
  | 'Operativo' 
  | 'Técnico' 
  | 'Contractual / Alcance' 
  | 'Recursos / Equipo' 
  | 'Gobernanza / Cliente';

export type RiskStatus = 'Activo' | 'Mitigado' | 'Materializado' | 'Cerrado';
export type RiskSeverityLevel = 'Crítico' | 'Alto' | 'Medio' | 'Bajo';

export interface ProjectRisk {
  id: string;
  tenantId?: string;
  code: string; // e.g. R-001
  project_id: string;
  user_id?: string;
  organization_id?: string;
  title: string;
  description: string;
  category: RiskCategory;
  probability: 1 | 2 | 3 | 4 | 5; // 1: Muy baja, 5: Muy alta
  impact: 1 | 2 | 3 | 4 | 5;      // 1: Menor, 5: Catastrófico
  severity_score: number;          // probability * impact (1 to 25)
  severity_level: RiskSeverityLevel;
  status: RiskStatus;
  mitigation_strategy: string;
  mitigation_owner: string;
  contingency_plan?: string;
  linked_task_id?: string;
  linked_decision_id?: string;
  review_date?: string;
  created_at: string;
  updated_at?: string;
}

// Causal Chain connection models
export interface CausalChainItem {
  id: string;
  type: 'decision' | 'agreement' | 'risk';
  code: string;
  title: string;
  status: string;
  severityOrImpact: string;
  owner: string;
  projectId: string;
  projectName: string;
  
  // Linked Element
  linkedTask?: Task;
  isTaskOnCriticalPath: boolean;
  taskDaysSlack: number;
  taskEndVarianceDays: number;
  
  // Projected Impact on Project Milestone
  projectedImpactSummary: string;
  isThreateningMilestone: boolean;
}

// In-App Notification System types
export type NotificationType = 
  | 'deadline_urgent'     // <= 24h
  | 'deadline_warning'    // <= 48h
  | 'deadline_overdue'    // past end_date
  | 'schedule_change'     // task start/end date updated
  | 'baseline_drift'      // task exceeds planned baseline
  | 'system';

export type NotificationSeverity = 'info' | 'warning' | 'urgent' | 'danger';

export interface AppNotification {
  id: string;
  tenantId: string;
  projectId?: string;
  projectName?: string;
  taskId?: string;
  taskName?: string;
  type: NotificationType;
  title: string;
  message: string;
  severity: NotificationSeverity;
  created_at: string;
  read: boolean;
  linkView?: 'tasks' | 'gantt' | 'baseline' | 'projects';
  linkEntityId?: string;
  metadata?: {
    previousDate?: string;
    newDate?: string;
    baselineVarianceDays?: number;
    hoursRemaining?: number;
  };
}
