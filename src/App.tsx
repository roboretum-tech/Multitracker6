/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Briefcase, 
  CheckSquare, 
  Users, 
  MessageSquare,
  Calendar,
  CreditCard,
  FilePlus2,
  Menu,
  X,
  Plus,
  Search,
  SlidersHorizontal,
  Bell,
  ShieldCheck,
  LogOut,
  ChevronDown,
  User,
  Settings,
  Sparkles,
  KeyRound,
  GitFork,
  FolderKanban,
  BarChart3,
  BookOpen,
  HelpCircle
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import CapricornLogo from './components/CapricornLogo';
import LoginView from './components/LoginView';
import Dashboard from './components/Dashboard';
import ProjectDatabase from './components/ProjectDatabase';
import TaskList from './components/TaskList';
import CalendarView from './components/CalendarView';
import TeamView from './components/TeamView';
import CommunicationsView from './components/CommunicationsView';
import InvoicesView from './components/InvoicesView';
import DataEntryHub from './components/DataEntryHub';
import AdminPanel from './components/AdminPanel';
import QuickSearchModal from './components/QuickSearchModal';
import ProjectGanttView from './components/ProjectGanttView';
import BaselineComparisonView from './components/BaselineComparisonView';
import RAIDView from './components/RAIDView';
import SqlSetupModal from './components/SqlSetupModal';
import { ProjectAnalyticsView } from './components/ProjectAnalyticsView';
import { OnboardingHelpTour } from './components/help/OnboardingHelpTour';
import { HelpReferenceDocView } from './components/help/HelpReferenceDocView';
import { useData } from './context/DataContext';
import { Task } from './types';
import { Database, AlertCircle, Cloud, Network } from 'lucide-react';
import { NotificationDropdown } from './components/notifications/NotificationDropdown';
import { ToastContainer } from './components/notifications/ToastContainer';

export default function App() {
  const { currentUser, logout, users, switchUser } = useAuth();
  const { isUsingSupabase, tasks, projects } = useData();
  const [currentView, setCurrentView] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isPersistenceModalOpen, setIsPersistenceModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [defaultProjectIdForTask, setDefaultProjectIdForTask] = useState<string | undefined>(undefined);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global keyboard shortcut Ctrl/Cmd + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // If not authenticated, display LoginView
  if (!currentUser) {
    return <LoginView onLoginSuccess={() => setCurrentView('dashboard')} />;
  }

  const navigation = [
    { name: 'Dashboard Ejecutivo', id: 'dashboard', icon: LayoutDashboard },
    { name: 'Captura de Datos', id: 'data-entry', icon: FilePlus2, highlight: true },
    { name: 'Base de Proyectos', id: 'projects', icon: Briefcase },
    { name: 'Analíticas & Burndown', id: 'analytics', icon: BarChart3 },
    { name: 'Tablero Kanban', id: 'kanban', icon: FolderKanban },
    { name: 'Cronograma & Gantt', id: 'gantt', icon: Calendar },
    { name: 'Línea Base & Ruta Crítica', id: 'baseline', icon: GitFork },
    { name: 'Matriz RAID & Red Causal', id: 'raid', icon: Network },
    { name: 'Tareas y Entregables', id: 'tasks', icon: CheckSquare },
    { name: 'Calendario & Sesiones', id: 'calendar', icon: Calendar },
    { name: 'Equipo & Matriz RACI', id: 'team', icon: Users },
    { name: 'Comunicaciones & Minutas', id: 'comms', icon: MessageSquare },
    { name: 'Facturación & Cobranza', id: 'invoices', icon: CreditCard },
    { name: 'Guía & Manual CSEA', id: 'manual-csea', icon: BookOpen },
    { name: 'Panel de Administración', id: 'admin', icon: ShieldCheck, adminOnly: true },
  ];

  const handleNavigate = (viewId: string) => {
    setCurrentView(viewId);
    setMobileMenuOpen(false);
  };

  const handleNotificationNavigate = (viewId: string, entityId?: string) => {
    if (viewId === 'tasks' && entityId) {
      const foundTask = tasks.find(t => t.id === entityId);
      if (foundTask) {
        setTaskToEdit(foundTask);
      }
    }
    handleNavigate(viewId);
  };

  const handleOpenTaskInTasks = (task?: Task, defaultProjectId?: string) => {
    if (task) {
      setTaskToEdit(task);
      setDefaultProjectIdForTask(undefined);
    } else {
      setTaskToEdit(null);
      setDefaultProjectIdForTask(defaultProjectId);
    }
    setCurrentView('tasks');
    setMobileMenuOpen(false);
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'data-entry':
        return <DataEntryHub />;
      case 'projects':
        return <ProjectDatabase onOpenTaskModal={handleOpenTaskInTasks} />;
      case 'analytics':
        return (
          <ProjectAnalyticsView 
            projects={projects}
            tasks={tasks}
            onNavigateToTasks={() => setCurrentView('tasks')}
            onNavigateToGantt={() => setCurrentView('gantt')}
          />
        );
      case 'kanban':
        return (
          <TaskList 
            initialView="kanban" 
            initialEditingTask={taskToEdit}
            defaultProjectId={defaultProjectIdForTask}
            onClearInitialEditingTask={() => {
              setTaskToEdit(null);
              setDefaultProjectIdForTask(undefined);
            }}
          />
        );
      case 'tasks':
        return (
          <TaskList 
            initialView="tasks" 
            initialEditingTask={taskToEdit}
            defaultProjectId={defaultProjectIdForTask}
            onClearInitialEditingTask={() => {
              setTaskToEdit(null);
              setDefaultProjectIdForTask(undefined);
            }}
          />
        );
      case 'gantt':
        return (
          <ProjectGanttView 
            onNavigateToBaseline={() => setCurrentView('baseline')} 
            onOpenTaskModal={handleOpenTaskInTasks}
          />
        );
      case 'baseline':
        return (
          <BaselineComparisonView 
            onNavigateToGantt={() => setCurrentView('gantt')} 
            onOpenTaskModal={handleOpenTaskInTasks}
          />
        );
      case 'raid':
        return <RAIDView />;
      case 'calendar':
        return <CalendarView />;
      case 'team':
        return <TeamView />;
      case 'comms':
        return <CommunicationsView />;
      case 'invoices':
        return <InvoicesView />;
      case 'manual-csea':
        return (
          <HelpReferenceDocView
            onStartTour={() => window.dispatchEvent(new CustomEvent('csea_open_tour'))}
            onNavigateToView={handleNavigate}
          />
        );
      case 'admin':
        return <AdminPanel />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      {/* Desktop Sidebar Navigation - Deep Navy Corporate Theme */}
      <aside className="w-64 bg-[#0f172a] text-slate-200 flex flex-col hidden md:flex shrink-0 border-r border-slate-800">
        {/* Brand Header with Official Capricorn Logo */}
        <div className="h-16 flex items-center px-4 border-b border-slate-800/80 bg-[#0b1120]">
          <CapricornLogo size="md" variant="horizontal" theme="dark" />
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 py-1 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Módulos de Gestión</span>
          </div>
          {navigation.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-slate-800 text-white border-l-3 border-orange-500 shadow-xs'
                    : item.highlight
                    ? 'text-orange-400 bg-orange-950/30 hover:bg-orange-950/50 hover:text-orange-300 border border-orange-800/40 font-bold'
                    : item.adminOnly
                    ? 'text-indigo-300 hover:bg-slate-800/60 hover:text-white'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center">
                  <item.icon className={`w-4 h-4 mr-3 ${
                    isActive ? 'text-orange-500' : 
                    item.highlight ? 'text-orange-400' : 
                    item.adminOnly ? 'text-indigo-400' :
                    'text-slate-400'
                  }`} />
                  <span>{item.name}</span>
                </div>
                {item.highlight && (
                  <span className="text-[9px] uppercase tracking-wider bg-orange-600 text-white px-1.5 py-0.5 rounded font-bold">
                    Ingreso
                  </span>
                )}
                {item.adminOnly && (
                  <span className="text-[9px] uppercase tracking-wider bg-indigo-900/80 text-indigo-200 border border-indigo-700/60 px-1.5 py-0.5 rounded font-bold">
                    Admin
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Mini Profile & Status Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-[#0b1120] text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-orange-600/90 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                {currentUser.avatar_initials || currentUser.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-white truncate">{currentUser.name}</p>
                <p className="text-[9px] text-slate-400 truncate">{currentUser.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Cerrar Sesión"
              className="p-1.5 text-slate-400 hover:text-red-400 rounded hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between shrink-0 shadow-xs z-30">
          {/* Left: Mobile Toggle & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 md:hidden"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="hidden sm:flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Capricorn Management /</span>
              <span className="text-xs font-bold text-slate-900">
                {navigation.find(n => n.id === currentView)?.name || 'Dashboard Ejecutivo'}
              </span>
            </div>
          </div>

          {/* Right: Quick Search & User Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-lg text-xs font-medium transition-colors border border-slate-200"
            >
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Buscar iniciativas, tareas, actas...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px] text-slate-600">
                Ctrl+K
              </kbd>
            </button>

            {/* Cloud Persistence Indicator & Tenant Info */}
            <button
              onClick={() => setIsPersistenceModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200 shadow-2xs"
              title="Aislamiento Multi-Tenant Firestore Activo"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">
                Nube Firebase Multi-Tenant
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </button>

            {/* Quick Access to CSEA Manual */}
            <button
              onClick={() => handleNavigate('manual-csea')}
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-200 shadow-2xs"
              title="Consultar Manual de Referencia CSEA v4.0"
            >
              <BookOpen className="w-3.5 h-3.5 text-orange-600" />
              <span>Guía CSEA v4.0</span>
            </button>

            <button
              onClick={() => handleNavigate('data-entry')}
              className="inline-flex items-center px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-all shadow-xs active:scale-95 shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              <span className="hidden sm:inline">Capturar Datos</span>
              <span className="sm:hidden">Capturar</span>
            </button>

            {/* In-App Notification Center */}
            <NotificationDropdown onNavigateToView={handleNotificationNavigate} />

            {/* User Account Dropdown Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-[#0f172a] text-orange-400 font-bold text-xs flex items-center justify-center">
                  {currentUser.avatar_initials || currentUser.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-[11px] font-bold text-slate-900 leading-tight">
                    {currentUser.name}
                  </span>
                  <span className="text-[9px] font-medium text-orange-700 leading-tight">
                    {currentUser.role}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-fade-in">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                    <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{currentUser.email}</p>
                    <div className="mt-1.5">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-900 border border-orange-200">
                        {currentUser.role}
                      </span>
                    </div>
                  </div>

                  {/* Switch Profile Quick Selector */}
                  <div className="p-2 border-b border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1">
                      Cambiar de Perfil (Demo)
                    </span>
                    <div className="space-y-1">
                      {users.filter(u => u.id !== currentUser.id).slice(0, 3).map(u => (
                        <button
                          key={u.id}
                          onClick={() => {
                            switchUser(u.id);
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full px-2 py-1.5 text-left rounded-lg hover:bg-slate-100 flex items-center justify-between text-xs transition-colors"
                        >
                          <span className="text-slate-800 font-medium truncate">{u.name}</span>
                          <span className="text-[9px] text-slate-400 font-semibold">{u.role.split(' ')[0]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Menu Options */}
                  <div className="p-1 space-y-0.5">
                    <button
                      onClick={() => {
                        handleNavigate('admin');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4 text-orange-600" />
                      <span>Panel de Administración</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0f172a] text-slate-200 border-b border-slate-800 px-4 py-3 space-y-1 shadow-lg z-40">
            {navigation.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`flex items-center w-full px-3.5 py-2.5 rounded-lg text-xs font-semibold ${
                  currentView === item.id ? 'bg-slate-800 text-white border-l-2 border-orange-500' : 'text-slate-400'
                }`}
              >
                <item.icon className="w-4 h-4 mr-3 text-orange-500" />
                {item.name}
              </button>
            ))}
            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={logout}
                className="flex items-center w-full px-3.5 py-2 text-xs font-semibold text-red-400 hover:bg-slate-800 rounded-lg"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        )}

        {/* Dynamic View Content */}
        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 bg-[#f8fafc]">
          {renderView()}
        </div>
      </main>

      {/* Global Quick Search Modal */}
      <QuickSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleNavigate}
      />

      {/* Cloud Persistence & Backup Modal */}
      <SqlSetupModal
        isOpen={isPersistenceModalOpen}
        onClose={() => setIsPersistenceModalOpen(false)}
      />

      {/* In-App Floating Toast Notifications */}
      <ToastContainer onNavigateToView={handleNotificationNavigate} />

      {/* Interactive Onboarding Help Tour and Floating Trigger */}
      <OnboardingHelpTour
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenReferenceManual={() => handleNavigate('manual-csea')}
      />
    </div>
  );
}
