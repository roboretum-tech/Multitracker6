import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { 
  Project, 
  Task, 
  Meeting, 
  Communication, 
  Invoice, 
  TeamMember, 
  DashboardSummary, 
  ProjectDecision, 
  ProjectAgreement, 
  ProjectRisk, 
  AgreementStatus, 
  RiskSeverityLevel,
  ProjectStatus,
  Priority 
} from '../types';
import { 
  computeDashboardSummary, 
  syncProjectsWithTasks 
} from '../lib/dataService';
import { 
  fetchTenantDataFromFirestore, 
  saveTenantDataLocal, 
  loadTenantDataLocal, 
  saveEntityToFirestore, 
  deleteEntityFromFirestore,
  TenantDataState 
} from '../lib/firestoreService';
import { sanitizeText, sanitizeUrl, sanitizeNumber } from '../utils/security';
import { globalRateLimiter, RATE_LIMIT_CONFIGS } from '../utils/rateLimiter';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';

interface DataContextType {
  projects: Project[];
  tasks: Task[];
  meetings: Meeting[];
  communications: Communication[];
  invoices: Invoice[];
  teamMembers: TeamMember[];
  decisions: ProjectDecision[];
  agreements: ProjectAgreement[];
  risks: ProjectRisk[];
  summary: DashboardSummary;
  loading: boolean;
  isUsingSupabase: boolean;
  supabaseError: string | null;
  refreshData: () => Promise<void>;
  
  // Project actions
  addProject: (project: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'task_count' | 'overdue_task_count' | 'meeting_count' | 'comm_count' | 'total_invoiced'>) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  // Task actions
  addTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskDone: (id: string) => Promise<void>;
  updateTaskDependencies: (taskId: string, dependencies: string[]) => Promise<void>;

  // Baseline actions
  captureProjectBaseline: (projectId: string) => Promise<void>;
  clearProjectBaseline: (projectId: string) => Promise<void>;

  // Meeting actions
  addMeeting: (meeting: Omit<Meeting, 'id' | 'created_at'>) => Promise<void>;
  updateMeeting: (id: string, updates: Partial<Meeting>) => Promise<void>;
  deleteMeeting: (id: string) => Promise<void>;

  // Communication actions
  addCommunication: (comm: Omit<Communication, 'id' | 'created_at'>) => Promise<void>;
  updateCommunication: (id: string, updates: Partial<Communication>) => Promise<void>;
  deleteCommunication: (id: string) => Promise<void>;

  // Invoice actions
  addInvoice: (inv: Omit<Invoice, 'id' | 'created_at'>) => Promise<void>;
  updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;

  // Team Member actions
  addTeamMember: (member: Omit<TeamMember, 'id' | 'created_at'>) => Promise<void>;
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => Promise<void>;
  deleteTeamMember: (id: string) => Promise<void>;

  // Decisions, Agreements & Risks
  addDecision: (decision: Omit<ProjectDecision, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateDecision: (id: string, updates: Partial<ProjectDecision>) => Promise<void>;
  deleteDecision: (id: string) => Promise<void>;

  addAgreement: (agreement: Omit<ProjectAgreement, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateAgreement: (id: string, updates: Partial<ProjectAgreement>) => Promise<void>;
  deleteAgreement: (id: string) => Promise<void>;
  toggleAgreementStatus: (id: string, newStatus?: AgreementStatus) => Promise<void>;

  addRisk: (risk: Omit<ProjectRisk, 'id' | 'created_at' | 'updated_at' | 'severity_score' | 'severity_level'> & { severity_score?: number; severity_level?: RiskSeverityLevel }) => Promise<void>;
  updateRisk: (id: string, updates: Partial<ProjectRisk>) => Promise<void>;
  deleteRisk: (id: string) => Promise<void>;

  // Backup & Restore
  restoreBackup: (backupRaw: any) => Promise<{ success: boolean; message: string; counts?: Record<string, number> }>;
}

const DataContext = createContext<DataContextType | null>(null);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const currentUserId = currentUser?.id;
  const { checkTaskDeadlines, notifyScheduleChange } = useNotifications();

  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [decisions, setDecisions] = useState<ProjectDecision[]>([]);
  const [agreements, setAgreements] = useState<ProjectAgreement[]>([]);
  const [risks, setRisks] = useState<ProjectRisk[]>([]);
  const [loading, setLoading] = useState(true);

  // Rate limit guard for mutations
  const verifyMutationLimit = (): boolean => {
    const check = globalRateLimiter.check(
      'data:mutations',
      RATE_LIMIT_CONFIGS.DATA_MUTATION.max,
      RATE_LIMIT_CONFIGS.DATA_MUTATION.windowMs,
      RATE_LIMIT_CONFIGS.DATA_MUTATION.lockoutMs
    );
    if (!check.allowed) {
      console.warn(`[Security Alert] Límite de mutaciones excedido. Espera ${check.retryAfterSeconds}s`);
      return false;
    }
    globalRateLimiter.hit('data:mutations');
    return true;
  };

  // Helper to persist current state locally
  const persistStateLocally = (
    p = projects,
    t = tasks,
    m = meetings,
    c = communications,
    i = invoices,
    tm = teamMembers,
    d = decisions,
    a = agreements,
    r = risks
  ) => {
    if (!currentUserId) return;
    saveTenantDataLocal(currentUserId, {
      projects: p,
      tasks: t,
      meetings: m,
      communications: c,
      invoices: i,
      teamMembers: tm,
      decisions: d,
      agreements: a,
      risks: r,
    });
  };

  // Carga de datos del tenant cuando cambia el usuario activo
  const loadTenantData = async () => {
    if (!currentUserId) {
      setProjects([]);
      setTasks([]);
      setMeetings([]);
      setCommunications([]);
      setInvoices([]);
      setTeamMembers([]);
      setDecisions([]);
      setAgreements([]);
      setRisks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // 1. Cargar caché rápido si existe
      const cached = loadTenantDataLocal(currentUserId);
      if (cached && cached.projects.length > 0) {
        setProjects(syncProjectsWithTasks(cached.projects, cached.tasks));
        setTasks(cached.tasks || []);
        setMeetings(cached.meetings || []);
        setCommunications(cached.communications || []);
        setInvoices(cached.invoices || []);
        setTeamMembers(cached.teamMembers || []);
        setDecisions(cached.decisions || []);
        setAgreements(cached.agreements || []);
        setRisks(cached.risks || []);
      }

      // 2. Sincronizar con Firestore
      const remoteData: TenantDataState = await fetchTenantDataFromFirestore(
        currentUserId,
        currentUser?.email || '',
        currentUser?.name
      );

      const synchedProjects = syncProjectsWithTasks(remoteData.projects, remoteData.tasks);
      setProjects(synchedProjects);
      setTasks(remoteData.tasks);
      setMeetings(remoteData.meetings);
      setCommunications(remoteData.communications);
      setInvoices(remoteData.invoices);
      setTeamMembers(remoteData.teamMembers);
      setDecisions(remoteData.decisions);
      setAgreements(remoteData.agreements);
      setRisks(remoteData.risks);

      // Evaluar tareas próximas a vencer (48h, 24h y vencidas)
      if (remoteData.tasks && remoteData.tasks.length > 0) {
        checkTaskDeadlines(remoteData.tasks, synchedProjects);
      }
    } catch (err) {
      console.warn('Error al cargar datos del tenant:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenantData();
  }, [currentUserId]);

  const refreshData = async () => {
    await loadTenantData();
  };

  const summary = computeDashboardSummary(projects, tasks, meetings, communications);

  // -------------------------------------------------------------
  // CRUD Proyectos
  // -------------------------------------------------------------
  const addProject = async (projectData: any) => {
    if (!currentUserId || !verifyMutationLimit()) return;

    const sanitizedData = {
      ...projectData,
      name: sanitizeText(projectData.name),
      category: sanitizeText(projectData.category || 'Desarrollo'),
      status: sanitizeText(projectData.status || 'No iniciado') as ProjectStatus,
      priority: sanitizeText(projectData.priority || 'Medio') as Priority,
      start_date: sanitizeText(projectData.start_date || ''),
      deadline: sanitizeText(projectData.deadline || ''),
      completion_date: sanitizeText(projectData.completion_date || ''),
      key_document_links: sanitizeUrl(projectData.key_document_links || ''),
      progress_percentage: sanitizeNumber(projectData.progress_percentage, 0, 0, 100),
      estimated_value: sanitizeNumber(projectData.estimated_value, 0, 0),
    };

    const newProj: Project = {
      id: 'proj-' + Date.now(),
      tenantId: currentUserId,
      user_id: currentUserId,
      organization_id: `org-${currentUserId.slice(0, 8)}`,
      ...sanitizedData,
      task_count: 0,
      overdue_task_count: 0,
      meeting_count: 0,
      comm_count: 0,
      total_invoiced: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updated = [newProj, ...projects];
    setProjects(updated);
    persistStateLocally(updated);

    saveEntityToFirestore('projects', newProj, currentUserId).catch(err => {
      console.warn('Error syncing project to Firestore:', err);
    });
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    if (!currentUserId || !verifyMutationLimit()) return;

    const sanitizedUpdates: Partial<Project> = { ...updates };
    if (updates.name) sanitizedUpdates.name = sanitizeText(updates.name);
    if (updates.category) sanitizedUpdates.category = sanitizeText(updates.category);
    if (updates.status) sanitizedUpdates.status = sanitizeText(updates.status) as ProjectStatus;
    if (updates.priority) sanitizedUpdates.priority = sanitizeText(updates.priority) as Priority;
    if (updates.key_document_links) sanitizedUpdates.key_document_links = sanitizeUrl(updates.key_document_links);

    const updatedProjects = projects.map(p => {
      if (p.id === id) {
        return {
          ...p,
          ...sanitizedUpdates,
          tenantId: currentUserId,
          updated_at: new Date().toISOString(),
        };
      }
      return p;
    });

    const synched = syncProjectsWithTasks(updatedProjects, tasks);
    setProjects(synched);
    persistStateLocally(synched);

    const target = synched.find(p => p.id === id);
    if (target) {
      saveEntityToFirestore('projects', target, currentUserId).catch(err => {
        console.warn('Error syncing project update to Firestore:', err);
      });
    }
  };

  const deleteProject = async (id: string) => {
    if (!currentUserId || !verifyMutationLimit()) return;

    const updatedProjects = projects.filter(p => p.id !== id);
    const updatedTasks = tasks.filter(t => t.project_id !== id);
    const updatedMeetings = meetings.filter(m => m.project_id !== id);
    const updatedComms = communications.filter(c => c.project_id !== id);
    const updatedInvoices = invoices.filter(i => i.project_id !== id);
    const updatedDecisions = decisions.filter(d => d.project_id !== id);
    const updatedAgreements = agreements.filter(a => a.project_id !== id);
    const updatedRisks = risks.filter(r => r.project_id !== id);

    setProjects(updatedProjects);
    setTasks(updatedTasks);
    setMeetings(updatedMeetings);
    setCommunications(updatedComms);
    setInvoices(updatedInvoices);
    setDecisions(updatedDecisions);
    setAgreements(updatedAgreements);
    setRisks(updatedRisks);

    persistStateLocally(
      updatedProjects,
      updatedTasks,
      updatedMeetings,
      updatedComms,
      updatedInvoices,
      teamMembers,
      updatedDecisions,
      updatedAgreements,
      updatedRisks
    );

    deleteEntityFromFirestore('projects', id, currentUserId).catch(err => {
      console.warn('Error deleting project from Firestore:', err);
    });
  };

  // -------------------------------------------------------------
  // CRUD Tareas
  // -------------------------------------------------------------
  const addTask = async (taskData: any) => {
    if (!currentUserId || !verifyMutationLimit()) return;

    const newTask: Task = {
      id: 'task-' + Date.now(),
      tenantId: currentUserId,
      user_id: currentUserId,
      organization_id: `org-${currentUserId.slice(0, 8)}`,
      project_id: taskData.project_id,
      name: sanitizeText(taskData.name),
      start_date: sanitizeText(taskData.start_date || ''),
      end_date: sanitizeText(taskData.end_date || ''),
      status: sanitizeText(taskData.status || 'No iniciada'),
      priority: sanitizeText(taskData.priority || 'Medio') as Priority,
      owner_id: taskData.owner_id || undefined,
      notes: sanitizeText(taskData.notes || ''),
      is_done: Boolean(taskData.is_done || taskData.status === 'Completado'),
      dependencies: Array.isArray(taskData.dependencies) ? taskData.dependencies : [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedTasks = [newTask, ...tasks];
    setTasks(updatedTasks);
    const synchedProjects = syncProjectsWithTasks(projects, updatedTasks);
    setProjects(synchedProjects);
    persistStateLocally(synchedProjects, updatedTasks);

    saveEntityToFirestore('tasks', newTask, currentUserId).catch(err => {
      console.warn('Error syncing task to Firestore:', err);
    });
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    if (!currentUserId || !verifyMutationLimit()) return;

    const previousTask = tasks.find(t => t.id === id);

    const sanitizedUpdates: Partial<Task> = { ...updates };
    if (updates.name) sanitizedUpdates.name = sanitizeText(updates.name);
    if (updates.status) {
      sanitizedUpdates.status = sanitizeText(updates.status);
      sanitizedUpdates.is_done = updates.status === 'Completado';
    }
    if (updates.priority) sanitizedUpdates.priority = sanitizeText(updates.priority) as Priority;

    const updatedTasks = tasks.map(t => {
      if (t.id === id) {
        return {
          ...t,
          ...sanitizedUpdates,
          tenantId: currentUserId,
          updated_at: new Date().toISOString(),
        };
      }
      return t;
    });

    setTasks(updatedTasks);
    const synchedProjects = syncProjectsWithTasks(projects, updatedTasks);
    setProjects(synchedProjects);
    persistStateLocally(synchedProjects, updatedTasks);

    const target = updatedTasks.find(t => t.id === id);
    if (target) {
      saveEntityToFirestore('tasks', target, currentUserId).catch(err => {
        console.warn('Error syncing task update to Firestore:', err);
      });

      // Disparar alertas de cambio de cronograma y desviación de línea base
      if (previousTask) {
        const targetProj = projects.find(p => p.id === target.project_id);
        notifyScheduleChange(target, previousTask, targetProj);
      }
    }
  };

  const deleteTask = async (id: string) => {
    if (!currentUserId || !verifyMutationLimit()) return;

    const updatedTasks = tasks.filter(t => t.id !== id);
    setTasks(updatedTasks);
    const synchedProjects = syncProjectsWithTasks(projects, updatedTasks);
    setProjects(synchedProjects);
    persistStateLocally(synchedProjects, updatedTasks);

    deleteEntityFromFirestore('tasks', id, currentUserId).catch(err => {
      console.warn('Error deleting task from Firestore:', err);
    });
  };

  const toggleTaskDone = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const newDone = !task.is_done;
    await updateTask(id, {
      is_done: newDone,
      status: newDone ? 'Completado' : 'En curso',
    });
  };

  const updateTaskDependencies = async (taskId: string, dependencies: string[]) => {
    await updateTask(taskId, { dependencies });
  };

  // -------------------------------------------------------------
  // Baseline Actions
  // -------------------------------------------------------------
  const captureProjectBaseline = async (projectId: string) => {
    if (!currentUserId) return;
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const now = new Date().toISOString();
    await updateProject(projectId, {
      baseline_captured_at: now,
      baseline_start_date: project.start_date,
      baseline_deadline: project.deadline,
    });

    const projectTasks = tasks.filter(t => t.project_id === projectId);
    for (const t of projectTasks) {
      let durationDays = 0;
      if (t.start_date && t.end_date) {
        const diffMs = new Date(t.end_date).getTime() - new Date(t.start_date).getTime();
        durationDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
      }
      await updateTask(t.id, {
        baseline_start_date: t.start_date,
        baseline_end_date: t.end_date,
        baseline_duration_days: durationDays,
      });
    }
  };

  const clearProjectBaseline = async (projectId: string) => {
    if (!currentUserId) return;
    await updateProject(projectId, {
      baseline_captured_at: undefined,
      baseline_start_date: undefined,
      baseline_deadline: undefined,
    });

    const projectTasks = tasks.filter(t => t.project_id === projectId);
    for (const t of projectTasks) {
      await updateTask(t.id, {
        baseline_start_date: undefined,
        baseline_end_date: undefined,
        baseline_duration_days: undefined,
      });
    }
  };

  // -------------------------------------------------------------
  // CRUD Reuniones
  // -------------------------------------------------------------
  const addMeeting = async (meetingData: any) => {
    if (!currentUserId || !verifyMutationLimit()) return;

    const newMeeting: Meeting = {
      id: 'meet-' + Date.now(),
      tenantId: currentUserId,
      user_id: currentUserId,
      organization_id: `org-${currentUserId.slice(0, 8)}`,
      project_id: meetingData.project_id,
      name: sanitizeText(meetingData.name),
      meeting_date: meetingData.meeting_date || new Date().toISOString(),
      meeting_type: sanitizeText(meetingData.meeting_type || 'Reunión de seguimiento'),
      status: sanitizeText(meetingData.status || 'Programada'),
      attendees: sanitizeText(meetingData.attendees || ''),
      notes: sanitizeText(meetingData.notes || ''),
      created_at: new Date().toISOString(),
    };

    const updated = [newMeeting, ...meetings];
    setMeetings(updated);
    persistStateLocally(projects, tasks, updated);

    saveEntityToFirestore('meetings', newMeeting, currentUserId).catch(err => {
      console.warn('Error syncing meeting to Firestore:', err);
    });
  };

  const updateMeeting = async (id: string, updates: Partial<Meeting>) => {
    if (!currentUserId || !verifyMutationLimit()) return;

    const updated = meetings.map(m => m.id === id ? { ...m, ...updates, tenantId: currentUserId } : m);
    setMeetings(updated);
    persistStateLocally(projects, tasks, updated);

    const target = updated.find(m => m.id === id);
    if (target) {
      saveEntityToFirestore('meetings', target, currentUserId).catch(err => {
        console.warn('Error updating meeting in Firestore:', err);
      });
    }
  };

  const deleteMeeting = async (id: string) => {
    if (!currentUserId || !verifyMutationLimit()) return;

    const updated = meetings.filter(m => m.id !== id);
    setMeetings(updated);
    persistStateLocally(projects, tasks, updated);

    deleteEntityFromFirestore('meetings', id, currentUserId).catch(err => {
      console.warn('Error deleting meeting from Firestore:', err);
    });
  };

  // -------------------------------------------------------------
  // CRUD Comunicaciones
  // -------------------------------------------------------------
  const addCommunication = async (commData: any) => {
    if (!currentUserId || !verifyMutationLimit()) return;

    const newComm: Communication = {
      id: 'comm-' + Date.now(),
      tenantId: currentUserId,
      user_id: currentUserId,
      organization_id: `org-${currentUserId.slice(0, 8)}`,
      project_id: commData.project_id,
      comm_date: commData.comm_date || new Date().toISOString(),
      comm_type: sanitizeText(commData.comm_type || 'Correo electrónico'),
      outcome: sanitizeText(commData.outcome || ''),
      notes: sanitizeText(commData.notes || ''),
      created_at: new Date().toISOString(),
    };

    const updated = [newComm, ...communications];
    setCommunications(updated);
    persistStateLocally(projects, tasks, meetings, updated);

    saveEntityToFirestore('communications', newComm, currentUserId).catch(err => {
      console.warn('Error syncing communication to Firestore:', err);
    });
  };

  const updateCommunication = async (id: string, updates: Partial<Communication>) => {
    if (!currentUserId || !verifyMutationLimit()) return;

    const updated = communications.map(c => c.id === id ? { ...c, ...updates, tenantId: currentUserId } : c);
    setCommunications(updated);
    persistStateLocally(projects, tasks, meetings, updated);

    const target = updated.find(c => c.id === id);
    if (target) {
      saveEntityToFirestore('communications', target, currentUserId).catch(err => {
        console.warn('Error updating communication in Firestore:', err);
      });
    }
  };

  const deleteCommunication = async (id: string) => {
    if (!currentUserId || !verifyMutationLimit()) return;

    const updated = communications.filter(c => c.id !== id);
    setCommunications(updated);
    persistStateLocally(projects, tasks, meetings, updated);

    deleteEntityFromFirestore('communications', id, currentUserId).catch(err => {
      console.warn('Error deleting communication from Firestore:', err);
    });
  };

  // -------------------------------------------------------------
  // CRUD Facturación
  // -------------------------------------------------------------
  const addInvoice = async (invData: any) => {
    if (!currentUserId || !verifyMutationLimit()) return;

    const newInv: Invoice = {
      id: 'inv-' + Date.now(),
      tenantId: currentUserId,
      user_id: currentUserId,
      organization_id: `org-${currentUserId.slice(0, 8)}`,
      project_id: invData.project_id,
      invoice_number: sanitizeText(invData.invoice_number || 'FAC-' + Date.now().toString().slice(-4)),
      amount: sanitizeNumber(invData.amount, 0, 0),
      sent_date: sanitizeText(invData.sent_date || ''),
      due_date: sanitizeText(invData.due_date || ''),
      status: sanitizeText(invData.status || 'Aún no enviado'),
      notes: sanitizeText(invData.notes || ''),
      created_at: new Date().toISOString(),
    };

    const updated = [newInv, ...invoices];
    setInvoices(updated);
    persistStateLocally(projects, tasks, meetings, communications, updated);

    saveEntityToFirestore('invoices', newInv, currentUserId).catch(err => {
      console.warn('Error syncing invoice to Firestore:', err);
    });
  };

  const updateInvoice = async (id: string, updates: Partial<Invoice>) => {
    if (!currentUserId || !verifyMutationLimit()) return;

    const updated = invoices.map(i => i.id === id ? { ...i, ...updates, tenantId: currentUserId } : i);
    setInvoices(updated);
    persistStateLocally(projects, tasks, meetings, communications, updated);

    const target = updated.find(i => i.id === id);
    if (target) {
      saveEntityToFirestore('invoices', target, currentUserId).catch(err => {
        console.warn('Error updating invoice in Firestore:', err);
      });
    }
  };

  const deleteInvoice = async (id: string) => {
    if (!currentUserId || !verifyMutationLimit()) return;

    const updated = invoices.filter(i => i.id !== id);
    setInvoices(updated);
    persistStateLocally(projects, tasks, meetings, communications, updated);

    deleteEntityFromFirestore('invoices', id, currentUserId).catch(err => {
      console.warn('Error deleting invoice from Firestore:', err);
    });
  };

  // -------------------------------------------------------------
  // CRUD Miembros de Equipo
  // -------------------------------------------------------------
  const addTeamMember = async (memberData: any) => {
    if (!currentUserId || !verifyMutationLimit()) return;

    const newMember: TeamMember = {
      id: 'tm-' + Date.now(),
      tenantId: currentUserId,
      user_id: currentUserId,
      organization_id: `org-${currentUserId.slice(0, 8)}`,
      name: sanitizeText(memberData.name),
      role: sanitizeText(memberData.role || 'Consultor'),
      notes: sanitizeText(memberData.notes || ''),
      created_at: new Date().toISOString(),
    };

    const updated = [newMember, ...teamMembers];
    setTeamMembers(updated);
    persistStateLocally(projects, tasks, meetings, communications, invoices, updated);

    saveEntityToFirestore('teamMembers', newMember, currentUserId).catch(err => {
      console.warn('Error syncing team member to Firestore:', err);
    });
  };

  const updateTeamMember = async (id: string, updates: Partial<TeamMember>) => {
    if (!currentUserId || !verifyMutationLimit()) return;

    const updated = teamMembers.map(tm => tm.id === id ? { ...tm, ...updates, tenantId: currentUserId } : tm);
    setTeamMembers(updated);
    persistStateLocally(projects, tasks, meetings, communications, invoices, updated);

    const target = updated.find(tm => tm.id === id);
    if (target) {
      saveEntityToFirestore('teamMembers', target, currentUserId).catch(err => {
        console.warn('Error updating team member in Firestore:', err);
      });
    }
  };

  const deleteTeamMember = async (id: string) => {
    if (!currentUserId || !verifyMutationLimit()) return;

    const updated = teamMembers.filter(tm => tm.id !== id);
    setTeamMembers(updated);
    persistStateLocally(projects, tasks, meetings, communications, invoices, updated);

    deleteEntityFromFirestore('teamMembers', id, currentUserId).catch(err => {
      console.warn('Error deleting team member from Firestore:', err);
    });
  };

  // -------------------------------------------------------------
  // CRUD Decisiones, Acuerdos y Riesgos
  // -------------------------------------------------------------
  const addDecision = async (decisionData: any) => {
    if (!currentUserId || !verifyMutationLimit()) return;

    const newDec: ProjectDecision = {
      id: 'dec-' + Date.now(),
      tenantId: currentUserId,
      user_id: currentUserId,
      organization_id: `org-${currentUserId.slice(0, 8)}`,
      code: 'D-' + (decisions.length + 1).toString().padStart(3, '0'),
      project_id: decisionData.project_id,
      title: sanitizeText(decisionData.title),
      description: sanitizeText(decisionData.description || ''),
      decision_maker: sanitizeText(decisionData.decision_maker || 'Comité Directivo'),
      decision_date: decisionData.decision_date || new Date().toISOString().split('T')[0],
      status: decisionData.status || 'Propuesta',
      impact_level: decisionData.impact_level || 'Medio',
      justification: sanitizeText(decisionData.justification || ''),
      linked_task_id: decisionData.linked_task_id || undefined,
      linked_risk_id: decisionData.linked_risk_id || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updated = [newDec, ...decisions];
    setDecisions(updated);
    persistStateLocally(projects, tasks, meetings, communications, invoices, teamMembers, updated);

    saveEntityToFirestore('decisions', newDec, currentUserId).catch(err => {
      console.warn('Error syncing decision to Firestore:', err);
    });
  };

  const updateDecision = async (id: string, updates: Partial<ProjectDecision>) => {
    if (!currentUserId || !verifyMutationLimit()) return;

    const updated = decisions.map(d => d.id === id ? { ...d, ...updates, tenantId: currentUserId, updated_at: new Date().toISOString() } : d);
    setDecisions(updated);
    persistStateLocally(projects, tasks, meetings, communications, invoices, teamMembers, updated);

    const target = updated.find(d => d.id === id);
    if (target) {
      saveEntityToFirestore('decisions', target, currentUserId).catch(err => {
        console.warn('Error updating decision in Firestore:', err);
      });
    }
  };

  const deleteDecision = async (id: string) => {
    if (!currentUserId || !verifyMutationLimit()) return;

    const updated = decisions.filter(d => d.id !== id);
    setDecisions(updated);
    persistStateLocally(projects, tasks, meetings, communications, invoices, teamMembers, updated);

    deleteEntityFromFirestore('decisions', id, currentUserId).catch(err => {
      console.warn('Error deleting decision from Firestore:', err);
    });
  };

  const addAgreement = async (agreementData: any) => {
    if (!currentUserId || !verifyMutationLimit()) return;

    const newAgr: ProjectAgreement = {
      id: 'agr-' + Date.now(),
      tenantId: currentUserId,
      user_id: currentUserId,
      organization_id: `org-${currentUserId.slice(0, 8)}`,
      code: 'A-' + (agreements.length + 1).toString().padStart(3, '0'),
      project_id: agreementData.project_id,
      description: sanitizeText(agreementData.description),
      responsible_name: sanitizeText(agreementData.responsible_name || 'Sin Asignar'),
      due_date: agreementData.due_date || new Date().toISOString().split('T')[0],
      status: agreementData.status || 'Pendiente',
      priority: agreementData.priority || 'Media',
      linked_decision_id: agreementData.linked_decision_id || undefined,
      linked_task_id: agreementData.linked_task_id || undefined,
      meeting_id: agreementData.meeting_id || undefined,
      completion_date: agreementData.completion_date || undefined,
      notes: sanitizeText(agreementData.notes || ''),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updated = [newAgr, ...agreements];
    setAgreements(updated);
    persistStateLocally(projects, tasks, meetings, communications, invoices, teamMembers, decisions, updated);

    saveEntityToFirestore('agreements', newAgr, currentUserId).catch(err => {
      console.warn('Error syncing agreement to Firestore:', err);
    });
  };

  const updateAgreement = async (id: string, updates: Partial<ProjectAgreement>) => {
    if (!currentUserId || !verifyMutationLimit()) return;

    const updated = agreements.map(a => a.id === id ? { ...a, ...updates, tenantId: currentUserId, updated_at: new Date().toISOString() } : a);
    setAgreements(updated);
    persistStateLocally(projects, tasks, meetings, communications, invoices, teamMembers, decisions, updated);

    const target = updated.find(a => a.id === id);
    if (target) {
      saveEntityToFirestore('agreements', target, currentUserId).catch(err => {
        console.warn('Error updating agreement in Firestore:', err);
      });
    }
  };

  const deleteAgreement = async (id: string) => {
    if (!currentUserId || !verifyMutationLimit()) return;

    const updated = agreements.filter(a => a.id !== id);
    setAgreements(updated);
    persistStateLocally(projects, tasks, meetings, communications, invoices, teamMembers, decisions, updated);

    deleteEntityFromFirestore('agreements', id, currentUserId).catch(err => {
      console.warn('Error deleting agreement from Firestore:', err);
    });
  };

  const toggleAgreementStatus = async (id: string, newStatus?: AgreementStatus) => {
    const agr = agreements.find(a => a.id === id);
    if (!agr) return;
    const nextStatus = newStatus || (agr.status === 'Cumplido' ? 'En proceso' : 'Cumplido');
    await updateAgreement(id, {
      status: nextStatus,
      completion_date: nextStatus === 'Cumplido' ? new Date().toISOString().split('T')[0] : undefined,
    });
  };

  const addRisk = async (riskData: any) => {
    if (!currentUserId || !verifyMutationLimit()) return;

    const prob = Number(riskData.probability) || 3;
    const imp = Number(riskData.impact) || 3;
    const score = prob * imp;
    const level: RiskSeverityLevel = score >= 16 ? 'Crítico' : score >= 10 ? 'Alto' : score >= 5 ? 'Medio' : 'Bajo';

    const newRisk: ProjectRisk = {
      id: 'risk-' + Date.now(),
      tenantId: currentUserId,
      user_id: currentUserId,
      organization_id: `org-${currentUserId.slice(0, 8)}`,
      code: 'R-' + (risks.length + 1).toString().padStart(3, '0'),
      project_id: riskData.project_id,
      title: sanitizeText(riskData.title),
      description: sanitizeText(riskData.description || ''),
      category: riskData.category || 'Operativo',
      probability: prob as any,
      impact: imp as any,
      severity_score: score,
      severity_level: level,
      status: riskData.status || 'Activo',
      mitigation_strategy: sanitizeText(riskData.mitigation_strategy || 'Monitoreo preventivo continuo'),
      mitigation_owner: sanitizeText(riskData.mitigation_owner || 'Líder de Proyecto'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updated = [newRisk, ...risks];
    setRisks(updated);
    persistStateLocally(projects, tasks, meetings, communications, invoices, teamMembers, decisions, agreements, updated);

    saveEntityToFirestore('risks', newRisk, currentUserId).catch(err => {
      console.warn('Error syncing risk to Firestore:', err);
    });
  };

  const updateRisk = async (id: string, updates: Partial<ProjectRisk>) => {
    if (!currentUserId || !verifyMutationLimit()) return;

    const updated = risks.map(r => {
      if (r.id === id) {
        const prob = updates.probability ? Number(updates.probability) : r.probability;
        const imp = updates.impact ? Number(updates.impact) : r.impact;
        const score = prob * imp;
        const level: RiskSeverityLevel = score >= 16 ? 'Crítico' : score >= 10 ? 'Alto' : score >= 5 ? 'Medio' : 'Bajo';
        return {
          ...r,
          ...updates,
          tenantId: currentUserId,
          probability: prob as any,
          impact: imp as any,
          severity_score: score,
          severity_level: level,
          updated_at: new Date().toISOString(),
        };
      }
      return r;
    });

    setRisks(updated);
    persistStateLocally(projects, tasks, meetings, communications, invoices, teamMembers, decisions, agreements, updated);

    const target = updated.find(r => r.id === id);
    if (target) {
      saveEntityToFirestore('risks', target, currentUserId).catch(err => {
        console.warn('Error updating risk in Firestore:', err);
      });
    }
  };

  const deleteRisk = async (id: string) => {
    if (!currentUserId || !verifyMutationLimit()) return;

    const updated = risks.filter(r => r.id !== id);
    setRisks(updated);
    persistStateLocally(projects, tasks, meetings, communications, invoices, teamMembers, decisions, agreements, updated);

    deleteEntityFromFirestore('risks', id, currentUserId).catch(err => {
      console.warn('Error deleting risk from Firestore:', err);
    });
  };

  // -------------------------------------------------------------
  // Restore Backup
  // -------------------------------------------------------------
  const restoreBackup = async (backupRaw: any): Promise<{ success: boolean; message: string; counts?: Record<string, number> }> => {
    if (!currentUserId) return { success: false, message: 'Debes iniciar sesión para restaurar un respaldo.' };

    try {
      const projs: Project[] = Array.isArray(backupRaw.projects) ? backupRaw.projects : [];
      const tsks: Task[] = Array.isArray(backupRaw.tasks) ? backupRaw.tasks : [];

      const scopedProjs = projs.map(p => ({ ...p, tenantId: currentUserId, user_id: currentUserId }));
      const scopedTasks = tsks.map(t => ({ ...t, tenantId: currentUserId, user_id: currentUserId }));

      const synched = syncProjectsWithTasks(scopedProjs, scopedTasks);
      setProjects(synched);
      setTasks(scopedTasks);
      persistStateLocally(synched, scopedTasks);

      return {
        success: true,
        message: `Respaldo importado exitosamente con ${synched.length} proyectos y ${scopedTasks.length} tareas.`,
        counts: {
          projects: synched.length,
          tasks: scopedTasks.length,
        }
      };
    } catch (e: any) {
      return {
        success: false,
        message: e?.message || 'Error al restaurar respaldo.'
      };
    }
  };

  return (
    <DataContext.Provider
      value={{
        projects,
        tasks,
        meetings,
        communications,
        invoices,
        teamMembers,
        decisions,
        agreements,
        risks,
        summary,
        loading,
        isUsingSupabase: false,
        supabaseError: null,
        refreshData,
        addProject,
        updateProject,
        deleteProject,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskDone,
        updateTaskDependencies,
        captureProjectBaseline,
        clearProjectBaseline,
        addMeeting,
        updateMeeting,
        deleteMeeting,
        addCommunication,
        updateCommunication,
        deleteCommunication,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        addTeamMember,
        updateTeamMember,
        deleteTeamMember,
        addDecision,
        updateDecision,
        deleteDecision,
        addAgreement,
        updateAgreement,
        deleteAgreement,
        toggleAgreementStatus,
        addRisk,
        updateRisk,
        deleteRisk,
        restoreBackup,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
