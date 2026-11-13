import React from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { 
  AlertCircle, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  X, 
  ArrowRight 
} from 'lucide-react';
import { NotificationSeverity } from '../../types';

interface ToastContainerProps {
  onNavigateToView: (viewId: string, entityId?: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ onNavigateToView }) => {
  const { activeToasts, dismissToast, markAsRead } = useNotifications();

  if (activeToasts.length === 0) return null;

  const getToastIcon = (severity: NotificationSeverity) => {
    switch (severity) {
      case 'danger':
        return <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />;
      case 'urgent':
        return <Clock className="w-4 h-4 text-amber-600 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0" />;
      case 'info':
      default:
        return <Calendar className="w-4 h-4 text-blue-600 shrink-0" />;
    }
  };

  const getBorderColor = (severity: NotificationSeverity) => {
    switch (severity) {
      case 'danger':
        return 'border-l-4 border-l-red-500 shadow-red-500/10';
      case 'urgent':
        return 'border-l-4 border-l-amber-500 shadow-amber-500/10';
      case 'warning':
        return 'border-l-4 border-l-yellow-500 shadow-yellow-500/10';
      case 'info':
      default:
        return 'border-l-4 border-l-blue-500 shadow-blue-500/10';
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {activeToasts.map(({ id, notification }) => (
        <div
          key={id}
          className={`pointer-events-auto bg-white rounded-xl shadow-xl border border-slate-200 p-3.5 transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in ${getBorderColor(
            notification.severity
          )}`}
        >
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="mt-0.5">{getToastIcon(notification.severity)}</div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {notification.title}
                </p>
                <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                  {notification.message}
                </p>
                {notification.projectName && (
                  <span className="inline-block mt-1 px-1.5 py-0.2 bg-slate-100 text-slate-600 font-semibold rounded text-[9px] border border-slate-200">
                    {notification.projectName}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => dismissToast(id)}
              className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors shrink-0"
              title="Cerrar aviso"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {notification.linkView && (
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  markAsRead(notification.id);
                  dismissToast(id);
                  onNavigateToView(notification.linkView!, notification.linkEntityId);
                }}
                className="text-[11px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>
                  {notification.linkView === 'gantt' ? 'Ver en Cronograma' : 'Ver detalle'}
                </span>
                <ArrowRight className="w-3 h-3" />
              </button>
              <span className="text-[9px] text-slate-400">Alerta del sistema</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
