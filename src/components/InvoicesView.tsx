import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Invoice, InvoiceStatus } from '../types';
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  Filter, 
  Copy, 
  Check, 
  Download, 
  Kanban, 
  List, 
  PieChart as PieIcon, 
  ArrowRight, 
  Calendar, 
  FileText, 
  ArrowUpRight, 
  ArrowDownRight,
  Send,
  AlertTriangle,
  Building2
} from 'lucide-react';

type ViewMode = 'table' | 'kanban' | 'by-project';

export default function InvoicesView() {
  const { invoices, projects, addInvoice, updateInvoice, deleteInvoice } = useData();
  
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  
  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterProject, setFilterProject] = useState('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'due' | 'number'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [copiedMd, setCopiedMd] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    project_id: projects[0]?.id || '',
    invoice_number: '',
    amount: 0,
    sent_date: new Date().toISOString().split('T')[0],
    due_date: '',
    status: 'Aún no enviado' as InvoiceStatus,
    notes: '',
  });

  // Calculate Next Invoice Number Suggestion
  const generateNextInvoiceNumber = () => {
    const year = new Date().getFullYear();
    const count = invoices.length + 1;
    return `CAP-${year}-${String(count).padStart(3, '0')}`;
  };

  const handleOpenAdd = () => {
    setEditingInvoice(null);
    const today = new Date();
    const defaultDueDate = new Date(today);
    defaultDueDate.setDate(defaultDueDate.getDate() + 30); // 30 days default credit

    setFormData({
      project_id: projects[0]?.id || '',
      invoice_number: generateNextInvoiceNumber(),
      amount: 50000,
      sent_date: today.toISOString().split('T')[0],
      due_date: defaultDueDate.toISOString().split('T')[0],
      status: 'Aún no enviado',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (i: Invoice) => {
    setEditingInvoice(i);
    setFormData({
      project_id: i.project_id,
      invoice_number: i.invoice_number,
      amount: Number(i.amount) || 0,
      sent_date: i.sent_date || '',
      due_date: i.due_date || '',
      status: (i.status || 'Aún no enviado') as InvoiceStatus,
      notes: i.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.invoice_number.trim() || !formData.project_id) return;
    if (editingInvoice) {
      await updateInvoice(editingInvoice.id, formData);
    } else {
      await addInvoice(formData);
    }
    setIsModalOpen(false);
  };

  const handleQuickStatus = async (id: string, newStatus: InvoiceStatus) => {
    await updateInvoice(id, { status: newStatus });
  };

  // Financial Metrics
  const metrics = useMemo(() => {
    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalSent = 0;
    let totalDraft = 0;
    let totalOverdue = 0;

    const todayStr = new Date().toISOString().split('T')[0];

    invoices.forEach(i => {
      const amt = Number(i.amount) || 0;
      totalInvoiced += amt;
      if (i.status === 'Pagada') {
        totalPaid += amt;
      } else if (i.status === 'Atrasada' || (i.status === 'Enviada' && i.due_date && i.due_date < todayStr)) {
        totalOverdue += amt;
      } else if (i.status === 'Enviada') {
        totalSent += amt;
      } else {
        totalDraft += amt;
      }
    });

    const pendingTotal = totalInvoiced - totalPaid;
    const collectionRate = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0;

    return {
      totalInvoiced,
      totalPaid,
      totalSent,
      totalDraft,
      totalOverdue,
      pendingTotal,
      collectionRate,
    };
  }, [invoices]);

  // Due date helper
  const getDueDateInfo = (dueDate?: string, status?: string) => {
    if (status === 'Pagada') return { text: 'Pagada', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (!dueDate) return { text: 'Sin fecha límite', color: 'text-slate-500 bg-slate-50 border-slate-200' };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { 
        text: `Vencida hace ${Math.abs(diffDays)}d`, 
        color: 'text-red-800 bg-red-50 border-red-200 font-bold',
        isOverdue: true 
      };
    } else if (diffDays === 0) {
      return { 
        text: 'Vence hoy', 
        color: 'text-amber-800 bg-amber-50 border-amber-200 font-bold',
        isUrgent: true 
      };
    } else if (diffDays <= 7) {
      return { 
        text: `Vence en ${diffDays}d`, 
        color: 'text-amber-700 bg-amber-50 border-amber-200',
        isUrgent: true 
      };
    }
    return { 
      text: `${dueDate}`, 
      color: 'text-slate-600 bg-slate-50 border-slate-200' 
    };
  };

  // Filtered & Sorted Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(i => {
      const matchSearch = i.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.notes && i.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (projects.find(p => p.id === i.project_id)?.name.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchStatus = filterStatus === 'ALL' || i.status === filterStatus;
      const matchProj = filterProject === 'ALL' || i.project_id === filterProject;

      return matchSearch && matchStatus && matchProj;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = new Date(b.sent_date || '').getTime() - new Date(a.sent_date || '').getTime();
      } else if (sortBy === 'due') {
        comparison = new Date(b.due_date || '').getTime() - new Date(a.due_date || '').getTime();
      } else if (sortBy === 'amount') {
        comparison = (Number(b.amount) || 0) - (Number(a.amount) || 0);
      } else if (sortBy === 'number') {
        comparison = a.invoice_number.localeCompare(b.invoice_number);
      }
      return sortOrder === 'asc' ? -comparison : comparison;
    });
  }, [invoices, projects, searchTerm, filterStatus, filterProject, sortBy, sortOrder]);

  const getProjectName = (id: string) => {
    return projects.find(p => p.id === id)?.name || 'Iniciativa General';
  };

  // Markdown Export
  const handleCopyMarkdown = () => {
    let md = `| Folio Factura | Iniciativa / Proyecto | Monto ($) | Fecha Emisión | Vencimiento | Estado | Notas |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

    invoices.forEach(i => {
      const pName = getProjectName(i.project_id);
      md += `| **${i.invoice_number}** | ${pName} | $${(Number(i.amount) || 0).toLocaleString()} | ${i.sent_date || 'N/A'} | ${i.due_date || 'N/A'} | ${i.status} | ${i.notes || '-'} |\n`;
    });

    md += `\n**Total Facturado:** $${metrics.totalInvoiced.toLocaleString()} | **Cobrado:** $${metrics.totalPaid.toLocaleString()} (${metrics.collectionRate}%) | **Por Cobrar:** $${metrics.pendingTotal.toLocaleString()}\n`;

    navigator.clipboard.writeText(md);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2500);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Folio', 'Proyecto', 'Monto', 'Fecha_Emision', 'Fecha_Vencimiento', 'Estado', 'Notas'];
    const rows = invoices.map(i => [
      `"${i.invoice_number}"`,
      `"${getProjectName(i.project_id)}"`,
      i.amount,
      `"${i.sent_date || ''}"`,
      `"${i.due_date || ''}"`,
      `"${i.status}"`,
      `"${(i.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Facturacion_Capricorn_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-200 uppercase tracking-wider">
              Control Financiero
            </span>
            <span className="text-[10px] font-semibold text-slate-500">
              Gestión de Honorarios y Cobranza
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center mt-1">
            <CreditCard className="w-6 h-6 mr-2 text-orange-600" />
            Módulo de Facturación & Honorarios
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Emisión de facturas por hitos, control de cartera de cobranza y balance por iniciativa
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyMarkdown}
            className="inline-flex items-center px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 transition-all shadow-xs active:scale-95"
            title="Copiar resumen en Markdown"
          >
            {copiedMd ? <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1.5 text-slate-500" />}
            {copiedMd ? 'Copiado' : 'Copiar Tabla'}
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 transition-all shadow-xs active:scale-95"
            title="Exportar archivo CSV"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            Exportar CSV
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-all shadow-xs active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Nueva Factura
          </button>
        </div>
      </div>

      {/* Executive Financial Metrics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invoiced */}
        <div className="bg-white rounded-xl p-4.5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Monto Facturado</span>
            <span className="p-1 rounded bg-slate-100 text-slate-600">
              <FileText className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-slate-900">${metrics.totalInvoiced.toLocaleString()}</div>
            <p className="text-[10px] text-slate-400 mt-0.5">{invoices.length} facturas emitidas</p>
          </div>
        </div>

        {/* Total Collected */}
        <div className="bg-white rounded-xl p-4.5 border border-emerald-200/80 shadow-xs flex flex-col justify-between bg-gradient-to-b from-white to-emerald-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Cobrado (Efectivo)</span>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              {metrics.collectionRate}%
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-emerald-950">${metrics.totalPaid.toLocaleString()}</div>
            <p className="text-[10px] text-emerald-700 mt-0.5 font-medium">Tasa de efectividad de cobranza</p>
          </div>
        </div>

        {/* In Process / Pending */}
        <div className="bg-white rounded-xl p-4.5 border border-blue-200/80 shadow-xs flex flex-col justify-between bg-gradient-to-b from-white to-blue-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">Por Cobrar Vigente</span>
            <span className="p-1 rounded bg-blue-100 text-blue-700">
              <Clock className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-blue-950">${metrics.totalSent.toLocaleString()}</div>
            <p className="text-[10px] text-blue-700 mt-0.5 font-medium">Facturas enviadas en periodo de gracia</p>
          </div>
        </div>

        {/* Overdue */}
        <div className="bg-white rounded-xl p-4.5 border border-orange-200/80 shadow-xs flex flex-col justify-between bg-gradient-to-b from-white to-orange-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-900">Atrasado / En Riesgo</span>
            <span className="p-1 rounded bg-orange-100 text-orange-700">
              <AlertTriangle className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-orange-950">${metrics.totalOverdue.toLocaleString()}</div>
            <p className="text-[10px] text-orange-800 mt-0.5 font-medium">Requiere seguimiento de cobranza</p>
          </div>
        </div>
      </div>

      {/* Visual Progress Bar for Portfolio Collection */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <PieIcon className="w-3.5 h-3.5 text-orange-600" />
            Estructura de Cobranza del Portafolio
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            Pendiente Total: <strong>${metrics.pendingTotal.toLocaleString()}</strong>
          </span>
        </div>
        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
          <div 
            style={{ width: `${(metrics.totalPaid / (metrics.totalInvoiced || 1)) * 100}%` }}
            className="bg-emerald-500 h-full transition-all duration-500" 
            title={`Cobrado: $${metrics.totalPaid.toLocaleString()}`}
          />
          <div 
            style={{ width: `${(metrics.totalSent / (metrics.totalInvoiced || 1)) * 100}%` }}
            className="bg-blue-500 h-full transition-all duration-500" 
            title={`Enviadas: $${metrics.totalSent.toLocaleString()}`}
          />
          <div 
            style={{ width: `${(metrics.totalDraft / (metrics.totalInvoiced || 1)) * 100}%` }}
            className="bg-slate-400 h-full transition-all duration-500" 
            title={`Aún no enviado: $${metrics.totalDraft.toLocaleString()}`}
          />
          <div 
            style={{ width: `${(metrics.totalOverdue / (metrics.totalInvoiced || 1)) * 100}%` }}
            className="bg-orange-500 h-full transition-all duration-500" 
            title={`Atrasadas: $${metrics.totalOverdue.toLocaleString()}`}
          />
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-600 pt-0.5 font-medium">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            Cobrado ({metrics.collectionRate}%)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
            Enviadas en plazo
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block"></span>
            Borrador / Por enviar
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>
            Atrasadas
          </span>
        </div>
      </div>

      {/* View Switcher Tabs & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors ${
              viewMode === 'table'
                ? 'bg-[#0f172a] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Lista Ejecutiva ({filteredInvoices.length})</span>
          </button>

          <button
            onClick={() => setViewMode('kanban')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors ${
              viewMode === 'kanban'
                ? 'bg-[#0f172a] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Pipeline de Cobranza</span>
          </button>

          <button
            onClick={() => setViewMode('by-project')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors ${
              viewMode === 'by-project'
                ? 'bg-[#0f172a] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Desglose por Iniciativa</span>
          </button>
        </div>

        {/* Sorting Controls */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[10px] font-bold uppercase text-slate-500">Ordenar por:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
          >
            <option value="date">Fecha Emisión</option>
            <option value="due">Fecha Vencimiento</option>
            <option value="amount">Monto ($)</option>
            <option value="number">Folio</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold"
            title={`Orden ${sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}`}
          >
            {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: DETAILED EXECUTIVE TABLE                                          */}
      {/* ========================================================================= */}
      {viewMode === 'table' && (
        <div className="space-y-3">
          {/* Filters Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar folio, iniciativa, concepto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              {/* Status */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-orange-500 text-slate-700 font-semibold"
              >
                <option value="ALL">Todos los Estados</option>
                <option value="Aún no enviado">Aún no enviado</option>
                <option value="Enviada">Enviada</option>
                <option value="Pagada">Pagada</option>
                <option value="Atrasada">Atrasada</option>
              </select>

              {/* Project Filter */}
              <select
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-orange-500 text-slate-700 font-semibold max-w-[200px]"
              >
                <option value="ALL">Todas las Iniciativas</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <span className="text-xs font-semibold text-slate-500">
              {filteredInvoices.length} facturas encontradas
            </span>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs border-collapse">
                <thead className="bg-[#0f172a] text-white">
                  <tr>
                    <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-wider text-slate-200">
                      Folio / Factura
                    </th>
                    <th className="px-3 py-3 font-bold text-[10px] uppercase tracking-wider text-slate-200">
                      Iniciativa Estratégica
                    </th>
                    <th className="px-3 py-3 font-bold text-[10px] uppercase tracking-wider text-slate-200">
                      Monto ($)
                    </th>
                    <th className="px-3 py-3 font-bold text-[10px] uppercase tracking-wider text-slate-200">
                      Fecha Emisión
                    </th>
                    <th className="px-3 py-3 font-bold text-[10px] uppercase tracking-wider text-slate-200">
                      Vencimiento / Plazo
                    </th>
                    <th className="px-3 py-3 font-bold text-[10px] uppercase tracking-wider text-slate-200">
                      Estado de Cobro
                    </th>
                    <th className="px-3 py-3 font-bold text-[10px] uppercase tracking-wider text-slate-200 text-right">
                      Acciones Rápidas
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredInvoices.map((inv, idx) => {
                    const dueInfo = getDueDateInfo(inv.due_date, inv.status);
                    return (
                      <tr 
                        key={inv.id} 
                        className={`hover:bg-slate-50 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'}`}
                      >
                        {/* Invoice Number & Concept */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-orange-600" />
                            <span>{inv.invoice_number}</span>
                          </div>
                          {inv.notes && (
                            <p className="text-[10px] text-slate-500 font-normal truncate max-w-xs mt-0.5">
                              {inv.notes}
                            </p>
                          )}
                        </td>

                        {/* Project Name */}
                        <td className="px-3 py-3 font-medium text-slate-800">
                          <span className="text-orange-600 font-semibold hover:underline block max-w-xs truncate">
                            {getProjectName(inv.project_id)}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className="font-extrabold text-slate-900 text-xs">
                            ${(Number(inv.amount) || 0).toLocaleString()}
                          </span>
                        </td>

                        {/* Issue Date */}
                        <td className="px-3 py-3 text-slate-600 whitespace-nowrap text-[11px]">
                          {inv.sent_date || 'N/A'}
                        </td>

                        {/* Due Date Badge */}
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className={`text-[10px] px-2 py-0.5 rounded border inline-flex items-center gap-1 ${dueInfo.color}`}>
                            {dueInfo.isOverdue && <AlertTriangle className="w-3 h-3 text-red-600" />}
                            {dueInfo.text}
                          </span>
                        </td>

                        {/* Status Quick Selector */}
                        <td className="px-3 py-3 whitespace-nowrap">
                          <select
                            value={inv.status}
                            onChange={(e) => handleQuickStatus(inv.id, e.target.value as InvoiceStatus)}
                            className={`text-[10px] font-bold px-2 py-1 rounded-lg border focus:outline-none transition-colors cursor-pointer ${
                              inv.status === 'Pagada' ? 'bg-emerald-50 text-emerald-900 border-emerald-300' :
                              inv.status === 'Atrasada' ? 'bg-orange-50 text-orange-900 border-orange-300' :
                              inv.status === 'Enviada' ? 'bg-blue-50 text-blue-900 border-blue-300' :
                              'bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                          >
                            <option value="Aún no enviado">Aún no enviado</option>
                            <option value="Enviada">Enviada</option>
                            <option value="Pagada">Pagada (Cobrado)</option>
                            <option value="Atrasada">Atrasada</option>
                          </select>
                        </td>

                        {/* Actions */}
                        <td className="px-3 py-3 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1">
                            {inv.status !== 'Pagada' && (
                              <button
                                onClick={() => handleQuickStatus(inv.id, 'Pagada')}
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold border border-emerald-200 flex items-center gap-1 transition-colors"
                                title="Marcar como cobrada"
                              >
                                <Check className="w-3 h-3" />
                                Cobrada
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenEdit(inv)}
                              className="p-1 text-slate-400 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors"
                              title="Editar factura"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => deleteInvoice(inv.id)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100 transition-colors"
                              title="Eliminar factura"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredInvoices.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-xs">
                        No se encontraron facturas registradas con los filtros aplicados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: KANBAN PIPELINE                                                   */}
      {/* ========================================================================= */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(['Aún no enviado', 'Enviada', 'Atrasada', 'Pagada'] as InvoiceStatus[]).map((colStatus) => {
            const colInvoices = invoices.filter(i => i.status === colStatus);
            const colTotal = colInvoices.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

            const colConfig = {
              'Aún no enviado': { title: 'Borrador / Por Enviar', color: 'bg-slate-100 text-slate-800 border-slate-300', headerBg: 'bg-slate-200/80 text-slate-800' },
              'Enviada': { title: 'Enviada al Cliente', color: 'bg-blue-50 text-blue-800 border-blue-300', headerBg: 'bg-blue-100 text-blue-900' },
              'Atrasada': { title: 'Cobranza Atrasada', color: 'bg-orange-50 text-orange-900 border-orange-300', headerBg: 'bg-orange-100 text-orange-900' },
              'Pagada': { title: 'Cobrada / Liquidada', color: 'bg-emerald-50 text-emerald-900 border-emerald-300', headerBg: 'bg-emerald-100 text-emerald-900' },
            }[colStatus];

            return (
              <div key={colStatus} className="bg-slate-50/80 rounded-xl border border-slate-200 flex flex-col max-h-[75vh]">
                {/* Column Header */}
                <div className={`p-3 rounded-t-xl border-b border-slate-200 ${colConfig.headerBg} flex items-center justify-between`}>
                  <div>
                    <h3 className="text-xs font-bold">{colConfig.title}</h3>
                    <span className="text-[10px] font-extrabold opacity-80">${colTotal.toLocaleString()}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-white/60 text-xs font-bold">
                    {colInvoices.length}
                  </span>
                </div>

                {/* Column Cards List */}
                <div className="p-2 space-y-2 overflow-y-auto flex-1">
                  {colInvoices.map((inv) => {
                    const dueInfo = getDueDateInfo(inv.due_date, inv.status);
                    return (
                      <div 
                        key={inv.id}
                        className="bg-white rounded-lg p-3 border border-slate-200 shadow-xs hover:border-slate-300 transition-all space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <span className="font-bold text-slate-900 text-xs flex items-center gap-1">
                            <FileText className="w-3 h-3 text-orange-600" />
                            {inv.invoice_number}
                          </span>
                          <span className="font-extrabold text-xs text-slate-900">
                            ${(Number(inv.amount) || 0).toLocaleString()}
                          </span>
                        </div>

                        <p className="text-[11px] font-semibold text-orange-700 truncate">
                          {getProjectName(inv.project_id)}
                        </p>

                        {inv.notes && (
                          <p className="text-[10px] text-slate-500 italic bg-slate-50 p-1.5 rounded border border-slate-100">
                            {inv.notes}
                          </p>
                        )}

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                          <span className={`px-1.5 py-0.5 rounded border ${dueInfo.color}`}>
                            {dueInfo.text}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEdit(inv)}
                              className="p-1 text-slate-400 hover:text-slate-800 rounded"
                              title="Editar"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => deleteInvoice(inv.id)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Fast Shift Buttons */}
                        <div className="pt-1 flex items-center gap-1">
                          {colStatus !== 'Pagada' && (
                            <button
                              onClick={() => handleQuickStatus(inv.id, 'Pagada')}
                              className="w-full py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded border border-emerald-200 transition-colors"
                            >
                              ✓ Marcar Pagada
                            </button>
                          )}
                          {colStatus === 'Aún no enviado' && (
                            <button
                              onClick={() => handleQuickStatus(inv.id, 'Enviada')}
                              className="w-full py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 text-[10px] font-bold rounded border border-blue-200 transition-colors"
                            >
                              → Enviar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {colInvoices.length === 0 && (
                    <div className="py-8 text-center text-[11px] text-slate-400 italic">
                      Sin facturas en esta etapa
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: BY PROJECT BREAKDOWN                                              */}
      {/* ========================================================================= */}
      {viewMode === 'by-project' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((proj) => {
            const projInvoices = invoices.filter(i => i.project_id === proj.id);
            const totalInvoicedProj = projInvoices.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
            const totalPaidProj = projInvoices.filter(i => i.status === 'Pagada').reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
            const estimatedValue = Number(proj.estimated_value) || 0;
            const collectionPct = totalInvoicedProj > 0 ? Math.round((totalPaidProj / totalInvoicedProj) * 100) : 0;
            const invoicedVsEstimatedPct = estimatedValue > 0 ? Math.round((totalInvoicedProj / estimatedValue) * 100) : 100;

            return (
              <div key={proj.id} className="bg-white rounded-xl p-4.5 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors space-y-3.5">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {proj.category || 'Iniciativa'}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      collectionPct === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {collectionPct}% Cobrado
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mt-2 leading-snug">
                    {proj.name}
                  </h3>

                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Valor Contratado</span>
                      <span className="text-sm font-extrabold text-slate-900">${estimatedValue.toLocaleString()}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Facturado</span>
                      <span className="text-sm font-extrabold text-orange-600">${totalInvoicedProj.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>Cobranza Efectiva:</span>
                      <span className="font-bold text-emerald-800">${totalPaidProj.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${collectionPct}%` }}
                        className="bg-emerald-500 h-full rounded-full transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500 font-medium">{projInvoices.length} factura(s)</span>
                  <button
                    onClick={() => {
                      setFilterProject(proj.id);
                      setViewMode('table');
                    }}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1"
                  >
                    Ver detalle <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD / EDIT INVOICE MODAL                                                  */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-300 p-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-orange-600" />
                {editingInvoice ? 'Editar Factura de Honorarios' : 'Registrar Nueva Factura'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Iniciativa Relacionada *
                </label>
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

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Folio / Número de Factura *
                </label>
                <input
                  type="text"
                  required
                  value={formData.invoice_number}
                  onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                  placeholder="Ej. CAP-2026-001"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-orange-500 text-xs font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Monto ($ MXN / USD) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-orange-500 text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Estado de Cobro
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as InvoiceStatus })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-orange-500 text-xs font-semibold"
                  >
                    <option value="Aún no enviado">Aún no enviado</option>
                    <option value="Enviada">Enviada</option>
                    <option value="Pagada">Pagada (Cobrado)</option>
                    <option value="Atrasada">Atrasada</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Fecha de Emisión
                  </label>
                  <input
                    type="date"
                    value={formData.sent_date}
                    onChange={(e) => setFormData({ ...formData, sent_date: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-orange-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Fecha de Vencimiento
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-orange-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Concepto / Hito de Entrega
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ej. Anticipo 30% arranque de consultoría CSEA..."
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
                  {editingInvoice ? 'Guardar Cambios' : 'Registrar Factura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
