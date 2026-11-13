import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { 
  Search, 
  Briefcase, 
  CheckSquare, 
  Users, 
  Calendar, 
  CreditCard, 
  MessageSquare, 
  X, 
  ArrowRight,
  PlusCircle,
  Clock,
  ExternalLink,
  BarChart3,
  BookOpen,
  Compass
} from 'lucide-react';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (viewId: string, initialFilter?: string) => void;
}

export default function QuickSearchModal({ isOpen, onClose, onNavigate }: QuickSearchModalProps) {
  const { projects, tasks, teamMembers, meetings, invoices, communications } = useData();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Keyboard shortcut ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const matchedProjects = q ? projects.filter(p => 
    p.name.toLowerCase().includes(q) || 
    (p.category && p.category.toLowerCase().includes(q)) ||
    p.status.toLowerCase().includes(q)
  ) : [];

  const matchedTasks = q ? tasks.filter(t => 
    t.name.toLowerCase().includes(q) || 
    (t.notes && t.notes.toLowerCase().includes(q)) ||
    t.priority.toLowerCase().includes(q)
  ) : [];

  const matchedMembers = q ? teamMembers.filter(m => 
    m.name.toLowerCase().includes(q) || 
    (m.role && m.role.toLowerCase().includes(q))
  ) : [];

  const matchedMeetings = q ? meetings.filter(m => 
    m.name.toLowerCase().includes(q) || 
    (m.notes && m.notes.toLowerCase().includes(q))
  ) : [];

  const matchedInvoices = q ? invoices.filter(i => 
    i.invoice_number.toLowerCase().includes(q) || 
    (i.status && i.status.toLowerCase().includes(q))
  ) : [];

  const totalMatches = matchedProjects.length + matchedTasks.length + matchedMembers.length + matchedMeetings.length + matchedInvoices.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-24 bg-slate-950/60 backdrop-blur-xs p-4 animate-fade-in">
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-300 overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Bar */}
        <div className="flex items-center px-4 py-3 border-b border-slate-200 bg-slate-50">
          <Search className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar iniciativas, entregables, consultores, actas o facturas..."
            className="w-full bg-transparent text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md mr-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button 
            onClick={onClose}
            className="text-[10px] font-semibold bg-slate-200 text-slate-600 px-2 py-0.5 rounded hover:bg-slate-300"
          >
            ESC
          </button>
        </div>

        {/* Quick Action Shortcuts when no search */}
        {!query && (
          <div className="p-4 space-y-4 overflow-y-auto">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 px-1">Acciones Rápidas del Sistema</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    onNavigate('data-entry');
                    onClose();
                  }}
                  className="flex items-center p-2.5 bg-orange-50 hover:bg-orange-100/80 text-orange-900 rounded-lg text-xs font-semibold transition-all border border-orange-200"
                >
                  <PlusCircle className="w-4 h-4 mr-2 text-orange-600" />
                  <span>Capturar Datos</span>
                </button>

                <button
                  onClick={() => {
                    onNavigate('analytics');
                    onClose();
                  }}
                  className="flex items-center p-2.5 bg-amber-50 hover:bg-amber-100 text-amber-950 rounded-lg text-xs font-semibold transition-all border border-amber-200"
                >
                  <BarChart3 className="w-4 h-4 mr-2 text-amber-700" />
                  <span>Analíticas</span>
                </button>

                <button
                  onClick={() => {
                    onNavigate('tasks');
                    onClose();
                  }}
                  className="flex items-center p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg text-xs font-semibold transition-all border border-slate-200"
                >
                  <CheckSquare className="w-4 h-4 mr-2 text-slate-700" />
                  <span>Entregables</span>
                </button>

                <button
                  onClick={() => {
                    onNavigate('calendar');
                    onClose();
                  }}
                  className="flex items-center p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg text-xs font-semibold transition-all border border-slate-200"
                >
                  <Calendar className="w-4 h-4 mr-2 text-slate-700" />
                  <span>Sesiones</span>
                </button>

                <button
                  onClick={() => {
                    onNavigate('invoices');
                    onClose();
                  }}
                  className="flex items-center p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg text-xs font-semibold transition-all border border-slate-200"
                >
                  <CreditCard className="w-4 h-4 mr-2 text-slate-700" />
                  <span>Facturación</span>
                </button>

                <button
                  onClick={() => {
                    onNavigate('projects');
                    onClose();
                  }}
                  className="flex items-center p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg text-xs font-semibold transition-all border border-slate-200"
                >
                  <Briefcase className="w-4 h-4 mr-2 text-slate-700" />
                  <span>Proyectos</span>
                </button>

                <button
                  onClick={() => {
                    onNavigate('team');
                    onClose();
                  }}
                  className="flex items-center p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg text-xs font-semibold transition-all border border-slate-200"
                >
                  <Users className="w-4 h-4 mr-2 text-slate-700" />
                  <span>Matriz RACI</span>
                </button>

                <button
                  onClick={() => {
                    onNavigate('manual-csea');
                    onClose();
                  }}
                  className="flex items-center p-2.5 bg-orange-50 hover:bg-orange-100 text-orange-950 rounded-lg text-xs font-semibold transition-all border border-orange-200"
                >
                  <BookOpen className="w-4 h-4 mr-2 text-orange-600" />
                  <span>Manual CSEA v4</span>
                </button>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 px-1">Iniciativas Recientes</p>
              <div className="space-y-1">
                {projects.slice(0, 4).map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onNavigate('projects', p.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-lg text-left transition-colors border border-transparent hover:border-slate-200"
                  >
                    <div className="flex items-center min-w-0 pr-3">
                      <Briefcase className="w-4 h-4 text-blue-900 mr-2.5 shrink-0" />
                      <div className="truncate">
                        <span className="text-xs font-bold text-slate-900 block truncate">{p.name}</span>
                        <span className="text-[10px] text-slate-500">{p.category || 'Iniciativa'} • {p.status}</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-orange-600 shrink-0 flex items-center">
                      Abrir <ArrowRight className="w-3 h-3 ml-1" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Search Results List */}
        {query && (
          <div className="p-3 space-y-4 overflow-y-auto max-h-[60vh] divide-y divide-slate-100">
            {/* Help / Manual Match Banner */}
            {['ayuda', 'manual', 'csea', 'guia', 'guía', 'faq', 'onboarding', 'induccion', 'inducción', 'recorrido', 'tour', 'dimension'].some(k => q.includes(k)) && (
              <div className="pb-2">
                <button
                  onClick={() => {
                    onNavigate('manual-csea');
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-3 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center shrink-0">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block group-hover:text-orange-950">
                        Manual de Referencia y Guía CSEA v4.0
                      </span>
                      <span className="text-[11px] text-slate-600">
                        Sección 17 (Guía por Módulo), Sección 18 (FAQ) y 6 Dimensiones Oficiales
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-orange-700 flex items-center shrink-0">
                    Consultar <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </span>
                </button>
              </div>
            )}

            {totalMatches === 0 && !['ayuda', 'manual', 'csea', 'guia', 'guía', 'faq', 'onboarding', 'induccion', 'inducción', 'recorrido', 'tour', 'dimension'].some(k => q.includes(k)) ? (
              <div className="py-10 text-center">
                <Search className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-600">No se encontraron registros para "{query}"</p>
                <p className="text-[11px] text-slate-400 mt-1">Verifica el nombre o categoría ingresada.</p>
              </div>
            ) : (
              <>
                {/* Proyectos */}
                {matchedProjects.length > 0 && (
                  <div className="pt-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-900 mb-1 px-2 flex items-center">
                      <Briefcase className="w-3 h-3 mr-1.5" /> Iniciativas ({matchedProjects.length})
                    </p>
                    <div className="space-y-1">
                      {matchedProjects.map(p => (
                        <button
                          key={p.id}
                          onClick={() => {
                            onNavigate('projects', p.id);
                            onClose();
                          }}
                          className="w-full flex items-center justify-between p-2 hover:bg-slate-100 rounded-lg text-left transition-colors"
                        >
                          <div className="truncate pr-2">
                            <span className="text-xs font-bold text-slate-900 block truncate">{p.name}</span>
                            <span className="text-[10px] text-slate-500">{p.category} • Progreso: {p.progress_percentage}% • {p.status}</span>
                          </div>
                          <span className="text-[11px] font-bold text-orange-600 shrink-0">Ver Proyecto</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tareas */}
                {matchedTasks.length > 0 && (
                  <div className="pt-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800 mb-1 px-2 flex items-center">
                      <CheckSquare className="w-3 h-3 mr-1.5" /> Entregables ({matchedTasks.length})
                    </p>
                    <div className="space-y-1">
                      {matchedTasks.map(t => (
                        <button
                          key={t.id}
                          onClick={() => {
                            onNavigate('tasks');
                            onClose();
                          }}
                          className="w-full flex items-center justify-between p-2 hover:bg-slate-100 rounded-lg text-left transition-colors"
                        >
                          <div className="truncate pr-2">
                            <span className="text-xs font-bold text-slate-900 block truncate">{t.name}</span>
                            <span className="text-[10px] text-slate-500">Prioridad: {t.priority} • Estado: {t.status}</span>
                          </div>
                          <span className="text-[11px] font-bold text-slate-700 shrink-0">Ver Entregable</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Integrantes */}
                {matchedMembers.length > 0 && (
                  <div className="pt-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800 mb-1 px-2 flex items-center">
                      <Users className="w-3 h-3 mr-1.5" /> Consultores y Equipo ({matchedMembers.length})
                    </p>
                    <div className="space-y-1">
                      {matchedMembers.map(m => (
                        <button
                          key={m.id}
                          onClick={() => {
                            onNavigate('team');
                            onClose();
                          }}
                          className="w-full flex items-center justify-between p-2 hover:bg-slate-100 rounded-lg text-left transition-colors"
                        >
                          <div className="truncate pr-2">
                            <span className="text-xs font-bold text-slate-900 block truncate">{m.name}</span>
                            <span className="text-[10px] text-slate-500">Rol: {m.role}</span>
                          </div>
                          <span className="text-[11px] font-bold text-slate-700 shrink-0">Ver Equipo</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Facturas */}
                {matchedInvoices.length > 0 && (
                  <div className="pt-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-orange-700 mb-1 px-2 flex items-center">
                      <CreditCard className="w-3 h-3 mr-1.5" /> Facturación ({matchedInvoices.length})
                    </p>
                    <div className="space-y-1">
                      {matchedInvoices.map(i => (
                        <button
                          key={i.id}
                          onClick={() => {
                            onNavigate('invoices');
                            onClose();
                          }}
                          className="w-full flex items-center justify-between p-2 hover:bg-orange-50/60 rounded-lg text-left transition-colors"
                        >
                          <div className="truncate pr-2">
                            <span className="text-xs font-bold text-slate-900 block truncate">{i.invoice_number}</span>
                            <span className="text-[10px] text-slate-500">Monto: ${i.amount.toLocaleString()} • Estado: {i.status}</span>
                          </div>
                          <span className="text-[11px] font-bold text-orange-700 shrink-0">Ver Factura</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
          <span>Usa <kbd className="px-1 py-0.5 bg-white border border-slate-300 rounded font-mono text-[9px]">Ctrl</kbd> + <kbd className="px-1 py-0.5 bg-white border border-slate-300 rounded font-mono text-[9px]">K</kbd> para abrir en cualquier momento</span>
          <span className="font-semibold text-slate-700">Capricorn Management</span>
        </div>
      </div>
    </div>
  );
}
