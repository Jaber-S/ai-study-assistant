import { useState } from 'react';
import { Mail, Lock, LogIn, Users } from 'lucide-react';
import { supabase } from '../lib/supabaseClient.js';

const isSupabaseConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;

export async function signInWithGoogle() {
  if (!isSupabaseConfigured) throw new Error('Supabase no está configurado. Agrega las variables de entorno.');
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/`
    }
  });
  if (error) throw error;
}

export async function signInWithFacebook() {
  if (!isSupabaseConfigured) throw new Error('Supabase no está configurado. Agrega las variables de entorno.');
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'facebook',
    options: {
      redirectTo: `${window.location.origin}/`
    }
  });
  if (error) throw error;
}

export default function Auth({ onAuthSuccess, initialMode = 'signin' }) {
  const [mode, setMode] = useState(initialMode); // 'signin', 'signup', 'forgot-password'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

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
    setResetEmailSent(false);
  };

  const goToForgotPassword = () => {
    setMode('forgot-password');
    setError('');
    setInfo('');
    setPassword('');
  };

  const goBack = () => {
    setMode('signin');
    setError('');
    setInfo('');
    setPassword('');
    setResetEmailSent(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setInfo('');

    if (!email) {
      setError('Por favor ingresa tu correo electrónico.');
      return;
    }

    if (mode === 'forgot-password') {
      // Handle password recovery
      setLoading(true);
      try {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`
        });

        if (resetError) {
          if (resetError.message.includes('rate limited')) {
            setError('Demasiados intentos. Por favor, intenta más tarde.');
          } else {
            setError(resetError.message || 'Error al enviar correo de recuperación.');
          }
        } else {
          setResetEmailSent(true);
          setInfo('✓ Se ha enviado un correo de recuperación a ' + email + '. Revisa tu bandeja de entrada y haz clic en el enlace para restablecer tu contraseña.');
          setPassword('');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password) {
      setError('Por favor ingresa tu contraseña.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (!isSupabaseConfigured) {
      setError('Supabase no está configurado. Agrega las variables de entorno.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        // Try to sign up first
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`
          }
        });

        console.log('SignUp Response:', { 
          hasError: !!signUpError, 
          errorMessage: signUpError?.message,
          errorCode: signUpError?.code,
          errorStatus: signUpError?.status,
          userData: signUpData?.user ? { id: signUpData.user.id, email: signUpData.user.email, email_confirmed_at: signUpData.user.email_confirmed_at } : null,
          hasSession: !!signUpData?.session
        });

        if (signUpError) {
          // Check if user already exists - Supabase returns different error messages
          const errorMessage = signUpError.message?.toLowerCase() || '';
          const errorCode = signUpError.code;
          
          if (errorMessage.includes('user already registered') || 
              errorMessage.includes('already has an account') ||
              errorMessage.includes('already registered') ||
              errorMessage.includes('email already exists') ||
              errorCode === 'user_already_exists' ||
              signUpError.status === 422) {
            setError('❌ Esta cuenta ya está registrada. Por favor, inicia sesión con tu correo y contraseña, o usa "¿Olvidaste tu contraseña?" si no la recuerdas.');
            setMode('signin');
            return;
          }
          throw signUpError;
        }

        if (signUpData?.user) {
          // If we have a user but no identities, the account likely already exists
          if (signUpData.user.identities && signUpData.user.identities.length === 0) {
            setError('❌ Esta cuenta ya está registrada. Por favor, inicia sesión con tu correo y contraseña, o usa "¿Olvidaste tu contraseña?" si no la recuerdas.');
            setMode('signin');
            return;
          }

          // Check if this is an already-confirmed account (existing user)
          if (signUpData.user.email_confirmed_at) {
            setError('❌ Esta cuenta ya está registrada. Por favor, inicia sesión con tu correo y contraseña, o usa "¿Olvidaste tu contraseña?" si no la recuerdas.');
            setMode('signin');
            return;
          }

          // Additional verification: Try to sign in to check if account actually exists
          const { error: testSignInError } = await supabase.auth.signInWithPassword({ 
            email, 
            password 
          });

          if (testSignInError && testSignInError.message.includes('Email not confirmed')) {
            // Account exists but email is not confirmed
            setError('❌ Esta cuenta ya está registrada. Por favor, revisa tu correo de confirmación. Si no encuentras el correo, intenta usar "¿Olvidaste tu contraseña?" para acceder.');
            setMode('signin');
            return;
          }

          if (!testSignInError) {
            // Sign in succeeded! Account already exists and is confirmed
            setError('❌ Esta cuenta ya está registrada. Por favor, inicia sesión con tu correo y contraseña, o usa "¿Olvidaste tu contraseña?" si no la recuerdas.');
            setMode('signin');
            return;
          }

          // If we reach here, it's a new account
          // User was created and needs confirmation
          if (signUpData?.session) {
            // User signed up and confirmed immediately (rare)
            onAuthSuccess();
          } else {
            // Email confirmation required - user exists but no session yet
            setInfo('✓ ¡Cuenta creada exitosamente! Se ha enviado un correo de confirmación a ' + email + '. Haz clic en el enlace del correo para verificar tu cuenta.');
            setEmail('');
            setPassword('');
          }
        }
      } else {
        // Sign in mode
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ 
          email, 
          password 
        });

        if (signInError) {
          if (signInError.message.includes('Invalid login credentials')) {
            setError('❌ Correo o contraseña incorrectos.');
          } else if (signInError.message.includes('Email not confirmed')) {
            setError('⚠️ Por favor, verifica tu correo electrónico antes de iniciar sesión. Revisa el enlace que te enviamos. Si no encuentras el correo, intenta registrarte nuevamente.');
            setMode('signup');
          } else {
            throw signInError;
          }
        } else if (signInData?.session) {
          onAuthSuccess();
        }
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
          <p className="text-sm uppercase tracking-[0.35em] text-sky-400">
            {mode === 'signup' ? 'Registro seguro' : mode === 'forgot-password' ? 'Recuperar contraseña' : 'Acceso seguro'}
          </p>
          <h2 className="mt-4 text-3xl font-semibold text-white">
            {mode === 'signup' ? 'Crea tu cuenta' : mode === 'forgot-password' ? 'Restablecer contraseña' : 'Inicia sesión'}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            {mode === 'signup' 
              ? 'Crea una cuenta con tu correo para guardar tus estudios y acceder desde cualquier lugar.' 
              : mode === 'forgot-password'
              ? 'Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.'
              : 'Inicia sesión con tu correo y contraseña para acceder a tu cuenta y continuar estudiando.'}
          </p>
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

          {mode !== 'forgot-password' && (
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
          )}

          {error && <p className="rounded-2xl border border-red-500/30 bg-red-950/80 px-4 py-3 text-sm text-red-300">{error}</p>}
          {info && <p className="rounded-2xl border border-green-500/30 bg-green-950/80 px-4 py-3 text-sm text-green-300">{info}</p>}

          <button
            type="submit"
            disabled={loading || (mode === 'forgot-password' && resetEmailSent)}
            className="w-full rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Procesando...' : mode === 'signup' ? 'Crear cuenta' : mode === 'forgot-password' ? 'Enviar enlace de recuperación' : 'Entrar'}
          </button>
        </form>

        {mode === 'signin' && (
          <div className="mt-4 flex flex-col gap-3 text-sm">
            <button 
              type="button" 
              onClick={goToForgotPassword}
              className="text-slate-400 hover:text-sky-300 transition font-medium"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        )}

        {mode === 'forgot-password' && (
          <div className="mt-4">
            <button 
              type="button" 
              onClick={goBack}
              className="text-sm text-slate-400 hover:text-sky-300 transition"
            >
              ← Volver al inicio de sesión
            </button>
          </div>
        )}

        <div className="mt-5 flex items-center justify-between text-sm text-slate-400">
          {mode !== 'forgot-password' && (
            <>
              <p>{mode === 'signup' ? '¿Ya tienes cuenta?' : '¿Aún no tienes cuenta?'}</p>
              <button type="button" onClick={toggleMode} className="font-semibold text-slate-100 hover:text-sky-300">
                {mode === 'signup' ? 'Inicia sesión aquí' : 'Crea una cuenta'}
              </button>
            </>
          )}
        </div>

        {mode === 'signup' && (
          <p className="mt-3 text-xs text-slate-500">
            💡 Después de crear tu cuenta, recibirás un correo de confirmación. Verifica tu dirección de correo para poder usar tu cuenta completamente.
          </p>
        )}
      </div>

      {mode !== 'forgot-password' && (
        <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-5 text-sm text-slate-300">
          <div className="mb-3 flex items-center justify-between rounded-2xl bg-slate-950/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <LogIn size={18} className="text-sky-400" />
              <span>Iniciar sesión con Google</span>
            </div>
            <button
              type="button"
              onClick={async () => {
                try {
                  await signInWithGoogle();
                } catch (err) {
                  setError(err.message || 'Error al iniciar con Google.');
                }
              }}
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
              onClick={async () => {
                try {
                  await signInWithFacebook();
                } catch (err) {
                  setError(err.message || 'Error al iniciar con Facebook.');
                }
              }}
              className="rounded-full bg-slate-800 px-4 py-2 text-white transition hover:bg-slate-700"
            >
              Acceder
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
