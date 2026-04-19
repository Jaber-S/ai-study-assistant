import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { supabase } from '../lib/supabaseClient.js';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Verify token exists on component mount
  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setError('Token inválido o expirado. Por favor, solicita un nuevo correo de recuperación.');
    }
  }, [searchParams]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setInfo('');

    if (!password || !confirmPassword) {
      setError('Por favor ingresa tu nueva contraseña en ambos campos.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        if (updateError.message.includes('Invalid token')) {
          setError('❌ El enlace de recuperación ha expirado. Por favor, solicita un nuevo correo.');
        } else {
          setError(updateError.message || 'Error al restablecer la contraseña.');
        }
      } else {
        setSuccess(true);
        setInfo('✓ ¡Contraseña restablecida exitosamente! Redirigiendo al panel de control...');
        setPassword('');
        setConfirmPassword('');
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-white/10 bg-slate-950/95 p-6 shadow-[0_32px_120px_-70px_rgba(56,189,248,0.7)]">
          <div className="mb-6">
            <p className="text-sm uppercase tracking-[0.35em] text-sky-400">Seguridad</p>
            <h2 className="mt-4 text-3xl font-semibold text-white">Restablecer contraseña</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Ingresa tu nueva contraseña para recuperar el acceso a tu cuenta.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm text-slate-200">
              Nueva contraseña
              <div className="mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 focus-within:border-sky-500">
                <Lock size={18} className="text-sky-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="flex-1 bg-transparent text-white outline-none placeholder:text-slate-500"
                  disabled={success}
                />
              </div>
            </label>

            <label className="block text-sm text-slate-200">
              Confirmar contraseña
              <div className="mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 focus-within:border-sky-500">
                <Lock size={18} className="text-sky-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirma tu contraseña"
                  className="flex-1 bg-transparent text-white outline-none placeholder:text-slate-500"
                  disabled={success}
                />
              </div>
            </label>

            {error && <p className="rounded-2xl border border-red-500/30 bg-red-950/80 px-4 py-3 text-sm text-red-300">{error}</p>}
            {info && <p className="rounded-2xl border border-green-500/30 bg-green-950/80 px-4 py-3 text-sm text-green-300">{info}</p>}

            <button
              type="submit"
              disabled={loading || success}
              className="w-full rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Procesando...' : success ? 'Redirigiendo...' : 'Restablecer contraseña'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400">
              ¿Recordaste tu contraseña?{' '}
              <button
                type="button"
                onClick={() => navigate('/', { replace: true })}
                className="font-semibold text-slate-100 hover:text-sky-300 transition"
              >
                Volver al inicio de sesión
              </button>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            💡 Este enlace es válido por 24 horas. Si ha expirado, solicita un nuevo correo de recuperación.
          </p>
        </div>
      </div>
    </div>
  );
}
