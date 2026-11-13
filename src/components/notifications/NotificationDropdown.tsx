import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  Clock, 
  AlertTriangle, 
  AlertCircle, 
  Calendar, 
  ArrowRight, 
  X, 
  GitFork, 
  Flame,
  CheckCircle2,
  Info
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { AppNotification, NotificationSeverity } from '../../types';

interface NotificationDropdownProps {
  onNavigateToView: (viewId: string, entityId?: string) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onNavigateToView }) => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    clearAllNotifications 
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'deadlines' | 'schedule'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Filter notifications by selected tab
  const filteredNotifications = useMemo(() => {
    if (activeTab === 'deadlines') {
      return notifications.filter(n => 
        n.type === 'deadline_urgent' || 
        n.type === 'deadline_warning' || 
        n.type === 'deadline_overdue'
      );
    }
    if (activeTab === 'schedule') {
      return notifications.filter(n => 
        n.type === 'schedule_change' || 
        n.type === 'baseline_drift'
      );
    }
    return notifications;
  }, [notifications, activeTab]);

  const deadlineCount = useMemo(() => {
    return notifications.filter(n => 
      (n.type === 'deadline_urgent' || n.type === 'deadline_warning' || n.type === 'deadline_overdue') && !n.read
    ).length;
  }, [notifications]);

  const scheduleCount = useMemo(() => {
    return notifications.filter(n => 
      (n.type === 'schedule_change' || n.type === 'baseline_drift') && !n.read
    ).length;
  }, [notifications]);

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.read) {
      await markAsRead(notif.id);
    }
    if (notif.linkView) {
      onNavigateToView(notif.linkView, notif.linkEntityId);
      setIsOpen(false);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Hace un momento';
      if (diffMins < 60) return `Hace ${diffMins} min`;
      if (diffHours < 24) return `Hace ${diffHours} h`;
      if (diffDays === 1) return 'Ayer';
      return `Hace ${diffDays} días`;
    } catch {
      return 'Reciente';
    }
  };

  const getSeverityStyles = (severity: NotificationSeverity) => {
    switch (severity) {
      case 'danger':
        return {
          border: 'border-l-4 border-l-red-500 bg-red-50/40 hover:bg-red-50/80',
          badgeBg: 'bg-red-100 text-red-800 border-red-200',
          icon: <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />,
          label: 'Atrasada',
        };
      case 'urgent':
        return {
          border: 'border-l-4 border-l-amber-500 bg-amber-50/40 hover:bg-amber-50/80',
          badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: <Clock className="w-4 h-4 text-amber-600 shrink-0" />,
          label: 'Vence <24h',
        };
      case 'warning':
        return {
          border: 'border-l-4 border-l-yellow-500 bg-yellow-50/30 hover:bg-yellow-50/70',
          badgeBg: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0" />,
          label: 'Próxima 48h',
        };
      case 'info':
      default:
        return {
          border: 'border-l-4 border-l-blue-500 bg-blue-50/30 hover:bg-blue-50/70',
          badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: <Calendar className="w-4 h-4 text-blue-600 shrink-0" />,
          label: 'Cronograma',
        };
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-lg transition-all duration-200 cursor-pointer ${
          isOpen 
            ? 'bg-slate-100 text-slate-900 ring-2 ring-orange-500/30' 
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
        title="Centro de Notificaciones y Alertas"
        aria-label="Abrir centro de notificaciones"
      >
        <Bell className="w-4 h-4" />
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-5 h-5 px-1 bg-red-600 text-white text-[10px] font-bold rounded-full border-2 border-white shadow-xs animate-in zoom-in-75 duration-200">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[340px] sm:w-[420px] max-h-[580px] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col z-50 animate-in fade-in-50 slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-orange-600/30 text-orange-400">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">Centro de Alertas</h3>
                <p className="text-[11px] text-slate-400">
                  {unreadCount > 0 ? `${unreadCount} alerta(s) sin leer` : 'Todas las alertas al día'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors text-xs flex items-center gap-1"
                  title="Marcar todas como leídas"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="text-[10px] hidden sm:inline">Leer todas</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                  title="Limpiar historial"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Tab Filter Navigation */}
          <div className="px-3 pt-2 pb-1 bg-slate-50 border-b border-slate-200 flex items-center gap-1 text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 font-semibold rounded-lg text-xs transition-all flex items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Todas</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'all' ? 'bg-orange-100 text-orange-700' : 'bg-slate-200 text-slate-600'
              }`}>
                {notifications.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('deadlines')}
              className={`px-3 py-1.5 font-semibold rounded-lg text-xs transition-all flex items-center gap-1.5 ${
                activeTab === 'deadlines'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Vencimientos</span>
              {deadlineCount > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-100 text-red-700 font-bold">
                  {deadlineCount}
                </span>
              ) : null}
            </button>

            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-3 py-1.5 font-semibold rounded-lg text-xs transition-all flex items-center gap-1.5 ${
                activeTab === 'schedule'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Cronograma</span>
              {scheduleCount > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-700 font-bold">
                  {scheduleCount}
                </span>
              ) : null}
            </button>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto max-h-[400px] divide-y divide-slate-100 p-1">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
                <h4 className="text-xs font-bold text-slate-800">Sin notificaciones pendientes</h4>
                <p className="text-[11px] text-slate-500 mt-1 max-w-[240px] mx-auto">
                  {activeTab === 'all'
                    ? 'No hay alertas activas de tareas ni cambios recientes de cronograma.'
                    : activeTab === 'deadlines'
                    ? 'No hay tareas próximas a vencer en las siguientes 48 horas.'
                    : 'No se han registrado modificaciones de fechas ni desviaciones de línea base.'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const styles = getSeverityStyles(notif.severity);
                return (
                  <div
                    key={notif.id}
                    className={`relative p-3 rounded-lg transition-all text-xs cursor-pointer ${
                      styles.border
                    } ${!notif.read ? 'font-medium' : 'opacity-85'}`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <div className="mt-0.5">{styles.icon}</div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900 text-xs truncate">
                              {notif.title}
                            </span>
                            {!notif.read && (
                              <span className="w-2 h-2 rounded-full bg-orange-600 shrink-0" />
                            )}
                          </div>

                          <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                            {notif.message}
                          </p>

                          <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                            {notif.projectName && (
                              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded border border-slate-200 truncate max-w-[140px]">
                                {notif.projectName}
                              </span>
                            )}
                            <span>{formatTimeAgo(notif.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Item Actions */}
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => deleteNotification(notif.id)}
                          className="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-slate-200/50 transition-colors"
                          title="Eliminar notificación"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Quick navigation hint */}
                    {notif.linkView && (
                      <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-orange-600 font-bold hover:text-orange-700">
                        <span>
                          {notif.linkView === 'gantt' ? 'Ver en Cronograma & Gantt' : 'Ver detalle de la tarea'}
                        </span>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
              <span className="text-[10px] text-slate-400">
                Monitoreo activo de plazos (48h/24h) y desviaciones de línea base
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
