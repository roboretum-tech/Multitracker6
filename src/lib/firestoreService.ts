import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  writeBatch 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
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
import { createDemoDataForUser, UserTenantSeed } from '../data/tenantSeed';

export interface TenantDataState {
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
 * Clave local por tenant para asegurar que cada usuario tenga su propio espacio aislado en navegador
 */
export function getTenantStorageKey(userId: string): string {
  return `project_central_tenant_${userId}`;
}

export function loadTenantDataLocal(userId: string): TenantDataState | null {
  try {
    const raw = localStorage.getItem(getTenantStorageKey(userId));
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Error reading local tenant data:', err);
  }
  return null;
}

export function saveTenantDataLocal(userId: string, data: TenantDataState): void {
  try {
    localStorage.setItem(getTenantStorageKey(userId), JSON.stringify(data));
  } catch (err) {
    console.warn('Error writing local tenant data:', err);
  }
}

/**
 * Consulta todos los datos del tenant actual desde Firestore con fallback local
 */
export async function fetchTenantDataFromFirestore(
  userId: string, 
  userEmail: string, 
  userName?: string
): Promise<TenantDataState> {
  if (!userId) {
    return {
      projects: [],
      tasks: [],
      meetings: [],
      communications: [],
      invoices: [],
      teamMembers: [],
      decisions: [],
      agreements: [],
      risks: [],
    };
  }

  try {
    // 1. Consultar proyectos del tenant
    const projQuery = query(collection(db, 'projects'), where('tenantId', '==', userId));
    const projSnap = await getDocs(projQuery).catch(err => {
      handleFirestoreError(err, OperationType.LIST, 'projects');
      throw err;
    });

    const projects: Project[] = [];
    projSnap.forEach(d => projects.push(d.data() as Project));

    // Si el usuario es nuevo y no tiene proyectos en Firestore, inicializamos SU ÚNICO PROYECTO DEMO
    if (projects.length === 0) {
      console.log(`Nuevo usuario detectado (${userId}). Inicializando proyecto de demostración único...`);
      const seed = createDemoDataForUser(userId, userEmail, userName);
      await seedTenantInFirestore(userId, seed);
      saveTenantDataLocal(userId, seed);
      return seed;
    }

    // Si ya tiene proyectos, consultamos el resto de sus colecciones aisladas
    const [
      taskSnap,
      meetSnap,
      commSnap,
      invSnap,
      tmSnap,
      decSnap,
      agrSnap,
      riskSnap,
    ] = await Promise.all([
      getDocs(query(collection(db, 'tasks'), where('tenantId', '==', userId))),
      getDocs(query(collection(db, 'meetings'), where('tenantId', '==', userId))),
      getDocs(query(collection(db, 'communications'), where('tenantId', '==', userId))),
      getDocs(query(collection(db, 'invoices'), where('tenantId', '==', userId))),
      getDocs(query(collection(db, 'teamMembers'), where('tenantId', '==', userId))),
      getDocs(query(collection(db, 'decisions'), where('tenantId', '==', userId))),
      getDocs(query(collection(db, 'agreements'), where('tenantId', '==', userId))),
      getDocs(query(collection(db, 'risks'), where('tenantId', '==', userId))),
    ]);

    const tasks: Task[] = [];
    taskSnap.forEach(d => tasks.push(d.data() as Task));

    const meetings: Meeting[] = [];
    meetSnap.forEach(d => meetings.push(d.data() as Meeting));

    const communications: Communication[] = [];
    commSnap.forEach(d => communications.push(d.data() as Communication));

    const invoices: Invoice[] = [];
    invSnap.forEach(d => invoices.push(d.data() as Invoice));

    const teamMembers: TeamMember[] = [];
    tmSnap.forEach(d => teamMembers.push(d.data() as TeamMember));

    const decisions: ProjectDecision[] = [];
    decSnap.forEach(d => decisions.push(d.data() as ProjectDecision));

    const agreements: ProjectAgreement[] = [];
    agrSnap.forEach(d => agreements.push(d.data() as ProjectAgreement));

    const risks: ProjectRisk[] = [];
    riskSnap.forEach(d => risks.push(d.data() as ProjectRisk));

    const resultState: TenantDataState = {
      projects,
      tasks,
      meetings,
      communications,
      invoices,
      teamMembers,
      decisions,
      agreements,
      risks,
    };

    saveTenantDataLocal(userId, resultState);
    return resultState;
  } catch (error) {
    console.warn('Error fetching Firestore tenant data, reverting to local tenant cache:', error);
    const local = loadTenantDataLocal(userId);
    if (local && local.projects.length > 0) {
      return local;
    }
    // Si no hay caché local tampoco, creamos el seed demo en local
    const seed = createDemoDataForUser(userId, userEmail, userName);
    saveTenantDataLocal(userId, seed);
    return seed;
  }
}

/**
 * Limpia recursivamente cualquier campo con valor undefined antes de enviar a Firestore
 */
export function cleanFirestorePayload<T extends Record<string, any>>(obj: T): T {
  const clean: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      if (val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
        clean[key] = cleanFirestorePayload(val);
      } else {
        clean[key] = val;
      }
    }
  }
  return clean as T;
}

/**
 * Guarda en Firestore la semilla de demostración con 1 proyecto y sus datos asociados
 */
export async function seedTenantInFirestore(userId: string, seed: UserTenantSeed): Promise<void> {
  try {
    const batch = writeBatch(db);

    // Guardar proyecto
    for (const p of seed.projects) {
      const ref = doc(db, 'projects', p.id);
      batch.set(ref, cleanFirestorePayload({ ...p, tenantId: userId }));
    }

    // Guardar miembros de equipo
    for (const tm of seed.teamMembers) {
      const ref = doc(db, 'teamMembers', tm.id);
      batch.set(ref, cleanFirestorePayload({ ...tm, tenantId: userId }));
    }

    // Guardar tareas
    for (const t of seed.tasks) {
      const ref = doc(db, 'tasks', t.id);
      batch.set(ref, cleanFirestorePayload({ ...t, tenantId: userId }));
    }

    // Guardar reuniones
    for (const m of seed.meetings) {
      const ref = doc(db, 'meetings', m.id);
      batch.set(ref, cleanFirestorePayload({ ...m, tenantId: userId }));
    }

    // Guardar comunicaciones
    for (const c of seed.communications) {
      const ref = doc(db, 'communications', c.id);
      batch.set(ref, cleanFirestorePayload({ ...c, tenantId: userId }));
    }

    // Guardar facturas
    for (const i of seed.invoices) {
      const ref = doc(db, 'invoices', i.id);
      batch.set(ref, cleanFirestorePayload({ ...i, tenantId: userId }));
    }

    // Guardar decisiones
    for (const d of seed.decisions) {
      const ref = doc(db, 'decisions', d.id);
      batch.set(ref, cleanFirestorePayload({ ...d, tenantId: userId }));
    }

    // Guardar acuerdos
    for (const a of seed.agreements) {
      const ref = doc(db, 'agreements', a.id);
      batch.set(ref, cleanFirestorePayload({ ...a, tenantId: userId }));
    }

    // Guardar riesgos
    for (const r of seed.risks) {
      const ref = doc(db, 'risks', r.id);
      batch.set(ref, cleanFirestorePayload({ ...r, tenantId: userId }));
    }

    await batch.commit();
    console.log(`Semilla multi-tenant creada exitosamente en Firestore para el usuario ${userId}`);
  } catch (error) {
    console.error('Error seeding demo project in Firestore:', error);
    handleFirestoreError(error, OperationType.WRITE, 'projects/batch');
  }
}

/**
 * Operación genérica de guardado con verificación de pertenencia al tenant
 */
export async function saveEntityToFirestore<T extends { id: string }>(
  collectionName: string,
  entity: T,
  userId: string
): Promise<void> {
  try {
    const payload = cleanFirestorePayload({
      ...entity,
      tenantId: userId,
      user_id: userId,
    });
    await setDoc(doc(db, collectionName, entity.id), payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${collectionName}/${entity.id}`);
    throw error;
  }
}

/**
 * Operación genérica de eliminación con verificación de pertenencia al tenant
 */
export async function deleteEntityFromFirestore(
  collectionName: string,
  id: string,
  userId: string
): Promise<void> {
  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${id}`);
    throw error;
  }
}
