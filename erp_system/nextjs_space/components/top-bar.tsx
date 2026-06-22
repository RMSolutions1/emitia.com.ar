'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Search, Bell, Settings, LogOut, User, ChevronDown, Building2, Crown, Menu, X, Sparkles, HelpCircle, Zap
} from 'lucide-react';
import { NotificationBell } from './notification-bell';
import { CommandPalette } from './command-palette';

export function TopBar({ onToggleSidebar, sidebarOpen }: { onToggleSidebar: () => void; sidebarOpen: boolean }) {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const userName = session?.user?.name || 'Usuario';
  const userEmail = session?.user?.email || '';
  const userRole = (session?.user as any)?.role || 'user';
  const companyName = (session?.user as any)?.companyName || null;
  const companyPlan = (session?.user as any)?.companyPlan || 'free';

  const planConfig = (
    companyPlan === 'empresa'
      ? { label: 'EMPRESA', gradient: 'from-purple-500 to-indigo-600', ring: 'ring-purple-500/20' }
      : companyPlan === 'gestion'
      ? { label: 'GESTIÓN', gradient: 'from-emerald-500 to-teal-600', ring: 'ring-emerald-500/20' }
      : { label: 'FREE', gradient: 'from-slate-400 to-slate-500', ring: 'ring-slate-500/20' }
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/login' });
  };

  return (
    <>
      <header className="topbar">
        {/* Left: Mobile toggle + Company */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 text-blue-100 hover:bg-white/10 hover:text-white transition-all"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {companyName && (
            <div className="hidden md:flex items-center gap-2 px-2.5 py-1 bg-white/10 border border-white/20">
              <div className="w-6 h-6 bg-white/20 flex items-center justify-center">
                <Building2 className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-[12px] font-semibold text-white max-w-[180px] truncate">{companyName}</span>
              <span className={`topbar-plan-badge ${planConfig.gradient ? '' : ''}`}>
                {planConfig.label}
              </span>
            </div>
          )}
        </div>

        {/* Center: Search */}
        <div className="flex-1 max-w-lg mx-auto">
          <button
            onClick={() => setShowCommandPalette(true)}
            className="topbar-search group"
          >
            <Search className="w-4 h-4 text-blue-100 group-hover:text-white transition-colors" />
            <span className="text-[12px] text-blue-100/80 flex-1 text-left">Buscar módulos, clientes, productos...</span>
            <kbd className="hidden sm:inline-flex text-[10px] font-medium text-slate-400 bg-white/80 border border-slate-200/60 rounded-md px-1.5 py-0.5 shadow-sm">⌘K</kbd>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => router.push('/guias')}
            className="topbar-icon-btn"
            title="Guías de ayuda"
          >
            <HelpCircle className="w-[18px] h-[18px]" />
          </button>

          <NotificationBell collapsed={false} position="header" />

          <button
            onClick={() => router.push('/configuracion')}
            className="topbar-icon-btn"
            title="Configuración"
          >
            <Settings className="w-[18px] h-[18px]" />
          </button>

          <div className="hidden sm:block w-px h-7 bg-slate-200/60 mx-1.5" />

          {/* User Profile */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 pl-1.5 pr-2 py-1 hover:bg-white/10 transition-all border border-transparent hover:border-white/20"
            >
              <div className={`topbar-avatar ${
                userRole === 'superadmin' ? 'bg-purple-600' :
                userRole === 'company_admin' ? 'bg-[#1e4d8c]' : 'bg-slate-500'
              }`}>
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-[12px] font-semibold text-white leading-tight truncate max-w-[120px]">
                  {userName}
                </p>
                <p className="text-[10px] text-blue-100/70 leading-tight">
                  {userRole === 'company_admin' ? 'Administrador' :
                   userRole === 'superadmin' ? 'Super Admin' : 'Usuario'}
                </p>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-blue-100 transition-transform duration-200 hidden md:block ${
                userMenuOpen ? 'rotate-180' : ''
              }`} />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden z-50 animate-scale-in">
                <div className="px-4 py-3.5 bg-gradient-to-r from-slate-50 to-blue-50/30 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold shadow-md ${
                      userRole === 'superadmin' ? 'bg-gradient-to-br from-purple-500 to-indigo-600' :
                      userRole === 'company_admin' ? 'bg-gradient-to-br from-blue-500 to-blue-700' : 'bg-gradient-to-br from-slate-400 to-slate-600'
                    }`}>
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{userName}</p>
                      <p className="text-[11px] text-slate-400 truncate">{userEmail}</p>
                    </div>
                  </div>
                  {userRole === 'superadmin' && (
                    <div className="mt-2.5 px-2.5 py-1.5 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-100/50">
                      <p className="text-[10px] text-purple-700 font-bold flex items-center gap-1">
                        <Crown className="w-3 h-3" /> Super Administrador
                      </p>
                    </div>
                  )}
                </div>

                <div className="py-1.5">
                  <button
                    onClick={() => { router.push('/configuracion'); setUserMenuOpen(false); }}
                    className="topbar-dropdown-item"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    Configuración
                  </button>
                  <button
                    onClick={() => { router.push('/guias'); setUserMenuOpen(false); }}
                    className="topbar-dropdown-item"
                  >
                    <HelpCircle className="w-4 h-4 text-slate-400" />
                    Guías de Ayuda
                  </button>
                </div>

                <div className="border-t border-slate-100 py-1.5">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50/80 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <CommandPalette externalOpen={showCommandPalette} onClose={() => setShowCommandPalette(false)} />
    </>
  );
}
