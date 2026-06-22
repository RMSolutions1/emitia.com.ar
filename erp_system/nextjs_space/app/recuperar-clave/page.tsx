'use client';

import { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle, Send } from 'lucide-react';
import Link from 'next/link';

export default function RecuperarClavePage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al procesar la solicitud');
      } else {
        setSent(true);
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition">
            <ArrowLeft className="w-4 h-4" /> Volver al login
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {!sent ? (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <Mail className="w-8 h-8 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">¿Olvidaste tu contraseña?</h1>
                <p className="text-slate-500 mt-2">Ingresá tu email y te enviaremos una nueva contraseña temporal.</p>
              </div>

              {error && (
                <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">Email de tu cuenta</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email"
                      className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm" placeholder="tu@email.com"
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3.5 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25">
                  {loading ? (
                    <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Enviando...</>
                  ) : (
                    <><Send className="w-5 h-5" /> Recuperar Contraseña</>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">¡Listo!</h2>
              <p className="text-slate-500 mb-2">Si el email <strong className="text-slate-700">{email}</strong> está registrado, recibirás una contraseña temporal.</p>
              <p className="text-slate-400 text-sm mb-6">Revisá tu bandeja de entrada y la carpeta de spam.</p>
              <Link href="/login" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition">
                <ArrowLeft className="w-4 h-4" /> Ir al Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
