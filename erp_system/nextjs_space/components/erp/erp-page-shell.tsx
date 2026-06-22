'use client';

import { ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { ErpAppChrome } from './erp-app-chrome';

export interface ErpToolbarItem {
  label: string;
  icon: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
}

interface ErpPageShellProps {
  title: string;
  subtitle?: string;
  module?: string;
  statusText?: string;
  userRole?: string;
  toolbar?: ErpToolbarItem[];
  toolbarExtra?: ReactNode;
  header?: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  children: ReactNode;
  statusExtra?: ReactNode;
}

export function ErpPageShell({
  title,
  subtitle,
  module = 'INICIO',
  statusText = 'Listo',
  userRole = 'ADMIN',
  toolbar,
  toolbarExtra,
  header,
  onRefresh,
  refreshing,
  children,
  statusExtra,
}: ErpPageShellProps) {
  const toolbarNode = (toolbar?.length || toolbarExtra) ? (
    <>
      {toolbar?.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={item.onClick}
          disabled={item.disabled || !item.onClick}
          className={`erp-toolbtn flex flex-col items-center gap-0.5 min-w-[52px] px-1 py-1 disabled:opacity-40 ${
            item.active ? 'bg-white border-[#9bb3cc]' : ''
          }`}
        >
          {item.icon}
          <span className="text-[10px] text-[#1a3a5c]">{item.label}</span>
        </button>
      ))}
      {toolbarExtra}
    </>
  ) : undefined;

  const menubarExtra = onRefresh ? (
    <button
      type="button"
      onClick={onRefresh}
      disabled={refreshing}
      className="erp-toolbtn flex items-center gap-1 px-2 py-0.5 text-[11px] disabled:opacity-50"
    >
      <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
      Actualizar
    </button>
  ) : undefined;

  return (
    <ErpAppChrome
      title={title}
      subtitle={subtitle}
      module={module}
      statusText={statusText}
      userRole={userRole}
      menubarExtra={menubarExtra}
      toolbar={toolbarNode}
      header={header}
      statusExtra={statusExtra}
    >
      {children}
    </ErpAppChrome>
  );
}

export function ErpPanel({
  title,
  children,
  action,
  className = '',
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`erp-panel ${className}`}>
      <div className="erp-panel-header flex items-center justify-between">
        <span>{title}</span>
        {action}
      </div>
      <div className="p-2">{children}</div>
    </div>
  );
}

export function ErpKpiBox({
  label,
  value,
  hint,
  accent = 'default',
  onClick,
}: {
  label: string;
  value: string | number;
  hint?: ReactNode;
  accent?: 'default' | 'primary' | 'warning' | 'success';
  onClick?: () => void;
}) {
  const accentClass =
    accent === 'primary'
      ? 'erp-kpi-primary'
      : accent === 'warning'
        ? 'erp-kpi-warning'
        : accent === 'success'
          ? 'erp-kpi-success'
          : '';

  return (
    <div
      className={`erp-kpi ${accentClass} ${onClick ? 'cursor-pointer hover:border-[#2563ad]' : ''}`}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <p className="erp-kpi-label">{label}</p>
      <p className="erp-kpi-value">{value}</p>
      {hint && <div className="mt-1">{hint}</div>}
    </div>
  );
}
