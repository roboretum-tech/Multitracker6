import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Meeting } from '../types';
import { Calendar as CalendarIcon, Plus, Trash2, Edit3, X, Clock, Video, Users, CheckCircle, AlertCircle } from 'lucide-react';

export default function CalendarView() {
  const { meetings, projects, addMeeting, updateMeeting, deleteMeeting } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [filterProject, setFilterProject] = useState('ALL');

  const [formData, setFormData] = useState({
    project_id: projects[0]?.id || '',
    name: '',
    meeting_date: new Date().toISOString().slice(0, 16),
    meeting_type: 'Reunión de alineación',
    status: 'Reunión programada',
    attendees: '',
    notes: '',
  });

  const meetingTypes = [
    'Reunión de alineación',
    'Seguimiento ejecutivo',
    'Revisión de entregables',
    'Comité directivo',
    'Kick-off',
    'Retrospectiva',
    'Sesión de trabajo',
  ];

  const handleOpenAdd = () => {
    setEditingMeeting(null);
    setFormData({
      project_id: projects[0]?.id || '',
      name: '',
      meeting_date: new Date().toISOString().slice(0, 16),
      meeting_type: 'Reunión de alineación',
      status: 'Reunión programada',
      attendees: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m: Meeting) => {
    setEditingMeeting(m);
    setFormData({
      project_id: m.project_id,
      name: m.name,
      meeting_date: m.meeting_date ? new Date(m.meeting_date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      meeting_type: m.meeting_type || 'Reunión de alineación',
      status: m.status || 'Reunión programada',
      attendees: m.attendees || '',
      notes: m.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.project_id) return;

    if (editingMeeting) {
      await updateMeeting(editingMeeting.id, formData);
    } else {
      await addMeeting(formData);
    }
    setIsModalOpen(false);
  };

  const filteredMeetings = meetings.filter(m => {
    if (filterProject === 'ALL') return true;
    return m.project_id === filterProject;
  });

  const getProjectName = (id: string) => {
    const p = projects.find(proj => proj.id === id);
    return p ? p.name : 'Iniciativa General';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center">
            <CalendarIcon className="w-6 h-6 mr-2.5 text-orange-600" />
            Calendario de Reuniones y Comités
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Gestión de sesiones de alineación, comités ejecutivos y seguimiento</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-all shadow-xs active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Nueva Sesión
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Iniciativa:</span>
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-orange-500 text-slate-800 font-semibold"
          >
            <option value="ALL">Todas las Iniciativas</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="text-xs font-semibold text-slate-500">
          {filteredMeetings.length} sesión(es) registradas
        </div>
      </div>

      {/* Meeting Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMeetings.map((meet) => {
          const dateObj = new Date(meet.meeting_date);
          const isPast = dateObj.getTime() < Date.now();

          return (
            <div key={meet.id} className="bg-white rounded-xl p-4.5 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                    {meet.meeting_type || 'Sesión'}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    isPast ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}>
                    {meet.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">{meet.name}</h3>
                  <p className="text-xs text-orange-600 font-medium mt-0.5">{getProjectName(meet.project_id)}</p>
                </div>

                <div className="bg-slate-50 rounded-lg p-2.5 space-y-1.5 text-xs text-slate-600 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-[11px]">{dateObj.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {meet.attendees && (
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate text-[11px]">{meet.attendees}</span>
                    </div>
                  )}
                </div>

                {meet.notes && (
                  <p className="text-xs text-slate-600 italic bg-amber-50/60 p-2.5 rounded-lg border border-amber-100">
                    "{meet.notes}"
                  </p>
                )}
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">ID: {meet.id.slice(0, 8)}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(meet)}
                    className="p-1 text-slate-400 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors"
                    title="Editar reunión"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteMeeting(meet.id)}
                    className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100 transition-colors"
                    title="Eliminar reunión"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {filteredMeetings.length === 0 && (
          <div className="col-span-full py-12 bg-white rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
            No hay sesiones agendadas con los criterios seleccionados.
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-300 p-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-orange-600" />
                {editingMeeting ? 'Editar Sesión' : 'Agendar Nueva Sesión'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">Iniciativa Relacionada *</label>
                <select
                  required
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-orange-500 font-medium"
                >
                  <option value="">Seleccionar iniciativa...</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">Título de la Sesión *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej. Comité de Dirección y Avances"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Fecha y Hora</label>
                  <input
                    type="datetime-local"
                    value={formData.meeting_date}
                    onChange={(e) => setFormData({ ...formData, meeting_date: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Tipo de Sesión</label>
                  <select
                    value={formData.meeting_type}
                    onChange={(e) => setFormData({ ...formData, meeting_type: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-orange-500"
                  >
                    {meetingTypes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Estatus</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-orange-500"
                >
                  <option value="Reunión programada">Reunión programada</option>
                  <option value="Reunión completada">Reunión completada</option>
                  <option value="Reunión cancelada">Reunión cancelada</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Asistentes / Convocados</label>
                <input
                  type="text"
                  value={formData.attendees}
                  onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                  placeholder="Ej. Dirección General, Consultoría Líder, Sponsor"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Notas / Objetivos de la Sesión</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Temas a tratar o acuerdos de la sesión..."
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-xs"
                >
                  {editingMeeting ? 'Guardar Cambios' : 'Agendar Sesión'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
