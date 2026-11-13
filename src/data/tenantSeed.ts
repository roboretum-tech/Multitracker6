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

export interface UserTenantSeed {
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

/**
 * Genera EXACTAMENTE UN proyecto de demostración completo para un nuevo usuario / tenant.
 */
export function createDemoDataForUser(userId: string, userEmail: string, userName?: string): UserTenantSeed {
  const shortId = userId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8) || 'usr1';
  const tmId = `tm-lead-${shortId}`;
  const tmAssistId = `tm-assist-${shortId}`;
  const projId = `proj-demo-${shortId}`;
  const today = new Date().toISOString().split('T')[0];
  const orgId = `org-${shortId}`;

  const teamMembers: TeamMember[] = [
    {
      id: tmId,
      tenantId: userId,
      user_id: userId,
      organization_id: orgId,
      name: userName || (userEmail.split('@')[0].replace('.', ' ') || 'Líder de Proyecto'),
      role: 'Líder de Proyecto & Dirección',
      notes: 'Coordinador general del portafolio y responsable de entrega',
      created_at: '2026-01-10',
    },
    {
      id: tmAssistId,
      tenantId: userId,
      user_id: userId,
      organization_id: orgId,
      name: 'Ing. Elena Rostova',
      role: 'Arquitecta de Soluciones',
      notes: 'Líder técnico de integración de sistemas y aseguramiento de calidad',
      created_at: '2026-01-10',
    }
  ];

  const now = new Date();
  const formatYMD = (d: Date) => d.toISOString().split('T')[0];
  const dateCompletedStart = formatYMD(new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000));
  const dateCompletedEnd = formatYMD(new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000));
  const dateOverdue = formatYMD(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000));
  const dateDue24h = formatYMD(new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000));
  const dateDue48h = formatYMD(new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000));
  const dateProjDeadline = formatYMD(new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000));

  const project: Project = {
    id: projId,
    tenantId: userId,
    user_id: userId,
    organization_id: orgId,
    name: 'Proyecto Demo - Plataforma de Transformación Digital',
    category: 'Desarrollo de productos',
    status: 'En curso',
    priority: 'Urgente',
    custom_tags: ['Piloto', 'Estratégico'],
    start_date: dateCompletedStart,
    deadline: dateProjDeadline,
    progress_percentage: 50,
    estimated_value: 185000,
    key_document_links: '',
    baseline_captured_at: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    baseline_start_date: dateCompletedStart,
    baseline_deadline: dateProjDeadline,
    responsible_id: tmId,
    accountable_id: tmId,
    consulted_id: tmAssistId,
    task_count: 4,
    overdue_task_count: 1,
    meeting_count: 2,
    comm_count: 2,
    total_invoiced: 55500,
    next_meeting_date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    last_meeting_date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    last_comm_date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: dateCompletedStart,
    updated_at: today,
  };

  const tasks: Task[] = [
    {
      id: `task-1-${shortId}`,
      tenantId: userId,
      project_id: projId,
      user_id: userId,
      organization_id: orgId,
      name: 'Levantamiento de requerimientos y definición de alcance',
      start_date: dateCompletedStart,
      end_date: dateCompletedEnd,
      is_done: true,
      status: 'Completado',
      priority: 'Urgente',
      owner_id: tmId,
      notes: 'Matriz de trazabilidad de requerimientos y criterios de aceptación acordados con stakeholders.',
      dependencies: [],
      baseline_start_date: dateCompletedStart,
      baseline_end_date: dateCompletedEnd,
      baseline_duration_days: 30,
      created_at: dateCompletedStart,
      updated_at: dateCompletedEnd,
    },
    {
      id: `task-2-${shortId}`,
      tenantId: userId,
      project_id: projId,
      user_id: userId,
      organization_id: orgId,
      name: 'Diseño de arquitectura de datos y prototipo funcional',
      start_date: dateCompletedEnd,
      end_date: dateOverdue,
      is_done: false,
      status: 'En curso',
      priority: 'Dificil',
      owner_id: tmAssistId,
      notes: 'Modelado relacional, flujos de navegación interactiva y validación de seguridad.',
      dependencies: [`task-1-${shortId}`],
      baseline_start_date: dateCompletedEnd,
      baseline_end_date: dateOverdue,
      baseline_duration_days: 13,
      created_at: dateCompletedEnd,
      updated_at: today,
    },
    {
      id: `task-3-${shortId}`,
      tenantId: userId,
      project_id: projId,
      user_id: userId,
      organization_id: orgId,
      name: 'Implementación del núcleo transaccional y servicios cloud',
      start_date: dateCompletedEnd,
      end_date: dateDue24h,
      is_done: false,
      status: 'En curso',
      priority: 'Urgente',
      owner_id: tmAssistId,
      notes: 'Desarrollo de componentes, reglas de negocio e integración continua.',
      dependencies: [`task-2-${shortId}`],
      baseline_start_date: dateCompletedEnd,
      baseline_end_date: dateDue24h,
      baseline_duration_days: 16,
      created_at: dateCompletedEnd,
      updated_at: today,
    },
    {
      id: `task-4-${shortId}`,
      tenantId: userId,
      project_id: projId,
      user_id: userId,
      organization_id: orgId,
      name: 'Pruebas de estrés, auditoría de seguridad y pase a producción',
      start_date: dateDue24h,
      end_date: dateDue48h,
      is_done: false,
      status: 'No iniciado',
      priority: 'Medio',
      owner_id: tmId,
      notes: 'Certificación final con el comité directivo y plan de contingencia.',
      dependencies: [`task-3-${shortId}`],
      baseline_start_date: dateDue24h,
      baseline_end_date: dateDue48h,
      baseline_duration_days: 2,
      created_at: today,
      updated_at: today,
    }
  ];

  const meetings: Meeting[] = [
    {
      id: `meet-1-${shortId}`,
      tenantId: userId,
      project_id: projId,
      user_id: userId,
      organization_id: orgId,
      name: 'Reunión de Arranque & Alineación Ejecutiva (Kick-Off)',
      meeting_date: '2026-01-16T10:00:00Z',
      meeting_type: 'Alineación Estratégica',
      status: 'Realizada',
      attendees: 'Comité Directivo, PM Lead, Líderes Funcionales',
      notes: 'Se definió la visión, los hitos clave y la asignación de recursos principales.',
      created_at: '2026-01-16',
    },
    {
      id: `meet-2-${shortId}`,
      tenantId: userId,
      project_id: projId,
      user_id: userId,
      organization_id: orgId,
      name: 'Comité Quincenal de Avance y Control Presupuestal',
      meeting_date: '2026-08-20T16:30:00Z',
      meeting_type: 'Seguimiento',
      status: 'Realizada',
      attendees: 'PM Lead, Arquitecta de Soluciones, Auditor Financiero',
      notes: 'Avance al 50% con consumo presupuestal dentro del margen proyectado (+/- 3%).',
      created_at: '2026-08-20',
    }
  ];

  const communications: Communication[] = [
    {
      id: `comm-1-${shortId}`,
      tenantId: userId,
      project_id: projId,
      user_id: userId,
      organization_id: orgId,
      comm_date: '2026-01-17T09:00:00Z',
      comm_type: 'Minuta Ejecutiva',
      outcome: 'Aprobado sin reservas',
      notes: 'Distribución de acuerdos formales del Kick-off a todos los involucrados.',
      created_at: '2026-01-17',
    },
    {
      id: `comm-2-${shortId}`,
      tenantId: userId,
      project_id: projId,
      user_id: userId,
      organization_id: orgId,
      comm_date: '2026-08-25T11:00:00Z',
      comm_type: 'Reporte de Estado',
      outcome: 'Validado por Dirección',
      notes: 'Envío de resumen de progreso del núcleo transaccional.',
      created_at: '2026-08-25',
    }
  ];

  const invoices: Invoice[] = [
    {
      id: `inv-1-${shortId}`,
      tenantId: userId,
      project_id: projId,
      user_id: userId,
      organization_id: orgId,
      invoice_number: 'FAC-2026-001',
      amount: 55500,
      sent_date: '2026-01-20',
      due_date: '2026-02-20',
      status: 'Pagada',
      notes: 'Anticipo inicial del 30% contra entrega de acta de inicio.',
      created_at: '2026-01-20',
    }
  ];

  const decisions: ProjectDecision[] = [
    {
      id: `dec-1-${shortId}`,
      tenantId: userId,
      code: 'D-001',
      project_id: projId,
      user_id: userId,
      organization_id: orgId,
      title: 'Adopción de Infraestructura Serverless y Base de Datos Firestore',
      description: 'Se aprueba la arquitectura basada en la nube para garantizar alta disponibilidad y aislamiento multi-inquilino.',
      decision_maker: 'Comité Directivo de Tecnología',
      decision_date: '2026-01-25',
      status: 'Aprobada',
      impact_level: 'Crítico',
      justification: 'Reduce costos de mantenimiento de servidores y acelera el despliegue.',
      linked_task_id: `task-2-${shortId}`,
      created_at: '2026-01-25',
    }
  ];

  const agreements: ProjectAgreement[] = [
    {
      id: `agr-1-${shortId}`,
      tenantId: userId,
      code: 'A-001',
      project_id: projId,
      user_id: userId,
      organization_id: orgId,
      description: 'Revisiones de avance y demostraciones quincenales cada día viernes.',
      responsible_name: userName || 'Líder de Proyecto',
      due_date: '2026-09-30',
      status: 'En proceso',
      priority: 'Alta',
      linked_decision_id: `dec-1-${shortId}`,
      linked_task_id: `task-3-${shortId}`,
      meeting_id: `meet-1-${shortId}`,
      notes: 'Alineación continua para evitar desvíos de alcance.',
      created_at: '2026-01-16',
    }
  ];

  const risks: ProjectRisk[] = [
    {
      id: `risk-1-${shortId}`,
      tenantId: userId,
      code: 'R-001',
      project_id: projId,
      user_id: userId,
      organization_id: orgId,
      title: 'Disponibilidad de personal especializado para pruebas de seguridad',
      description: 'Riesgo de retraso en la ventana de certificación si los auditores externos tienen agenda saturada.',
      category: 'Recursos / Equipo',
      probability: 2,
      impact: 4,
      severity_score: 8,
      severity_level: 'Medio',
      status: 'Activo',
      mitigation_strategy: 'Contratar y reservar con 6 semanas de anticipación la ventana de auditoría.',
      mitigation_owner: 'Líder de Proyecto',
      created_at: '2026-02-05',
    }
  ];

  return {
    projects: [project],
    tasks,
    meetings,
    communications,
    invoices,
    teamMembers,
    decisions,
    agreements,
    risks,
  };
}
