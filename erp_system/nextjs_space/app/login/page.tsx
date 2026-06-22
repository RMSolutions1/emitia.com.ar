'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { LogIn, Mail, Lock, Eye, EyeOff, Zap, Shield, BarChart3, FileText, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError('Email o contraseña incorrectos. Verificá tus datos e intentá nuevamente.');
      } else {
        router.replace('/dashboard');
      }
    } catch (err) {
      setError('Error de conexión. Intentá nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-[55%] bg-gradient-to-br from-[#0e1a35] via-[#1a1040] to-[#0e1a35] relative overflow-hidden">
        {/* Animated grid */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.06) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />

        {/* Glowing orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-3/4 left-1/2 w-[300px] h-[300px] bg-violet-500/8 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />

        {/* Floating decorative lines */}
        <div className="absolute top-20 right-20 w-px h-40 bg-gradient-to-b from-transparent via-blue-400/30 to-transparent" />
        <div className="absolute bottom-32 left-32 w-px h-32 bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent" />
        <div className="absolute top-1/2 right-1/3 w-32 h-px bg-gradient-to-r from-transparent via-blue-400/20 to-transparent" />

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          {/* Logo */}
          <div className="animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] shadow-lg shadow-blue-500/25">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white tracking-tight">EMITIA</h1>
                <p className="text-blue-300/70 text-[11px] font-medium tracking-widest uppercase">Facturación Inteligente</p>
              </div>
            </div>
          </div>

          {/* Main message */}
          <div className="space-y-10 animate-fade-in-up">
            <div>
              <h2 className="text-4xl xl:text-5xl font-bold text-white leading-[1.15] tracking-tight">
                Tu negocio,<br />
                <span className="bg-gradient-to-r from-[#2563eb] to-[#3b82f6] bg-clip-text text-transparent">bajo control total.</span>
              </h2>
              <p className="text-blue-200/60 mt-6 text-lg leading-relaxed max-w-lg">
                Facturá, gestioná stock, controlá ventas y cobrá — todo desde un solo lugar, con la potencia de la IA.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 max-w-lg">
              {[
                { icon: FileText, label: 'Facturación ARCA', desc: 'Cumplimiento total' },
                { icon: BarChart3, label: 'Reportes en vivo', desc: 'Datos en tiempo real' },
                { icon: Shield, label: '100% seguro', desc: 'Encriptación total' },
                { icon: Zap, label: 'IA integrada', desc: 'Automatización smart' },
              ].map((feat, i) => (
                <div key={feat.label}
                  className={`flex items-center gap-3 bg-white/[0.04] backdrop-blur-sm rounded-xl p-3.5 border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.12] transition-all duration-300 animate-fade-in-up stagger-${i + 1}`}>
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                    <feat.icon className="w-4 h-4 text-blue-300" />
                  </div>
                  <div>
                    <span className="text-white text-sm font-medium block">{feat.label}</span>
                    <span className="text-blue-300/40 text-[10px]">{feat.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="text-blue-400/40 text-xs font-medium animate-fade-in">
            © 2026 EMITIA — Hecho en Argentina 🇦🇷
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-12 bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2.5 mb-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-black text-gradient">EMITIA</h1>
            </div>
            <p className="text-slate-400 text-sm">Facturación Electrónica & Gestión</p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Bienvenido de vuelta</h2>
            <p className="text-slate-400 mt-2">Ingresá a tu cuenta para continuar</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm flex items-start gap-3 animate-fade-in">
              <div className="bg-red-100 rounded-full p-1 mt-0.5 flex-shrink-0"><Lock className="w-3.5 h-3.5 text-red-600" /></div>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 shadow-sm transition-all placeholder:text-slate-300 text-slate-800"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                  Contraseña
                </label>
                <Link href="/recuperar-clave" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full pl-12 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 shadow-sm transition-all placeholder:text-slate-300 text-slate-800"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 via-blue-600 to-cyan-600 text-white py-3.5 rounded-xl font-semibold hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
            >
              {loading ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Ingresando...</>
              ) : (
                <><LogIn className="w-5 h-5" /> Iniciar Sesión <ArrowRight className="w-4 h-4 ml-1" /></>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-400">
              ¿No tenés cuenta?{' '}
              <Link href="/registro" className="text-blue-600 hover:text-blue-700 font-semibold">
                Registrate gratis
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
