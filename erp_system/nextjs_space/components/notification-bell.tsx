'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, AlertTriangle, AlertCircle, Info, X, Package, Receipt, Wallet, ShoppingCart, ChevronRight } from 'lucide-react';

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  category: string;
  title: string;
  message: string;
  href?: string;
  timestamp: string;
}

interface AlertCounts {
  total: number;
  critical: number;
  warning: number;
  info: number;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  stock: Package,
  facturacion: Receipt,
  cuentas: Wallet,
  ventas: ShoppingCart,
};

const TYPE_STYLES = {
  critical: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: AlertCircle,
    iconColor: 'text-red-500',
    dot: 'bg-red-500',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
    dot: 'bg-amber-500',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: Info,
    iconColor: 'text-blue-500',
    dot: 'bg-blue-500',
  },
};

export function NotificationBell({ collapsed = false, position = 'sidebar' }: { collapsed?: boolean; position?: 'sidebar' | 'header' }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [counts, setCounts] = useState<AlertCounts>({ total: 0, critical: 0, warning: 0, info: 0 });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/notifications/alerts');
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
        setCounts(data.counts || { total: 0, critical: 0, warning: 0, info: 0 });
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and every 5 minutes
  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleAlertClick = (alert: Alert) => {
    if (alert.href) {
      router.push(alert.href);
      setOpen(false);
    }
  };

  const actionableCount = counts.critical + counts.warning;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => { setOpen(!open); if (!open) fetchAlerts(); }}
        className={`relative p-2 rounded-lg transition-colors ${
          open ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
        }`}
        title="Notificaciones"
      >
        <Bell className="w-5 h-5" />
        {actionableCount > 0 && (
          <span className={`absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold text-white rounded-full px-1 ${
            counts.critical > 0 ? 'bg-red-500 animate-pulse' : 'bg-amber-500'
          }`}>
            {actionableCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className={`absolute z-50 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden ${
          position === 'header'
            ? 'right-0 top-full mt-2'
            : collapsed ? 'left-12 top-0' : 'left-0 bottom-full mb-2'
        }`} style={{ width: '340px' }}>
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-white border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Notificaciones</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {actionableCount > 0
                  ? `${actionableCount} alerta${actionableCount > 1 ? 's' : ''} activa${actionableCount > 1 ? 's' : ''}`
                  : 'Todo en orden ✅'}
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Alerts List */}
          <div className="max-h-[360px] overflow-y-auto">
            {loading && alerts.length === 0 && (
              <div className="p-6 text-center">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            )}

            {!loading && alerts.length === 0 && (
              <div className="p-8 text-center">
                <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No hay alertas</p>
              </div>
            )}

            {alerts.map((alert) => {
              const style = TYPE_STYLES[alert.type];
              const CategoryIcon = CATEGORY_ICONS[alert.category] || Info;
              return (
                <button
                  key={alert.id}
                  onClick={() => handleAlertClick(alert)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 border-b border-slate-50 last:border-b-0`}
                >
                  <div className={`p-1.5 rounded-lg ${style.bg} flex-shrink-0 mt-0.5`}>
                    <CategoryIcon className={`w-4 h-4 ${style.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${style.dot} flex-shrink-0`} />
                      <p className="text-sm font-medium text-slate-900 truncate">{alert.title}</p>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{alert.message}</p>
                  </div>
                  {alert.href && (
                    <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-1" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 text-center">Actualizado automáticamente cada 5 min</p>
          </div>
        </div>
      )}
    </div>
  );
}
