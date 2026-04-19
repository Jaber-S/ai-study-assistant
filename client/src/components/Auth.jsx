import { useState } from 'react';
import { Mail, Lock, LogIn, Users } from 'lucide-react';
import { supabase } from '../lib/supabaseClient.js';

const isSupabaseConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;

export async function signInWithGoogle() {
  if (!isSupabaseConfigured) throw new Error('Supabase no está configurado. Agrega las variables de entorno.');
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/dashboard`
    }
  });
  if (error) throw error;
}

export async function signInWithFacebook() {
  if (!isSupabaseConfigured) throw new Error('Supabase no está configurado. Agrega las variables de entorno.');
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'facebook',
    options: {
      redirectTo: `${window.location.origin}/dashboard`
    }
  });
  if (error) throw error;
}

export default function Auth({ onAuthSuccess, initialMode = 'signin' }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isSupabaseConfigured) {
    return (
      <div className="text-center text-slate-300">
        <p className="text-lg font-semibold text-red-400 mb-4">Configuración requerida</p>
        <p className="mb-4">Para usar la autenticación, configura Supabase agregando las variables de entorno:</p>
        <div className="bg-slate-800 p-4 rounded-lg text-left font-mono text-sm">
          <p>VITE_SUPABASE_URL=https://tu-proyecto.supabase.co</p>
          <p>VITE_SUPABASE_ANON_KEY=tu-clave-anonima</p>
        </div>
        <p className="mt-4 text-sm">Crea un archivo <code className="bg-slate-700 px-2 py-1 rounded">client/.env</code> con estas variables.</p>
      </div>
    );
  }

  const toggleMode = () => {
    setMode((current) => (current === 'signin' ? 'signup' : 'signin'));
    setError('');
    setInfo('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setInfo('');

    if (!email || !password) {
      setError('Por favor ingresa correo y contraseña.');
      return;
    }

    if (!isSupabaseConfigured) {
      setError('Supabase no está configurado. Agrega las variables de entorno.');
      return;
    }

    setLoading(true);

    try {
      let { data, error: authError } = await supabase.auth.signUp({ email, password });

      // If signup fails because user already exists, try signing in instead
      if (authError && authError.message.includes('User already registered')) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        data = signInData;
        authError = signInError;
        if (!authError) {
          setInfo('Ya tienes una cuenta. Has iniciado sesión automáticamente.');
        }
      }

      if (authError) {
        setError(authError.message);
      } else if (data?.session) {
        onAuthSuccess();
      } else {
        setInfo('Revisa tu correo para continuar.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-slate-950/95 p-6 shadow-[0_32px_120px_-70px_rgba(56,189,248,0.7)]">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.35em] text-sky-400">{mode === 'signup' ? 'Registro seguro' : 'Acceso seguro'}</p>
          <h2 className="mt-4 text-3xl font-semibold text-white">{mode === 'signup' ? 'Crea tu cuenta' : 'Inicia sesión'}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">Usa correo y contraseña para conservar tus resúmenes y quizzes en tu cuenta.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm text-slate-200">
            Correo electrónico
            <div className="mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 focus-within:border-sky-500">
              <Mail size={18} className="text-sky-400" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="tú@correo.com"
                className="flex-1 bg-transparent text-white outline-none placeholder:text-slate-500"
              />
            </div>
          </label>

          <label className="block text-sm text-slate-200">
            Contraseña
            <div className="mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 focus-within:border-sky-500">
              <Lock size={18} className="text-sky-400" />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="flex-1 bg-transparent text-white outline-none placeholder:text-slate-500"
              />
            </div>
          </label>

          {error && <p className="rounded-2xl border border-red-500/30 bg-red-950/80 px-4 py-3 text-sm text-red-300">{error}</p>}
          {info && <p className="rounded-2xl border border-sky-500/30 bg-sky-950/80 px-4 py-3 text-sm text-sky-200">{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Procesando...' : mode === 'signup' ? 'Crear cuenta' : 'Entrar'}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between text-sm text-slate-400">
          <p>{mode === 'signup' ? '¿Ya tienes cuenta?' : '¿Aún no tienes cuenta?'}</p>
          <button type="button" onClick={toggleMode} className="font-semibold text-slate-100 hover:text-sky-300">
            {mode === 'signup' ? 'Iniciar sesión' : 'Regístrate'}
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-5 text-sm text-slate-300">
        <div className="mb-3 flex items-center justify-between rounded-2xl bg-slate-950/60 px-4 py-3">
          <div className="flex items-center gap-2">
            <LogIn size={18} className="text-sky-400" />
            <span>Iniciar sesión con Google</span>
          </div>
          <button
            type="button"
            onClick={() => signInWithGoogle().catch((err) => setError(err.message || 'Error al iniciar con Google.'))}
            className="rounded-full bg-slate-800 px-4 py-2 text-white transition hover:bg-slate-700"
          >
            Acceder
          </button>
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-slate-950/60 px-4 py-3">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-sky-400" />
            <span>Iniciar sesión con Facebook</span>
          </div>
          <button
            type="button"
            onClick={() => signInWithFacebook().catch((err) => setError(err.message || 'Error al iniciar con Facebook.'))}
            className="rounded-full bg-slate-800 px-4 py-2 text-white transition hover:bg-slate-700"
          >
            Acceder
          </button>
        </div>
      </div>
    </div>
  );
}
