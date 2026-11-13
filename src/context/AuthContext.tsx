import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { AppUser, UserRole, AuditLog, SystemSettings } from '../types';
import { sanitizeText, isValidEmail } from '../utils/security';
import { globalRateLimiter, RATE_LIMIT_CONFIGS } from '../utils/rateLimiter';

interface AuthContextType {
  currentUser: AppUser | null;
  users: AppUser[];
  auditLogs: AuditLog[];
  settings: SystemSettings;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  
  // Auth actions
  login: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  register: (email: string, password: string, name?: string) => Promise<{ success: boolean; message?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  switchUser: (userId: string) => void;
  
  // User CRUD
  addUser: (user: Omit<AppUser, 'id' | 'created_at'>) => Promise<void>;
  updateUser: (id: string, updates: Partial<AppUser>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  
  // Settings & System
  updateSettings: (updates: Partial<SystemSettings>) => void;
  addAuditLog: (action: string, module: string, details: string) => void;
  clearAuditLogs: () => void;
  resetToDefaultCredentials: () => void;
}

const STORAGE_KEY_AUTH_USER = 'capricorn_auth_current_user_v2';
const STORAGE_KEY_USERS = 'capricorn_users_directory_v2';
const STORAGE_KEY_LOGS = 'capricorn_audit_logs_v2';
const STORAGE_KEY_SETTINGS = 'capricorn_system_settings_v2';

const DEFAULT_SETTINGS: SystemSettings = {
  company_name: 'Project Central',
  client_name: 'Organización Corporativa',
  assessment_title: 'Gestión y Control de Portafolio',
  currency: 'MXN',
  default_payment_terms_days: 30,
  audit_logging_enabled: true,
  two_factor_simulation: false,
};

const DEFAULT_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-101',
    user_name: 'Sistema',
    user_role: 'Seguridad',
    action: 'Inicialización de Plataforma',
    module: 'Autenticación',
    details: 'Módulo de autenticación multi-tenant inicializado.',
    timestamp: new Date().toISOString(),
  }
];

function formatInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('') || 'U';
}

function mapFirebaseUserToAppUser(fbUser: FirebaseUser, existingUser?: AppUser): AppUser {
  const name = fbUser.displayName || existingUser?.name || fbUser.email?.split('@')[0] || 'Usuario';
  return {
    id: fbUser.uid,
    name,
    email: fbUser.email || '',
    role: existingUser?.role || 'Líder de Proyecto',
    department: existingUser?.department || 'Gestión de Proyectos',
    organization_id: existingUser?.organization_id || `org-${fbUser.uid.slice(0, 8)}`,
    status: 'active',
    avatar_initials: formatInitials(name),
    last_login: new Date().toISOString(),
    created_at: existingUser?.created_at || new Date().toISOString(),
  };
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [users, setUsers] = useState<AppUser[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_USERS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Error parsing stored users', e);
      }
    }
    return [];
  });

  const [settings, setSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch (e) {
        console.error('Error parsing system settings', e);
      }
    }
    return DEFAULT_SETTINGS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_LOGS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Error parsing audit logs', e);
      }
    }
    return DEFAULT_AUDIT_LOGS;
  });

  // Helper to add audit entry
  const addAuditLog = (action: string, module: string, details: string) => {
    if (!settings.audit_logging_enabled) return;
    const cleanAction = sanitizeText(action);
    const cleanModule = sanitizeText(module);
    const cleanDetails = sanitizeText(details);
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      user_name: sanitizeText(currentUser?.name || 'Sistema'),
      user_role: sanitizeText(currentUser?.role || 'Sistema'),
      action: cleanAction,
      module: cleanModule,
      details: cleanDetails,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs(prev => [newLog, ...prev.slice(0, 99)]);
  };

  // Sync Firebase Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setUsers(prevUsers => {
          const existing = prevUsers.find(u => u.id === fbUser.uid || u.email.toLowerCase() === fbUser.email?.toLowerCase());
          const mapped = mapFirebaseUserToAppUser(fbUser, existing);
          setCurrentUser(mapped);
          
          if (!existing) {
            return [...prevUsers, mapped];
          } else {
            return prevUsers.map(u => u.id === existing.id ? mapped : u);
          }
        });
      } else {
        // If not in Firebase Auth, check local cached user or null
        const cached = localStorage.getItem(STORAGE_KEY_AUTH_USER);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed?.id) setCurrentUser(parsed);
          } catch {
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
      }
      setIsLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEY_AUTH_USER);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Login with Email and Password
  const login = async (email: string, password?: string): Promise<{ success: boolean; message?: string }> => {
    const cleanEmail = sanitizeText(email).toLowerCase().trim();
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      return { success: false, message: 'Por favor ingresa un correo electrónico válido.' };
    }

    const rateLimitKey = `auth:login:${cleanEmail}`;
    const limitCheck = globalRateLimiter.check(
      rateLimitKey,
      RATE_LIMIT_CONFIGS.AUTH_LOGIN.max,
      RATE_LIMIT_CONFIGS.AUTH_LOGIN.windowMs,
      RATE_LIMIT_CONFIGS.AUTH_LOGIN.lockoutMs
    );

    if (!limitCheck.allowed) {
      addAuditLog(
        'Bloqueo por Límite de Peticiones',
        'Seguridad',
        `Intentos excesivos de inicio de sesión bloqueados para ${cleanEmail}. Cooldown de ${limitCheck.retryAfterSeconds}s.`
      );
      return {
        success: false,
        message: `Has superado el límite de intentos permitidos. Por favor espera ${limitCheck.retryAfterSeconds} segundos.`,
      };
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password || '');
      const mapped = mapFirebaseUserToAppUser(userCredential.user);
      setCurrentUser(mapped);
      globalRateLimiter.reset(rateLimitKey);
      addAuditLog('Inicio de Sesión', 'Autenticación', `Acceso exitoso de ${mapped.name} (${mapped.email})`);
      return { success: true };
    } catch (err: any) {
      globalRateLimiter.hit(rateLimitKey);
      console.warn('Firebase signInWithEmailAndPassword error:', err?.code, err?.message);
      
      let message = 'Error al iniciar sesión.';
      if (err?.code === 'auth/user-not-found' || err?.code === 'auth/invalid-credential') {
        message = 'Usuario o contraseña incorrectos. Si no tienes cuenta, selecciona la pestaña "Registrarse".';
      } else if (err?.code === 'auth/wrong-password') {
        message = 'La contraseña ingresada no es válida.';
      } else if (err?.code === 'auth/too-many-requests') {
        message = 'Demasiados intentos fallidos. Intenta más tarde.';
      } else if (err?.message) {
        message = err.message;
      }

      addAuditLog('Intento Fallido de Acceso', 'Seguridad', `Fallo de inicio para ${cleanEmail}: ${message}`);
      return { success: false, message };
    }
  };

  // Register with Email and Password
  const register = async (email: string, password: string, name?: string): Promise<{ success: boolean; message?: string }> => {
    const cleanEmail = sanitizeText(email).toLowerCase().trim();
    const cleanName = sanitizeText(name || cleanEmail.split('@')[0]);

    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      return { success: false, message: 'Por favor ingresa un correo electrónico válido.' };
    }
    if (!password || password.length < 6) {
      return { success: false, message: 'La contraseña debe contener al menos 6 caracteres.' };
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      if (cleanName) {
        await updateProfile(userCredential.user, { displayName: cleanName }).catch(() => {});
      }
      const mapped = mapFirebaseUserToAppUser(userCredential.user);
      mapped.name = cleanName;
      mapped.avatar_initials = formatInitials(cleanName);
      
      setCurrentUser(mapped);
      setUsers(prev => [...prev.filter(u => u.id !== mapped.id), mapped]);
      addAuditLog('Registro de Nuevo Usuario', 'Autenticación', `Nuevo usuario registrado: ${mapped.name} (${cleanEmail})`);
      return { success: true };
    } catch (err: any) {
      console.warn('Firebase createUserWithEmailAndPassword error:', err?.code, err?.message);
      let message = 'Error al registrar el usuario.';
      if (err?.code === 'auth/email-already-in-use') {
        message = 'El correo ya está registrado. Por favor inicia sesión con tu contraseña o con Google.';
      } else if (err?.code === 'auth/weak-password') {
        message = 'La contraseña debe ser más robusta (mínimo 6 caracteres).';
      } else if (err?.message) {
        message = err.message;
      }
      return { success: false, message };
    }
  };

  // Login with Google Popup
  const loginWithGoogle = async (): Promise<{ success: boolean; message?: string }> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const mapped = mapFirebaseUserToAppUser(result.user);
      setCurrentUser(mapped);
      setUsers(prev => [...prev.filter(u => u.id !== mapped.id), mapped]);
      addAuditLog('Inicio de Sesión con Google', 'Autenticación', `Acceso federado exitoso para ${mapped.name} (${mapped.email})`);
      return { success: true };
    } catch (err: any) {
      console.warn('Firebase signInWithPopup error:', err?.code, err?.message);
      let message = 'No se pudo completar el inicio de sesión con Google.';
      if (err?.code === 'auth/popup-closed-by-user') {
        message = 'Se cerró la ventana de autenticación de Google antes de finalizar.';
      } else if (err?.code === 'auth/popup-blocked') {
        message = 'La ventana emergente fue bloqueada por el navegador. Por favor permite popups para este sitio.';
      } else if (err?.message) {
        message = err.message;
      }
      return { success: false, message };
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      if (currentUser) {
        addAuditLog('Cierre de Sesión', 'Autenticación', `El usuario ${currentUser.name} cerró sesión`);
      }
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn('Firebase signOut error:', e);
    } finally {
      setCurrentUser(null);
      localStorage.removeItem(STORAGE_KEY_AUTH_USER);
    }
  };

  // Switcher between demo users if applicable
  const switchUser = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (target) {
      const updated = { ...target, last_login: new Date().toISOString() };
      setCurrentUser(updated);
      setUsers(prev => prev.map(u => u.id === target.id ? updated : u));
      addAuditLog('Cambio de Usuario Activo', 'Autenticación', `Sesión cambiada a ${target.name} (${target.role})`);
    }
  };

  // User CRUD
  const addUser = async (user: Omit<AppUser, 'id' | 'created_at'>) => {
    const cleanName = sanitizeText(user.name);
    const cleanEmail = sanitizeText(user.email).toLowerCase();
    const cleanDepartment = sanitizeText(user.department || '');
    
    const newUser: AppUser = {
      ...user,
      name: cleanName,
      email: cleanEmail,
      department: cleanDepartment,
      organization_id: user.organization_id || currentUser?.organization_id || `org-${Date.now().toString(36)}`,
      id: `usr-${Date.now()}`,
      status: 'active',
      avatar_initials: formatInitials(cleanName),
      created_at: new Date().toISOString(),
      last_login: undefined,
    };

    setUsers(prev => [...prev, newUser]);
    addAuditLog('Creación de Usuario', 'Directorio', `Se agregó al usuario ${cleanName} (${user.role})`);
  };

  const updateUser = async (id: string, updates: Partial<AppUser>) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        const cleanName = updates.name ? sanitizeText(updates.name) : u.name;
        const updated = {
          ...u,
          ...updates,
          name: cleanName,
          avatar_initials: updates.name ? formatInitials(cleanName) : u.avatar_initials,
        };
        if (currentUser?.id === id) {
          setCurrentUser(updated);
        }
        return updated;
      }
      return u;
    }));
    addAuditLog('Actualización de Usuario', 'Directorio', `Usuario ID ${id} modificado.`);
  };

  const deleteUser = async (id: string) => {
    const target = users.find(u => u.id === id);
    if (target) {
      setUsers(prev => prev.filter(u => u.id !== id));
      addAuditLog('Eliminación de Usuario', 'Directorio', `Usuario ${target.name} eliminado.`);
      if (currentUser?.id === id) {
        await logout();
      }
    }
  };

  const updateSettings = (updates: Partial<SystemSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
    addAuditLog('Configuración Actualizada', 'Sistema', 'Parámetros del sistema modificados');
  };

  const clearAuditLogs = () => {
    setAuditLogs([]);
  };

  const resetToDefaultCredentials = () => {
    setSettings(DEFAULT_SETTINGS);
    addAuditLog('Reinicio de Sistema', 'Sistema', 'Configuración del sistema restablecida.');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        auditLogs,
        settings,
        isAuthenticated: !!currentUser,
        isLoadingAuth,
        login,
        register,
        loginWithGoogle,
        logout,
        switchUser,
        addUser,
        updateUser,
        deleteUser,
        updateSettings,
        addAuditLog,
        clearAuditLogs,
        resetToDefaultCredentials,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
