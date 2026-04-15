import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Users, ArrowRight } from 'lucide-react';
import Auth, { signInWithGoogle, signInWithFacebook } from '../components/Auth.jsx';

export default function LandingPage({ session }) {
  const navigate = useNavigate();
  const authSectionRef = useRef(null);
  const [authError, setAuthError] = useState('');
  const [authMode, setAuthMode] = useState('signin');

  const scrollToAuth = () => {
    setAuthMode('signin');
    authSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleProviderLogin = async (providerFn) => {
    setAuthError('');
    try {
      await providerFn();
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Error al iniciar sesión con el proveedor.');
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <div className="relative overflow-hidden py-24">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.2),_transparent_35%)]" />
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="flex min-h-[calc(100vh-6rem)] flex-col items-center justify-center text-center">
            <p className="mb-6 inline-flex rounded-full bg-sky-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-sky-300">
              IA para tus estudios
            </p>
            <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
              Domina tus estudios con IA
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Convierte apuntes y documentos en resúmenes, quizzes y flashcards con un asistente de estudio completo.
            </p>

            <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={scrollToAuth}
                className="inline-flex items-center justify-center rounded-full bg-sky-500 px-10 py-4 text-base font-semibold text-white shadow-xl shadow-sky-500/25 transition hover:bg-sky-400"
              >
                Iniciar sesión
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-slate-900 px-10 py-4 text-base font-semibold text-white transition hover:bg-slate-800"
              >
                {session ? 'Ir al dashboard' : 'Ir al dashboard'}
              </button>
            </div>

            <p className="mt-4 text-sm text-slate-400 max-w-2xl">
              Accede al dashboard de VibeStudy para generar resúmenes, quizzes, flashcards y conversaciones interactivas sobre tu material.
            </p>

            <div className="mt-8 grid w-full max-w-lg gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => handleProviderLogin(signInWithGoogle)}
                className="inline-flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-slate-950/90 px-5 py-4 text-sm font-semibold text-white transition hover:bg-slate-900"
              >
                <LogIn size={18} className="text-sky-400" />
                Iniciar con Google
              </button>
              <button
                type="button"
                onClick={() => handleProviderLogin(signInWithFacebook)}
                className="inline-flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-slate-950/90 px-5 py-4 text-sm font-semibold text-white transition hover:bg-slate-900"
              >
                <Users size={18} className="text-sky-400" />
                Iniciar con Facebook
              </button>
            </div>

            {authError && (
              <div className="mt-6 rounded-3xl border border-red-500/20 bg-red-950/80 px-5 py-4 text-sm text-red-200">
                {authError}
              </div>
            )}
          </div>
        </div>
      </div>

      <section ref={authSectionRef} className="mx-auto max-w-3xl px-6 pb-20">
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-8 shadow-[0_32px_120px_-70px_rgba(56,189,248,0.6)]">
          <div className="mb-8 text-center">
            <p className="text-sm uppercase tracking-[0.35em] text-sky-400">Entrada segura</p>
            <h2 className="mt-4 text-3xl font-semibold text-white">
              {session ? 'Bienvenido de nuevo' : 'Accede a tu cuenta'}
            </h2>
            <p className="mt-3 text-slate-400">
              {session ? 'Ya tienes sesión iniciada. Abre el dashboard para continuar.' : 'Inicia sesión o regístrate para usar el asistente de estudio.'}
            </p>
          </div>

          {!session ? (
            <Auth initialMode={authMode} onAuthSuccess={() => navigate('/dashboard', { replace: true })} />
          ) : (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 text-center text-slate-300">
              <p className="text-lg font-semibold text-white">Tu sesión está activa</p>
              <p className="mt-3">Pulsa el botón para acceder al dashboard y comenzar a estudiar.</p>
              <button
                type="button"
                onClick={() => navigate('/dashboard', { replace: true })}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-400"
              >
                Ir al dashboard <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
