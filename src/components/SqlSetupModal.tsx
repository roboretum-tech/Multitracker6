import React, { useState, useRef } from 'react';
import { 
  Check, 
  X, 
  Database, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Cloud, 
  Server, 
  UploadCloud,
  Layers,
  ArrowRight,
  Download,
  Upload,
  HardDrive,
  FileJson,
  ShieldCheck,
  Lock,
  UserCheck
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import firebaseConfig from '../../firebase-applet-config.json';
import { exportToJSON } from '../utils/exportUtils';

interface SqlSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SqlSetupModal({ isOpen, onClose }: SqlSetupModalProps) {
  const { currentUser } = useAuth();
  const { 
    projects, 
    tasks, 
    meetings, 
    communications, 
    invoices, 
    teamMembers, 
    decisions,
    agreements,
    risks,
    refreshData, 
    restoreBackup 
  } = useData();

  const [activeTab, setActiveTab] = useState<'firebase' | 'backup'>('firebase');
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<{ success: boolean; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshData();
    } finally {
      setRefreshing(false);
    }
  };

  const handleExportBackup = () => {
    exportToJSON(`Backup_Tenant_${currentUser?.id || 'data'}`, {
      tenantId: currentUser?.id,
      userEmail: currentUser?.email,
      exportedAt: new Date().toISOString(),
      projects,
      tasks,
      teamMembers,
      meetings,
      communications,
      invoices,
      decisions,
      agreements,
      risks,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoring(true);
    setRestoreMessage(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const result = await restoreBackup(json);
        setRestoreMessage({
          success: result.success,
          text: result.message
        });
      } catch (err) {
        setRestoreMessage({
          success: false,
          text: 'El archivo seleccionado no es un JSON válido o tiene un formato incorrecto.'
        });
      } finally {
        setRestoring(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const collections = [
    { name: 'Proyectos', count: projects.length, path: 'projects' },
    { name: 'Entregables / Tareas', count: tasks.length, path: 'tasks' },
    { name: 'Comités & Sesiones', count: meetings.length, path: 'meetings' },
    { name: 'Comunicaciones', count: communications.length, path: 'communications' },
    { name: 'Facturación', count: invoices.length, path: 'invoices' },
    { name: 'Equipo & RACI', count: teamMembers.length, path: 'teamMembers' },
    { name: 'Decisiones', count: decisions.length, path: 'decisions' },
    { name: 'Acuerdos', count: agreements.length, path: 'agreements' },
    { name: 'Riesgos (RAID)', count: risks.length, path: 'risks' },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                Persistencia en la Nube: Firebase Firestore
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold px-2 py-0.5 rounded-full">
                  Multi-Tenant Activo
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Base de datos en tiempo real con aislamiento criptográfico por usuario
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 px-6 pt-2 bg-slate-50/50 shrink-0">
          <button
            onClick={() => setActiveTab('firebase')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'firebase'
                ? 'border-emerald-600 text-emerald-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Estado de Firebase Firestore</span>
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'backup'
                ? 'border-emerald-600 text-emerald-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Copias de Seguridad & Respaldo JSON</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-700">
          {activeTab === 'firebase' && (
            <div className="space-y-5">
              {/* Resumen de Migración y Estado Activo */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                      Base de Datos Actual: Google Cloud Firestore
                    </h3>
                    <p className="text-xs text-emerald-800 mt-1">
                      Todos los datos están siendo almacenados y leídos directamente desde <strong>Google Firebase Firestore</strong>. La configuración anterior de Supabase ha sido completamente reemplazada para garantizar autenticación unificada y aislamiento multi-tenant por usuario.
                    </p>
                  </div>
                </div>
              </div>

              {/* Parámetros de la Base de Datos */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Configuración de Conexión en Vivo
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Database ID</span>
                    <span className="font-mono font-medium text-slate-800 break-all select-all">
                      {firebaseConfig.firestoreDatabaseId || 'default'}
                    </span>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Proyecto Firebase</span>
                    <span className="font-mono font-medium text-slate-800 break-all select-all">
                      {firebaseConfig.projectId}
                    </span>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 sm:col-span-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Tenant / Propietario Autenticado</span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="font-mono font-bold text-slate-900">{currentUser?.email}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                        UID: {currentUser?.id?.slice(0, 12)}...
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Estado de Colecciones por Tenant */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Documentos Activos en tu Espacio de Trabajo
                  </h4>
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                    <span>Sincronizar ahora</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
                  {collections.map(c => (
                    <div key={c.name} className="p-2.5 bg-white border border-slate-200 rounded-lg flex flex-col justify-between">
                      <span className="text-[11px] text-slate-500 font-medium truncate">{c.name}</span>
                      <span className="text-lg font-bold text-slate-900 font-mono mt-1">{c.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Garantía de Aislamiento */}
              <div className="p-3 bg-slate-100/70 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Aislamiento Garantizado:</strong> Las reglas de seguridad de Firestore (<code>firestore.rules</code>) validan que cada consulta y mutación incluya <code>tenantId == request.auth.uid</code>. Ningún usuario puede acceder ni modificar los proyectos de otros usuarios.
                </span>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-5">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Respaldo Manual y Portabilidad
                </h4>
                <p className="text-xs text-slate-500">
                  Puedes descargar un archivo JSON completo con todos los proyectos, tareas, actas y minutas de tu cuenta, o restaurar un respaldo previo en cualquier momento.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Exportar */}
                <div className="p-4 border border-slate-200 rounded-xl bg-white flex flex-col justify-between">
                  <div>
                    <div className="p-2.5 bg-blue-50 text-blue-700 w-fit rounded-lg mb-3">
                      <Download className="w-5 h-5" />
                    </div>
                    <h5 className="font-bold text-slate-900 text-xs">Descargar Respaldo JSON</h5>
                    <p className="text-xs text-slate-500 mt-1">
                      Genera un archivo JSON con todos los datos actuales de tu tenant.
                    </p>
                  </div>
                  <button
                    onClick={handleExportBackup}
                    className="mt-4 w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <FileJson className="w-4 h-4" />
                    <span>Descargar Backup</span>
                  </button>
                </div>

                {/* Importar */}
                <div className="p-4 border border-slate-200 rounded-xl bg-white flex flex-col justify-between">
                  <div>
                    <div className="p-2.5 bg-amber-50 text-amber-700 w-fit rounded-lg mb-3">
                      <Upload className="w-5 h-5" />
                    </div>
                    <h5 className="font-bold text-slate-900 text-xs">Restaurar desde JSON</h5>
                    <p className="text-xs text-slate-500 mt-1">
                      Carga un archivo de respaldo previo para sincronizarlo con tu cuenta de Firestore.
                    </p>
                  </div>

                  <div>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".json" 
                      className="hidden" 
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={restoring}
                      className="mt-4 w-full py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>{restoring ? 'Procesando...' : 'Cargar Archivo JSON'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {restoreMessage && (
                <div className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                  restoreMessage.success 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {restoreMessage.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span>{restoreMessage.text}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            Capricorn Strategic Execution Assessment® • CSEA v4.0
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
