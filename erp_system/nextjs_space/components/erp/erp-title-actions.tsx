'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Settings,
  LogOut,
  ChevronDown,
  Building2,
  Crown,
  HelpCircle,
} from 'lucide-react';
import { NotificationBell } from '@/components/notification-bell';
import { CommandPalette } from '@/components/command-palette';

export function ErpTitleActions() {
  const { data: session } = useSession();
  const router = useRouter();
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const userName = session?.user?.name || 'Usuario';
  const userEmail = session?.user?.email || '';
  const userRole = (session?.user as any)?.role || 'user';
  const companyName = (session?.user as any)?.companyName || null;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <div className="flex items-center gap-1 shrink-0">
        {companyName && (
          <div className="hidden xl:flex items-center gap-1.5 px-2 py-0.5 bg-white/10 border border-white/20 text-[11px] max-w-[160px]">
            <Building2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{companyName}</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowCommandPalette(true)}
          className="erp-titlebar-btn hidden sm:flex items-center gap-1.5 px-2 min-w-[140px]"
          title="Buscar (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="text-[11px] opacity-80 truncate">Buscar…</span>
        </button>

        <button
          type="button"
          onClick={() => router.push('/guias')}
          className="erp-titlebar-btn hidden md:inline-flex"
          title="Ayuda"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <NotificationBell collapsed={false} position="header" />

        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="erp-titlebar-btn flex items-center gap-1.5 pl-1 pr-1.5"
          >
            <span className="w-6 h-6 bg-white/20 border border-white/30 flex items-center justify-center text-[11px] font-bold">
              {userName.charAt(0).toUpperCase()}
            </span>
            <ChevronDown className={`w-3 h-3 hidden sm:block transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-[#b8c9dc] shadow-lg z-50 text-[#1a3a5c]">
              <div className="px-3 py-2 border-b border-[#b8c9dc] bg-[#eef3f9]">
                <p className="text-xs font-bold truncate">{userName}</p>
                <p className="text-[10px] text-[#5c7291] truncate">{userEmail}</p>
                {userRole === 'superadmin' && (
                  <p className="text-[10px] text-purple-700 font-bold mt-1 flex items-center gap-1">
                    <Crown className="w-3 h-3" /> Super Admin
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => { router.push('/configuracion'); setUserMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-[#eef3f9]"
              >
                <Settings className="w-3.5 h-3.5" /> Configuración
              </button>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-700 hover:bg-red-50 border-t border-[#b8c9dc]"
              >
                <LogOut className="w-3.5 h-3.5" /> Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>

      <CommandPalette externalOpen={showCommandPalette} onClose={() => setShowCommandPalette(false)} />
    </>
  );
}
