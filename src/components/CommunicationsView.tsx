import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Communication } from '../types';
import { MessageSquare, Plus, Trash2, Edit3, X, Send, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';

export default function CommunicationsView() {
  const { communications, projects, addCommunication, updateCommunication, deleteCommunication } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComm, setEditingComm] = useState<Communication | null>(null);
  const [filterProject, setFilterProject] = useState('ALL');

  const [formData, setFormData] = useState({
    project_id: projects[0]?.id || '',
    comm_date: new Date().toISOString().slice(0, 16),
    comm_type: 'Correo electrónico',
    outcome: '',
    notes: '',
  });

  const commTypes = [
    'Correo electrónico',
    'Llamada telefónica',
    'Mensaje / Slack / Teams',
    'Presentación ejecutiva',
    'Minuta de acuerdos',
    'Reporte de estatus',
  ];

  const handleOpenAdd = () => {
    setEditingComm(null);
    setFormData({
      project_id: projects[0]?.id || '',
      comm_date: new Date().toISOString().slice(0, 16),
      comm_type: 'Correo electrónico',
      outcome: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Communication) => {
    setEditingComm(c);
    setFormData({
      project_id: c.project_id,
      comm_date: c.comm_date ? new Date(c.comm_date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      comm_type: c.comm_type || 'Correo electrónico',
      outcome: c.outcome || '',
      notes: c.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.project_id) return;
    if (editingComm) {
      await updateCommunication(editingComm.id, formData);
    } else {
      await addCommunication(formData);
    }
    setIsModalOpen(false);
  };

  const filteredComms = communications.filter(c => {
    return filterProject === 'ALL' || c.project_id === filterProject;
  }).sort((a, b) => new Date(b.comm_date).getTime() - new Date(a.comm_date).getTime());

  const getProjectName = (id: string) => {
    return projects.find(p => p.id === id)?.name || 'General';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center">
            <MessageSquare className="w-6 h-6 mr-2.5 text-orange-600" />
            Comunicaciones & Minutas de Acuerdos
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Bitácora de interacciones con clientes, reportes de estatus y minutas</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-all shadow-xs active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Registrar Comunicación
        </button>
      </div>

      {/* Filter bar */}
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
          {filteredComms.length} registro(s) en bitácora
        </div>
      </div>

      {/* Timeline Feed */}
      <div className="space-y-3">
        {filteredComms.map((comm) => {
          const dateObj = new Date(comm.comm_date);
          return (
            <div key={comm.id} className="bg-white rounded-xl p-4.5 border border-slate-200 shadow-xs hover:border-slate-300 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                    {comm.comm_type}
                  </span>
                  <span className="text-xs font-bold text-orange-600">
                    {getProjectName(comm.project_id)}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {dateObj.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {comm.outcome && (
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {comm.outcome}
                  </h3>
                )}

                {comm.notes && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {comm.notes}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1 self-end md:self-start shrink-0">
                <button
                  onClick={() => handleOpenEdit(comm)}
                  className="p-1 text-slate-400 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors"
                  title="Editar minuta"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => deleteCommunication(comm.id)}
                  className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100 transition-colors"
                  title="Eliminar minuta"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
        {filteredComms.length === 0 && (
          <div className="py-12 bg-white rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
            No se han registrado comunicaciones para este filtro.
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-300 p-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-orange-600" />
                {editingComm ? 'Editar Registro de Comunicación' : 'Nueva Minuta / Comunicación'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">Iniciativa Relacionada *</label>
                <select
                  required
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-orange-500 font-medium text-xs"
                >
                  <option value="">Seleccionar iniciativa...</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Fecha y Hora</label>
                  <input
                    type="datetime-local"
                    value={formData.comm_date}
                    onChange={(e) => setFormData({ ...formData, comm_date: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-orange-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Canal / Formato</label>
                  <select
                    value={formData.comm_type}
                    onChange={(e) => setFormData({ ...formData, comm_type: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-orange-500 text-xs"
                  >
                    {commTypes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">Resultado / Acuerdo Principal</label>
                <input
                  type="text"
                  value={formData.outcome}
                  onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                  placeholder="Ej. Aprobación formal del entregable fase 1"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-orange-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">Notas Detalladas / Minuta</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Puntos discutidos, próximos pasos..."
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-orange-500 text-xs"
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
                  {editingComm ? 'Guardar Cambios' : 'Registrar Minuta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
