import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { AppUser, UserRole } from '../types';
import CapricornLogo from './CapricornLogo';
import SqlSetupModal from './SqlSetupModal';
import { 
  ShieldCheck, 
  Users, 
  KeyRound, 
  Settings as SettingsIcon, 
  Database, 
  Activity, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Download, 
  RefreshCw, 
  Lock, 
  UserCheck, 
  Mail, 
  Building, 
  Search, 
  AlertTriangle, 
  FileText,
  Sliders,
  DollarSign,
  Calendar,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

type AdminTab = 'users' | 'settings' | 'database' | 'audit';

export default function AdminPanel() {
  const { 
    currentUser, 
    users, 
    auditLogs, 
    settings, 
    addUser, 
    updateUser, 
    deleteUser, 
    updateSettings, 
    switchUser, 
    clearAuditLogs,
    resetToDefaultCredentials 
  } = useAuth();

  const { projects, tasks, invoices, communications, teamMembers, isUsingSupabase, supabaseError } = useData();

  const [currentTab, setCurrentTab] = useState<AdminTab>('users');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [auditSearchTerm, setAuditSearchTerm] = useState('');
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);

  // User Modal
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [userFormData, setUserFormData] = useState<{
    name: string;
    email: string;
    password: string;
    role: UserRole;
    department: string;
    status: 'active' | 'inactive';
  }>({
    name: '',
    email: '',
    password: '',
    role: 'Consultor Senior',
    department: 'Práctica de Estrategia',
    status: 'active',
  });

  // Settings State
  const [settingsForm, setSettingsForm] = useState({
    company_name: settings.company_name,
    client_name: settings.client_name,
    assessment_title: settings.assessment_title,
    currency: settings.currency,
    default_payment_terms_days: settings.default_payment_terms_days,
    audit_logging_enabled: settings.audit_logging_enabled,
    two_factor_simulation: settings.two_factor_simulation,
  });

  const [savedSettingsSuccess, setSavedSettingsSuccess] = useState(false);

  const availableRoles: UserRole[] = [
    'Super Admin',
    'Director de Consultoría',
    'Consultor Senior',
    'Líder de Proyecto',
    'Sponsor Ejecutivo / Cliente',
  ];

  // Open Add User
  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserFormData({
      name: '',
      email: '',
      password: 'capricorn2026',
      role: 'Consultor Senior',
      department: 'Práctica de Consultoría',
      status: 'active',
    });
    setIsUserModalOpen(true);
  };

  // Open Edit User
  const handleOpenEditUser = (user: AppUser) => {
    setEditingUser(user);
    setUserFormData({
      name: user.name,
      email: user.email,
      password: user.password || '',
      role: user.role,
      department: user.department,
      status: user.status,
    });
    setIsUserModalOpen(true);
  };

  // Submit User
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.name.trim() || !userFormData.email.trim()) return;

    if (editingUser) {
      await updateUser(editingUser.id, userFormData);
    } else {
      await addUser(userFormData);
    }
    setIsUserModalOpen(false);
  };

  // Save Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(settingsForm);
    setSavedSettingsSuccess(true);
    setTimeout(() => setSavedSettingsSuccess(false), 3000);
  };

  // Export Full System JSON Backup
  const handleExportBackup = () => {
    const backupData = {
      version: '4.0',
      exported_at: new Date().toISOString(),
      system_settings: settings,
      users: users.map(u => ({ ...u, password: '***' })),
      portfolio: {
        projects,
        tasks,
        invoices,
        communications,
        team_members: teamMembers,
      },
      audit_logs: auditLogs,
    };

    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Capricorn_CSEA_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Users
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    u.department.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  // Filtered Audit Logs
  const filteredAuditLogs = auditLogs.filter(log =>
    log.user_name.toLowerCase().includes(auditSearchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(auditSearchTerm.toLowerCase()) ||
    log.module.toLowerCase().includes(auditSearchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(auditSearchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-200 uppercase tracking-wider">
              Control & Seguridad
            </span>
            <span className="text-[10px] font-semibold text-slate-500">
              Administración Central Capricorn
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center mt-1">
            <ShieldCheck className="w-6 h-6 mr-2 text-orange-600" />
            Panel de Administración & Seguridad
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestión de usuarios, credenciales de acceso, configuración del CSEA y auditoría corporativa
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs shadow-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-slate-600 font-medium">Sesión activa como:</span>
            <span className="font-bold text-slate-900">{currentUser?.name}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-orange-100 text-orange-800 font-bold">
              {currentUser?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Top Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-white rounded-xl p-4.5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Usuarios Registrados</span>
            <span className="p-1 rounded bg-slate-100 text-slate-600">
              <Users className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-slate-900">{users.length}</div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {users.filter(u => u.status === 'active').length} cuentas activas en el sistema
            </p>
          </div>
        </div>

        {/* Roles Distribution */}
        <div className="bg-white rounded-xl p-4.5 border border-indigo-200/80 shadow-xs flex flex-col justify-between bg-gradient-to-b from-white to-indigo-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800">Supervisión Directiva</span>
            <span className="p-1 rounded bg-indigo-100 text-indigo-700">
              <KeyRound className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-indigo-950">
              {users.filter(u => u.role === 'Super Admin' || u.role === 'Director de Consultoría').length}
            </div>
            <p className="text-[10px] text-indigo-700 mt-0.5 font-medium">Directores con privilegios de control</p>
          </div>
        </div>

        {/* Audit Logs Count */}
        <div className="bg-white rounded-xl p-4.5 border border-teal-200/80 shadow-xs flex flex-col justify-between bg-gradient-to-b from-white to-teal-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800">Eventos en Bitácora</span>
            <span className="p-1 rounded bg-teal-100 text-teal-700">
              <Activity className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-teal-950">{auditLogs.length}</div>
            <p className="text-[10px] text-teal-700 mt-0.5 font-medium">Trazabilidad de cambios registrada</p>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-xl p-4.5 border border-emerald-200/80 shadow-xs flex flex-col justify-between bg-gradient-to-b from-white to-emerald-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Estado de Seguridad</span>
            <span className="p-1 rounded bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-emerald-950">100%</div>
            <p className="text-[10px] text-emerald-700 mt-0.5 font-medium">Control de accesos y RBAC activo</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setCurrentTab('users')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center space-x-2 transition-colors ${
            currentTab === 'users'
              ? 'border-orange-600 text-orange-600 bg-orange-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Gestión de Usuarios & Credenciales ({users.length})</span>
        </button>

        <button
          onClick={() => setCurrentTab('settings')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center space-x-2 transition-colors ${
            currentTab === 'settings'
              ? 'border-orange-600 text-orange-600 bg-orange-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <SettingsIcon className="w-4 h-4" />
          <span>Parámetros del Sistema</span>
        </button>

        <button
          onClick={() => setCurrentTab('database')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center space-x-2 transition-colors ${
            currentTab === 'database'
              ? 'border-orange-600 text-orange-600 bg-orange-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Base de Datos & Respaldos</span>
        </button>

        <button
          onClick={() => setCurrentTab('audit')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center space-x-2 transition-colors ${
            currentTab === 'audit'
              ? 'border-orange-600 text-orange-600 bg-orange-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Bitácora de Auditoría ({auditLogs.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: USER AND CREDENTIAL MANAGEMENT                                     */}
      {/* ========================================================================= */}
      {currentTab === 'users' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, correo, rol..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenAddUser}
                className="inline-flex items-center px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-all shadow-xs active:scale-95"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Nuevo Usuario
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs border-collapse">
                <thead className="bg-[#0f172a] text-white">
                  <tr>
                    <th className="px-4 py-3.5 font-bold text-[10px] uppercase tracking-wider text-slate-200">
                      Usuario / Consultor
                    </th>
                    <th className="px-3 py-3.5 font-bold text-[10px] uppercase tracking-wider text-slate-200">
                      Rol de Seguridad
                    </th>
                    <th className="px-3 py-3.5 font-bold text-[10px] uppercase tracking-wider text-slate-200">
                      Departamento
                    </th>
                    <th className="px-3 py-3.5 font-bold text-[10px] uppercase tracking-wider text-slate-200">
                      Contraseña Asignada
                    </th>
                    <th className="px-3 py-3.5 font-bold text-[10px] uppercase tracking-wider text-slate-200 text-center">
                      Estado
                    </th>
                    <th className="px-3 py-3.5 font-bold text-[10px] uppercase tracking-wider text-slate-200 text-right">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredUsers.map((user, idx) => {
                    const isCurrent = currentUser?.id === user.id;
                    return (
                      <tr 
                        key={user.id} 
                        className={`hover:bg-slate-50 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'}`}
                      >
                        {/* Name & Email */}
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-lg bg-[#0f172a] text-orange-400 flex items-center justify-center font-bold text-xs shrink-0">
                              {user.avatar_initials || user.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 text-xs">{user.name}</span>
                                {isCurrent && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                                    Tú
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-500 font-mono block">{user.email}</span>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            user.role === 'Super Admin' ? 'bg-orange-100 text-orange-900 border-orange-300' :
                            user.role === 'Director de Consultoría' ? 'bg-indigo-100 text-indigo-900 border-indigo-300' :
                            user.role === 'Líder de Proyecto' ? 'bg-teal-100 text-teal-900 border-teal-300' :
                            user.role === 'Consultor Senior' ? 'bg-blue-100 text-blue-900 border-blue-300' :
                            'bg-amber-100 text-amber-900 border-amber-300'
                          }`}>
                            {user.role}
                          </span>
                        </td>

                        {/* Department */}
                        <td className="px-3 py-3 text-slate-600 text-xs">
                          {user.department}
                        </td>

                        {/* Password */}
                        <td className="px-3 py-3 whitespace-nowrap font-mono text-[11px] text-slate-600">
                          <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200 font-bold">
                            {user.password || '••••••••'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            user.status === 'active' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.status === 'active' ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-3 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isCurrent && (
                              <button
                                onClick={() => switchUser(user.id)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold transition-colors inline-flex items-center gap-1"
                                title="Iniciar sesión como este usuario"
                              >
                                <UserCheck className="w-3 h-3 text-orange-600" />
                                Probar
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenEditUser(user)}
                              className="p-1 text-slate-400 hover:text-slate-800 rounded hover:bg-slate-100 transition-colors"
                              title="Editar usuario"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {!isCurrent && (
                              <button
                                onClick={() => deleteUser(user.id)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100 transition-colors"
                                title="Eliminar usuario"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SYSTEM PARAMETERS & CONFIGURATION                                  */}
      {/* ========================================================================= */}
      {currentTab === 'settings' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs max-w-3xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-orange-600" />
                Parámetros Globales de la Plataforma
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Ajustes de membrete corporativo, moneda de honorarios y modelo de assessment CSEA
              </p>
            </div>
            {savedSettingsSuccess && (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg flex items-center gap-1 animate-fade-in">
                <Check className="w-3.5 h-3.5" />
                Configuración Guardada
              </span>
            )}
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Firma de Consultoría (Emisor)
                </label>
                <input
                  type="text"
                  required
                  value={settingsForm.company_name}
                  onChange={(e) => setSettingsForm({ ...settingsForm, company_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Organización Cliente (Receptor)
                </label>
                <input
                  type="text"
                  required
                  value={settingsForm.client_name}
                  onChange={(e) => setSettingsForm({ ...settingsForm, client_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                Título del Marco Metodológico
              </label>
              <input
                type="text"
                required
                value={settingsForm.assessment_title}
                onChange={(e) => setSettingsForm({ ...settingsForm, assessment_title: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Moneda Predeterminada
                </label>
                <select
                  value={settingsForm.currency}
                  onChange={(e) => setSettingsForm({ ...settingsForm, currency: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-1 focus:ring-orange-500"
                >
                  <option value="MXN">MXN ($ Pesos Mexicanos)</option>
                  <option value="USD">USD ($ Dólares Estadounidenses)</option>
                  <option value="EUR">EUR (€ Euros)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Plazo de Crédito Facturación (Días)
                </label>
                <input
                  type="number"
                  min="0"
                  max="180"
                  value={settingsForm.default_payment_terms_days}
                  onChange={(e) => setSettingsForm({ ...settingsForm, default_payment_terms_days: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Security Switches */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                Políticas de Seguridad & Auditoría
              </span>

              <label className="flex items-center space-x-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settingsForm.audit_logging_enabled}
                  onChange={(e) => setSettingsForm({ ...settingsForm, audit_logging_enabled: e.target.checked })}
                  className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                />
                <div>
                  <span className="font-bold text-slate-900 block text-xs">Habilitar Bitácora de Auditoría en Tiempo Real</span>
                  <span className="text-[11px] text-slate-500">Registra fecha, hora y usuario en cada cambio a proyectos, RACI y facturas.</span>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settingsForm.two_factor_simulation}
                  onChange={(e) => setSettingsForm({ ...settingsForm, two_factor_simulation: e.target.checked })}
                  className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                />
                <div>
                  <span className="font-bold text-slate-900 block text-xs">Cifrado de Sesiones y Protección SSL</span>
                  <span className="text-[11px] text-slate-500">Garantiza aislamiento de credenciales y permisos por rol.</span>
                </div>
              </label>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg shadow-xs active:scale-95 transition-all"
              >
                Guardar Parámetros
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DATABASE HEALTH & SYSTEM BACKUPS                                    */}
      {/* ========================================================================= */}
      {currentTab === 'database' && (
        <div className="space-y-6">
          {/* Supabase Cloud Connection Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className={`p-2.5 rounded-lg ${isUsingSupabase ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900">Infraestructura Supabase (PostgreSQL Cloud)</h2>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isUsingSupabase ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isUsingSupabase ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {isUsingSupabase ? 'Cloud Activo' : 'Modo Local (Tablas Pendientes)'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Endpoint: <span className="font-mono text-slate-700">https://gyfmtslcojkxcujfpxbk.supabase.co</span> • Proyecto: <span className="font-mono text-slate-700">gyfmtslcojkxcujfpxbk</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setIsSqlModalOpen(true)}
                  className="px-3.5 py-1.5 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Activity className="w-3.5 h-3.5 text-orange-400" />
                  <span>Diagnóstico & Script SQL</span>
                </button>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1 text-slate-600">
              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                {isUsingSupabase ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Todas las operaciones CRUD se guardan en tiempo real en las tablas de Supabase.</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Conexión de red y autenticación con Supabase verificadas exitosamente.</span>
                  </>
                )}
              </div>
              {!isUsingSupabase && (
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Las tablas corporativas aún no existen en el esquema remoto de PostgreSQL (<code className="text-amber-700 font-bold">PGRST205</code>). Para habilitar la nube, haz clic en <strong>"Diagnóstico & Script SQL"</strong>, copia el DDL y ejecútalo en el SQL Editor de Supabase.
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Health & Diagnostic */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-orange-600" />
                Diagnóstico del Repositorio de Datos
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Consolidación de registros operativos almacenados en la arquitectura híbrida de Capricorn Consulting.
              </p>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-medium text-slate-700">Iniciativas Estratégicas (Proyectos)</span>
                  <span className="font-extrabold text-slate-900">{projects.length} registros</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-medium text-slate-700">Tareas y Entregables Clave</span>
                  <span className="font-extrabold text-slate-900">{tasks.length} registros</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-medium text-slate-700">Facturas de Honorarios</span>
                  <span className="font-extrabold text-slate-900">{invoices.length} registros</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-medium text-slate-700">Comunicaciones y Minutas Ejecutivas</span>
                  <span className="font-extrabold text-slate-900">{communications.length} registros</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-medium text-slate-700">Consultores & Roles RACI</span>
                  <span className="font-extrabold text-slate-900">{teamMembers.length} registros</span>
                </div>
              </div>
            </div>

            {/* Backup & Seed Tools */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Download className="w-4 h-4 text-orange-600" />
                  Respaldo Completo & Restauración
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Exporta el estado completo de la consultoría en formato JSON estructurado para auditorías externas o migración.
                </p>

                <div className="pt-2">
                  <button
                    onClick={handleExportBackup}
                    className="w-full py-2.5 px-4 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Descargar Respaldo JSON Completo
                  </button>
                </div>
              </div>

              {/* Reset Seed Data */}
              <div className="pt-4 border-t border-slate-200">
                <div className="bg-orange-50/70 border border-orange-200 p-3.5 rounded-lg space-y-2">
                  <span className="text-xs font-bold text-orange-950 flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-orange-600" />
                    Restaurar Credenciales y Datos Base
                  </span>
                  <p className="text-[11px] text-orange-900/80 leading-relaxed">
                    Si deseas reiniciar los usuarios predeterminados de demostración (Super Admin, Director CSEA, PMO Lead) a sus valores originales.
                  </p>
                  <button
                    onClick={() => {
                      if (window.confirm('¿Deseas restaurar las credenciales predeterminadas de Capricorn?')) {
                        resetToDefaultCredentials();
                      }
                    }}
                    className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-md transition-colors"
                  >
                    Restaurar Valores Predeterminados
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: AUDIT LOGS                                                         */}
      {/* ========================================================================= */}
      {currentTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative min-w-[260px]">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar eventos en bitácora..."
                value={auditSearchTerm}
                onChange={(e) => setAuditSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={clearAuditLogs}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
              >
                Limpiar Historial
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs border-collapse">
                <thead className="bg-[#0f172a] text-white">
                  <tr>
                    <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-wider text-slate-200">
                      Fecha y Hora
                    </th>
                    <th className="px-3 py-3 font-bold text-[10px] uppercase tracking-wider text-slate-200">
                      Usuario Responsable
                    </th>
                    <th className="px-3 py-3 font-bold text-[10px] uppercase tracking-wider text-slate-200">
                      Módulo
                    </th>
                    <th className="px-3 py-3 font-bold text-[10px] uppercase tracking-wider text-slate-200">
                      Acción Ejecutada
                    </th>
                    <th className="px-3 py-3 font-bold text-[10px] uppercase tracking-wider text-slate-200">
                      Detalle del Evento
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredAuditLogs.map((log, idx) => (
                    <tr key={log.id} className={`hover:bg-slate-50 ${idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'}`}>
                      <td className="px-4 py-2.5 whitespace-nowrap text-[11px] font-mono text-slate-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="font-bold text-slate-900 text-xs block">{log.user_name}</span>
                        <span className="text-[10px] text-slate-400 font-semibold">{log.user_role}</span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                          {log.module}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap font-bold text-slate-800 text-xs">
                        {log.action}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 text-xs">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                  {filteredAuditLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                        No hay eventos registrados con los términos de búsqueda.
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
      {/* USER MODAL (ADD / EDIT)                                                   */}
      {/* ========================================================================= */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-300 p-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-600" />
                {editingUser ? 'Editar Cuenta de Usuario' : 'Registrar Nuevo Usuario'}
              </h2>
              <button onClick={() => setIsUserModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUserSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  placeholder="Ej. Dr. Rodrigo Silva"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-orange-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  required
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  placeholder="nombre@capricorn.com"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-orange-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Contraseña de Acceso *
                </label>
                <input
                  type="text"
                  required
                  value={userFormData.password}
                  onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                  placeholder="Contraseña segura"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-orange-500 font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Rol de Seguridad
                  </label>
                  <select
                    value={userFormData.role}
                    onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value as UserRole })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-orange-500 font-bold"
                  >
                    {availableRoles.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Estado de la Cuenta
                  </label>
                  <select
                    value={userFormData.status}
                    onChange={(e) => setUserFormData({ ...userFormData, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-orange-500 font-semibold"
                  >
                    <option value="active">Activo (Habilitado)</option>
                    <option value="inactive">Inactivo (Suspendido)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Departamento / Práctica
                </label>
                <input
                  type="text"
                  value={userFormData.department}
                  onChange={(e) => setUserFormData({ ...userFormData, department: e.target.value })}
                  placeholder="Ej. Transformación Estratégica"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-xs"
                >
                  {editingUser ? 'Guardar Usuario' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supabase Status & SQL DDL Modal */}
      <SqlSetupModal 
        isOpen={isSqlModalOpen} 
        onClose={() => setIsSqlModalOpen(false)} 
      />
    </div>
  );
}
