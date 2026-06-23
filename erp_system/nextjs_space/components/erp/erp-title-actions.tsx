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
  User,
} from 'lucide-react';
import { NotificationBell } from '@/components/notification-bell';
import { CommandPalette } from '@/components/command-palette';
import { ErpUserAvatar } from './erp-user-avatar';

export function ErpTitleActions({ centered = false }: { centered?: boolean }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const userName = session?.user?.name || 'Usuario';
  const userEmail = session?.user?.email || '';
  const userImage = session?.user?.image || null;
  const userRole = session?.user?.role || 'user';
  const companyName = session?.user?.companyName || null;

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
      {/* Cuando centered=true el buscador crece al centro; sino es solo el grupo derecho */}
      <div className={`flex items-center gap-1 ${centered ? 'flex-1 justify-center' : 'shrink-0'}`}>
        {/* Buscador global — centrado si centered=true */}
        <button
          type="button"
          onClick={() => setShowCommandPalette(true)}
          className={`erp-titlebar-btn hidden sm:flex items-center gap-2 px-3 h-7 border border-white/30 bg-white/10 hover:bg-white/20 transition-colors ${
            centered
              ? 'w-full max-w-[480px] xl:max-w-[600px]'
              : 'min-w-[220px] xl:min-w-[300px]'
          }`}
          title="Buscar clientes, facturas, productos... (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 shrink-0 opacity-80" />
          <span className="text-[11px] opacity-70 truncate flex-1 text-left">Clientes, facturas, productos…</span>
          <kbd className="hidden lg:inline-flex items-center px-1 py-0 text-[9px] font-mono bg-white/15 border border-white/25 leading-tight text-white/60">Ctrl+K</kbd>
        </button>

        {/* Separador visual cuando está centrado */}
        {centered && <div className="hidden sm:block w-px h-5 bg-white/20 mx-1" />}

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
            aria-expanded={userMenuOpen}
            aria-haspopup="true"
          >
            <ErpUserAvatar name={userName} image={userImage} size="sm" />
            <ChevronDown className={`w-3 h-3 hidden sm:block transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-[#b8c9dc] shadow-lg z-[110] text-[#1a3a5c]">
              <div className="px-3 py-3 border-b border-[#b8c9dc] bg-[#eef3f9] flex items-center gap-3">
                <ErpUserAvatar name={userName} image={userImage} size="md" className="border-[#9bb3cc] [&>span]:bg-[#2563ad] [&>span]:text-white" />
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{userName}</p>
                  <p className="text-[10px] text-[#5c7291] truncate">{userEmail}</p>
                  {userRole === 'superadmin' && (
                    <p className="text-[10px] text-purple-700 font-bold mt-1 flex items-center gap-1">
                      <Crown className="w-3 h-3" /> Super Admin
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => { router.push('/configuracion/perfil'); setUserMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-[#eef3f9]"
              >
                <User className="w-3.5 h-3.5" /> Mi perfil y avatar
              </button>
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
