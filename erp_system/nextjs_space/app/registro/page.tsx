'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { UserPlus, Mail, Lock, User, Building2, FileText, MapPin, Phone, Eye, EyeOff, ChevronRight, ChevronLeft, Check, Globe } from 'lucide-react';
import Link from 'next/link';

const CONDICIONES_IVA = [
  { value: 'responsable_inscripto', label: 'IVA Responsable Inscripto' },
  { value: 'monotributista', label: 'Responsable Monotributo' },
  { value: 'exento', label: 'IVA Sujeto Exento' },
  { value: 'no_responsable', label: 'No Responsable' },
];

const PROVINCIAS = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes',
  'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones',
  'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe',
  'Santiago del Estero', 'Tierra del Fuego', 'Tucumán',
];

const RUBROS = [
  'Comercio minorista', 'Comercio mayorista', 'Servicios profesionales', 'Gastronomía',
  'Construcción', 'Tecnología', 'Salud', 'Educación', 'Transporte', 'Industria',
  'Agro', 'Otro',
];

export default function RegistroPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    // Step 1 - User
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    // Step 2 - Company
    companyName: '',
    legalName: '',
    cuit: '',
    condicionIva: 'monotributista',
    rubro: '',
    // Step 3 - Location
    address: '',
    city: '',
    province: 'Buenos Aires',
    postalCode: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const formatCuit = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 10) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`;
  };

  const handleCuitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, cuit: formatCuit(e.target.value) }));
  };

  const [showPassword, setShowPassword] = useState(false);

  const validateStep = (s: number): boolean => {
    setError('');
    if (s === 1) {
      if (!formData.name.trim()) { setError('Ingresá tu nombre completo'); return false; }
      if (!formData.email.trim()) { setError('Ingresá tu email'); return false; }
      if (formData.password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return false; }
      if (formData.password !== formData.confirmPassword) { setError('Las contraseñas no coinciden'); return false; }
    }
    if (s === 2) {
      if (!formData.companyName.trim()) { setError('Ingresá el nombre de tu negocio'); return false; }
      const cuitDigits = formData.cuit.replace(/\D/g, '');
      if (cuitDigits.length > 0 && cuitDigits.length !== 11) { setError('El CUIT debe tener 11 dígitos'); return false; }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) setStep(step + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(3)) return;
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          companyName: formData.companyName,
          legalName: formData.legalName || formData.companyName,
          cuit: formData.cuit.replace(/\D/g, ''),
          condicionIva: formData.condicionIva,
          rubro: formData.rubro,
          address: formData.address,
          city: formData.city,
          province: formData.province,
          postalCode: formData.postalCode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error ?? 'Error al crear cuenta');
      } else {
        const result = await signIn('credentials', {
          redirect: false,
          email: formData.email,
          password: formData.password,
        });

        if (result?.error) {
          router.push('/login');
        } else {
          router.replace('/dashboard');
        }
      }
    } catch (err) {
      setError('Error de conexión. Intentá nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const stepNames = ['Tu Cuenta', 'Tu Negocio', 'Ubicación'];

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-700 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full translate-x-1/4 translate-y-1/4" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight">EMITIA</h1>
            <p className="text-blue-200 mt-1 text-sm font-medium">Facturación Electrónica & Gestión</p>
          </div>

          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white leading-tight">
              Empezá a facturar<br />en 2 minutos.
            </h2>
            <div className="space-y-4 max-w-sm">
              {[
                { icon: Check, text: 'Facturación electrónica con ARCA' },
                { icon: Check, text: 'Plan gratuito ilimitado' },
                { icon: Check, text: 'Control de stock y ventas' },
                { icon: Check, text: 'Cobros con MercadoPago' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="bg-green-500/20 rounded-full p-1"><item.icon className="w-4 h-4 text-green-400" /></div>
                  <span className="text-white/90 text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-blue-300 text-xs">
            © 2026 EMITIA — Hecho en Argentina 🇦🇷
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 sm:p-10 bg-slate-50">
        <div className="w-full max-w-lg">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-6">
            <h1 className="text-3xl font-black bg-gradient-to-r from-blue-900 to-cyan-600 bg-clip-text text-transparent">EMITIA</h1>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Creá tu cuenta</h2>
            <p className="text-slate-500 mt-1">Configurá tu negocio en 3 pasos simples</p>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all ${
                    s < step ? 'bg-green-500 text-white' : s === step ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {s < step ? <Check className="w-4 h-4" /> : s}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${s === step ? 'text-blue-700' : 'text-slate-400'}`}>{stepNames[s-1]}</span>
                </div>
                {s < 3 && <div className={`h-0.5 mt-1 ml-4 mr-2 rounded ${s < step ? 'bg-green-500' : 'bg-slate-200'}`} />}
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* STEP 1: User Account */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nombre completo *</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input name="name" type="text" value={formData.name} onChange={handleChange} required
                      className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm" placeholder="Juan Pérez" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input name="email" type="email" value={formData.email} onChange={handleChange} required autoComplete="email"
                      className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm" placeholder="tu@email.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Teléfono</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input name="phone" type="tel" value={formData.phone} onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm" placeholder="+54 11 1234-5678" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Contraseña *</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange} required
                        className="w-full pl-12 pr-10 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm" placeholder="Mín. 8 caracteres" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" tabIndex={-1}>
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirmar *</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm" placeholder="••••••••" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Business */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nombre del negocio *</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input name="companyName" type="text" value={formData.companyName} onChange={handleChange} required
                      className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm" placeholder="Mi Negocio S.R.L." />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Razón Social <span className="text-slate-400 font-normal">(si difiere del nombre)</span></label>
                  <input name="legalName" type="text" value={formData.legalName} onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm" placeholder="Igual que el nombre del negocio" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">CUIT</label>
                    <div className="relative">
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input name="cuit" type="text" value={formData.cuit} onChange={handleCuitChange}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm" placeholder="20-12345678-9" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Condición IVA *</label>
                    <select name="condicionIva" value={formData.condicionIva} onChange={handleChange}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm appearance-none cursor-pointer">
                      {CONDICIONES_IVA.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Rubro / Actividad</label>
                  <select name="rubro" value={formData.rubro} onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm appearance-none cursor-pointer">
                    <option value="">Seleccioná tu rubro</option>
                    {RUBROS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* STEP 3: Location */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Dirección</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input name="address" type="text" value={formData.address} onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm" placeholder="Av. Corrientes 1234" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ciudad</label>
                    <input name="city" type="text" value={formData.city} onChange={handleChange}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm" placeholder="Buenos Aires" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Provincia</label>
                    <select name="province" value={formData.province} onChange={handleChange}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm appearance-none cursor-pointer">
                      {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div className="w-1/2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Código Postal</label>
                  <input name="postalCode" type="text" value={formData.postalCode} onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm" placeholder="C1043" />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4">
                  <p className="text-sm text-blue-700">
                    <span className="font-semibold">ℹ️ Podés completar estos datos después.</span> Lo único obligatorio es el nombre del negocio. El CUIT y demás datos los vas a necesitar para facturar electrónicamente.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 mt-8">
              {step > 1 && (
                <button type="button" onClick={() => setStep(step - 1)}
                  className="flex-1 py-3 border border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition flex items-center justify-center gap-2">
                  <ChevronLeft className="w-4 h-4" /> Anterior
                </button>
              )}
              {step < 3 ? (
                <button type="button" onClick={nextStep}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25">
                  Siguiente <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button type="submit" disabled={loading}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-green-500/25">
                  {loading ? (
                    <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creando cuenta...</>
                  ) : (
                    <><UserPlus className="w-5 h-5" /> Crear Cuenta Gratis</>
                  )}
                </button>
              )}
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              ¿Ya tenés cuenta?{' '}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold">Iniciá sesión</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
