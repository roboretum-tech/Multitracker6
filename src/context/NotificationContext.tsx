import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AppNotification, NotificationSeverity, NotificationType, Task, Project } from '../types';
import { useAuth } from './AuthContext';
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
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

interface ToastItem {
  id: string;
  notification: AppNotification;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  activeToasts: ToastItem[];
  addNotification: (notification: Omit<AppNotification, 'id' | 'tenantId' | 'created_at' | 'read'>) => Promise<AppNotification | null>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  dismissToast: (id: string) => void;
  checkTaskDeadlines: (tasks: Task[], projects: Project[]) => void;
  notifyScheduleChange: (updatedTask: Task, previousTask: Task, project?: Project) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

function getTenantNotificationStorageKey(userId: string): string {
  return `project_central_notifications_${userId}`;
}

function getDedupKey(tenantId: string, taskId: string, type: string, dateKey: string): string {
  return `pc_notif_dedup_${tenantId}_${taskId}_${type}_${dateKey}`;
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const currentUserId = currentUser?.id;

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeToasts, setActiveToasts] = useState<ToastItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Track checked deadlines to avoid duplicate loops
  const lastCheckedDateRef = useRef<string>('');

  // Load notifications from local storage and Firestore on user login
  useEffect(() => {
    if (!currentUserId) {
      setNotifications([]);
      setActiveToasts([]);
      return;
    }

    const loadNotifications = async () => {
      setIsLoading(true);
      // 1. First read local cache for zero delay
      let localList: AppNotification[] = [];
      try {
        const cached = localStorage.getItem(getTenantNotificationStorageKey(currentUserId));
        if (cached) {
          localList = JSON.parse(cached);
          setNotifications(localList);
        }
      } catch (e) {
        console.warn('Error reading local notifications:', e);
      }

      // 2. Fetch from Firestore for tenant isolation
      try {
        const notifRef = collection(db, 'notifications');
        const q = query(notifRef, where('tenantId', '==', currentUserId));
        const snap = await getDocs(q);
        
        const remoteList: AppNotification[] = [];
        snap.forEach(d => {
          remoteList.push(d.data() as AppNotification);
        });

        // Sort descending by created_at
        remoteList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        if (remoteList.length > 0) {
          setNotifications(remoteList);
          localStorage.setItem(getTenantNotificationStorageKey(currentUserId), JSON.stringify(remoteList));
        } else if (localList.length > 0) {
          // Sync local to Firestore
          for (const notif of localList.slice(0, 15)) {
            setDoc(doc(db, 'notifications', notif.id), { ...notif, tenantId: currentUserId }).catch(() => {});
          }
        }
      } catch (err) {
        console.warn('Error fetching Firestore notifications, using local state:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotifications();
  }, [currentUserId]);

  // Persist notifications locally
  const saveNotificationsLocally = useCallback((list: AppNotification[]) => {
    if (!currentUserId) return;
    try {
      localStorage.setItem(getTenantNotificationStorageKey(currentUserId), JSON.stringify(list));
    } catch (e) {
      console.warn('Error saving notifications locally:', e);
    }
  }, [currentUserId]);

  // Dismiss a toast
  const dismissToast = useCallback((toastId: string) => {
    setActiveToasts(prev => prev.filter(t => t.id !== toastId));
  }, []);

  // Trigger a toast alert
  const triggerToast = useCallback((notification: AppNotification) => {
    const toastId = 'toast-' + Math.random().toString(36).substring(2, 9);
    setActiveToasts(prev => [{ id: toastId, notification }, ...prev].slice(0, 4));

    // Auto dismiss after 6 seconds
    setTimeout(() => {
      setActiveToasts(prev => prev.filter(t => t.id !== toastId));
    }, 6000);
  }, []);

  // Add a new notification
  const addNotification = useCallback(async (
    data: Omit<AppNotification, 'id' | 'tenantId' | 'created_at' | 'read'>
  ): Promise<AppNotification | null> => {
    if (!currentUserId) return null;

    const newNotification: AppNotification = {
      ...data,
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      tenantId: currentUserId,
      created_at: new Date().toISOString(),
      read: false,
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      saveNotificationsLocally(updated);
      return updated;
    });

    triggerToast(newNotification);

    // Save to Firestore asynchronously
    try {
      await setDoc(doc(db, 'notifications', newNotification.id), newNotification);
    } catch (err) {
      console.warn('Could not persist notification to Firestore:', err);
    }

    return newNotification;
  }, [currentUserId, saveNotificationsLocally, triggerToast]);

  // Mark single notification as read
  const markAsRead = useCallback(async (id: string) => {
    if (!currentUserId) return;

    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      saveNotificationsLocally(updated);
      return updated;
    });

    try {
      await setDoc(doc(db, 'notifications', id), { read: true }, { merge: true });
    } catch (err) {
      console.warn('Error marking notification as read in Firestore:', err);
    }
  }, [currentUserId, saveNotificationsLocally]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!currentUserId) return;

    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      saveNotificationsLocally(updated);
      return updated;
    });

    try {
      const unreadList = notifications.filter(n => !n.read);
      if (unreadList.length > 0) {
        const batch = writeBatch(db);
        unreadList.forEach(n => {
          batch.update(doc(db, 'notifications', n.id), { read: true });
        });
        await batch.commit();
      }
    } catch (err) {
      console.warn('Error marking all notifications as read in Firestore:', err);
    }
  }, [currentUserId, notifications, saveNotificationsLocally]);

  // Delete notification
  const deleteNotification = useCallback(async (id: string) => {
    if (!currentUserId) return;

    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      saveNotificationsLocally(updated);
      return updated;
    });

    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (err) {
      console.warn('Error deleting notification from Firestore:', err);
    }
  }, [currentUserId, saveNotificationsLocally]);

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    if (!currentUserId) return;

    const toDelete = [...notifications];
    setNotifications([]);
    saveNotificationsLocally([]);

    try {
      const batch = writeBatch(db);
      toDelete.forEach(n => {
        batch.delete(doc(db, 'notifications', n.id));
      });
      await batch.commit();
    } catch (err) {
      console.warn('Error clearing notifications in Firestore:', err);
    }
  }, [currentUserId, notifications, saveNotificationsLocally]);

  // Check task deadlines: 48h, 24h, and overdue tasks
  const checkTaskDeadlines = useCallback((tasks: Task[], projects: Project[]) => {
    if (!currentUserId || tasks.length === 0) return;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const todayTimestamp = new Date(todayStr).getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;

    const projectMap = new Map<string, string>();
    projects.forEach(p => projectMap.set(p.id, p.name));

    tasks.forEach(task => {
      // Only active and uncompleted tasks
      if (task.is_done || task.status === 'Completado' || !task.end_date) return;

      const endDateTimestamp = new Date(task.end_date).getTime();
      if (isNaN(endDateTimestamp)) return;

      const diffDays = Math.round((endDateTimestamp - todayTimestamp) / oneDayMs);
      const projectName = projectMap.get(task.project_id) || 'Proyecto Principal';

      let notifType: NotificationType | null = null;
      let severity: NotificationSeverity = 'info';
      let title = '';
      let message = '';

      if (diffDays < 0) {
        // Tarea Vencida
        const daysPast = Math.abs(diffDays);
        notifType = 'deadline_overdue';
        severity = 'danger';
        title = `Tarea Vencida: ${task.name}`;
        message = `La tarea de "${projectName}" tiene un atraso de ${daysPast} día(s). Venció el ${task.end_date}.`;
      } else if (diffDays === 0) {
        // Vence hoy (<= 24h)
        notifType = 'deadline_urgent';
        severity = 'urgent';
        title = `Vence Hoy (24h): ${task.name}`;
        message = `La tarea de "${projectName}" vence el día de hoy (${task.end_date}). Requiere entrega o seguimiento.`;
      } else if (diffDays === 1) {
        // Vence mañana (<= 24h)
        notifType = 'deadline_urgent';
        severity = 'urgent';
        title = `Vence Mañana (24h): ${task.name}`;
        message = `La tarea de "${projectName}" vence mañana (${task.end_date}). Menos de 24 horas restantes.`;
      } else if (diffDays === 2) {
        // Vence en 2 días (<= 48h)
        notifType = 'deadline_warning';
        severity = 'warning';
        title = `Próxima a Vencer (48h): ${task.name}`;
        message = `La tarea de "${projectName}" tiene fecha límite en 2 días (${task.end_date}).`;
      }

      if (notifType) {
        const dedupKey = getDedupKey(currentUserId, task.id, notifType, todayStr);
        // Only trigger once per day per task per status
        if (!localStorage.getItem(dedupKey)) {
          localStorage.setItem(dedupKey, 'true');
          addNotification({
            type: notifType,
            severity,
            title,
            message,
            projectId: task.project_id,
            projectName,
            taskId: task.id,
            taskName: task.name,
            linkView: 'tasks',
            linkEntityId: task.id,
            metadata: {
              previousDate: task.end_date,
              hoursRemaining: diffDays >= 0 ? diffDays * 24 : 0,
            }
          });
        }
      }
    });
  }, [currentUserId, addNotification]);

  // Alert on schedule changes and baseline drift
  const notifyScheduleChange = useCallback((
    updatedTask: Task,
    previousTask: Task,
    project?: Project
  ) => {
    if (!currentUserId) return;

    const projectName = project?.name || 'Proyecto';
    const datesChanged = 
      (updatedTask.start_date && updatedTask.start_date !== previousTask.start_date) ||
      (updatedTask.end_date && updatedTask.end_date !== previousTask.end_date);

    if (datesChanged) {
      // 1. Notificación de modificación de cronograma
      addNotification({
        type: 'schedule_change',
        severity: 'info',
        title: `Modificación de Cronograma: ${updatedTask.name}`,
        message: `Se ajustaron las fechas de la tarea en "${projectName}". Nuevo rango: ${updatedTask.start_date || 'N/A'} al ${updatedTask.end_date || 'N/A'}.`,
        projectId: updatedTask.project_id,
        projectName,
        taskId: updatedTask.id,
        taskName: updatedTask.name,
        linkView: 'gantt',
        linkEntityId: updatedTask.id,
        metadata: {
          previousDate: previousTask.end_date,
          newDate: updatedTask.end_date,
        }
      });

      // 2. Comprobación de desviación de línea base
      const baselineEnd = updatedTask.baseline_end_date || previousTask.baseline_end_date;
      if (baselineEnd && updatedTask.end_date) {
        const currentEndMs = new Date(updatedTask.end_date).getTime();
        const baselineEndMs = new Date(baselineEnd).getTime();
        
        if (!isNaN(currentEndMs) && !isNaN(baselineEndMs)) {
          const diffDays = Math.round((currentEndMs - baselineEndMs) / (1000 * 60 * 60 * 24));
          
          if (diffDays > 0) {
            addNotification({
              type: 'baseline_drift',
              severity: diffDays > 3 ? 'danger' : 'warning',
              title: `Desviación de Línea Base (+${diffDays}d): ${updatedTask.name}`,
              message: `La tarea se ha desplazado ${diffDays} día(s) después de su fecha planificada de línea base (${baselineEnd}).`,
              projectId: updatedTask.project_id,
              projectName,
              taskId: updatedTask.id,
              taskName: updatedTask.name,
              linkView: 'baseline',
              linkEntityId: updatedTask.id,
              metadata: {
                previousDate: baselineEnd,
                newDate: updatedTask.end_date,
                baselineVarianceDays: diffDays,
              }
            });
          }
        }
      }
    }
  }, [currentUserId, addNotification]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        activeToasts,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
        dismissToast,
        checkTaskDeadlines,
        notifyScheduleChange,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
