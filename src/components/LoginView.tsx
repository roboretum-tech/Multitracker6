import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  AlertCircle, 
  KeyRound, 
  CheckCircle2, 
  UserCheck,
  Building2,
  FolderKanban,
  UserPlus,
  LogIn
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess?: () => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const { login, register, loginWithGoogle } = useAuth();
  
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const result = await login(email, password);
        if (result.success) {
          if (onLoginSuccess) onLoginSuccess();
        } else {
          setErrorMessage(result.message || 'Error de credenciales.');
        }
      } else {
        const result = await register(email, password, name);
        if (result.success) {
          setSuccessMessage('¡Cuenta creada exitosamente! Configurando tu espacio de trabajo...');
          setTimeout(() => {
            if (onLoginSuccess) onLoginSuccess();
          }, 800);
        } else {
          setErrorMessage(result.message || 'Error al crear la cuenta.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Ocurrió un error inesperado al conectar con el servicio.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsGoogleLoading(true);

    try {
      const result = await loginWithGoogle();
      if (result.success) {
        if (onLoginSuccess) onLoginSuccess();
      } else {
        setErrorMessage(result.message || 'No se pudo iniciar sesión con Google.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al autenticar con Google.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070d18] text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Subtle Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-6">
        {/* Brand & Logo Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-md">
            <FolderKanban className="w-9 h-9 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Project Central
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Plataforma Directiva de Gestión de Portafolio y Proyectos
            </p>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-[#0f172a]/95 border border-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {/* Mode Tabs */}
          <div className="flex border-b border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMessage(null); }}
              className={`flex-1 pb-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2 border-b-2 ${
                mode === 'login'
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-4 h-4" />
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setErrorMessage(null); }}
              className={`flex-1 pb-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2 border-b-2 ${
                mode === 'register'
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Registrarse
            </button>
          </div>

          {/* Google Sign-in Button */}
          <div className="mb-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-800 font-medium text-sm rounded-xl transition duration-200 flex items-center justify-center gap-3 shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
            >
              {isGoogleLoading ? (
                <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{mode === 'login' ? 'Iniciar sesión con Google Mail' : 'Registrarse con Google Mail'}</span>
            </button>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#0f172a] px-3 text-slate-500 font-mono">
                  o con correo corporativo
                </span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nombre Completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Ing. Carlos Mendoza"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@empresa.com"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {mode === 'register' && (
                <p className="text-[11px] text-slate-500 mt-1">
                  Mínimo 6 caracteres.
                </p>
              )}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-red-950/40 border border-red-800/80 rounded-xl flex items-start gap-2.5 text-red-300 text-xs animate-shake">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-800/80 rounded-xl flex items-start gap-2.5 text-emerald-300 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-sm rounded-xl transition duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Ingresar a mi Espacio' : 'Crear Mi Cuenta & Comenzar'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Privacy Note */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Espacio multi-tenant aislado: solo tú tienes acceso a tus datos</span>
          </div>
        </div>
      </div>
    </div>
  );
}
