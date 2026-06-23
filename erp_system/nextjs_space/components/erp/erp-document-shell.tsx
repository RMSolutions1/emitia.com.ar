'use client';

import { ReactNode } from 'react';
import {
  FilePlus2,
  Trash2,
  Search,
  Printer,
  Save,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { ErpAppChrome } from './erp-app-chrome';

interface ErpToolbarAction {
  label: string;
  icon: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  shortcut?: string;
}

interface ErpDocumentShellProps {
  title: string;
  subtitle?: string;
  module?: string;
  userRole?: string;
  statusText?: string;
  onNew?: () => void;
  onSave?: () => void;
  onDelete?: () => void;
  onPrint?: () => void;
  onSearch?: () => void;
  onCancel?: () => void;
  saveLabel?: string;
  saveDisabled?: boolean;
  saveLoading?: boolean;
  header: ReactNode;
  children: ReactNode;
  observations?: ReactNode;
  footerExtra?: ReactNode;
}

export function ErpDocumentShell({
  title,
  subtitle,
  module = 'FACTURACIÓN',
  userRole = 'ADMIN',
  statusText = 'Listo',
  onNew,
  onSave,
  onDelete,
  onPrint,
  onSearch,
  onCancel,
  saveLabel = 'Aceptar',
  saveDisabled,
  saveLoading,
  header,
  children,
  observations,
  footerExtra,
}: ErpDocumentShellProps) {
  const { data: session } = useSession();
  const companyName = (session?.user as any)?.companyName || 'Gestión Comercial';

  const toolbarActions: ErpToolbarAction[] = [
    { label: 'Nuevo', icon: <FilePlus2 className="w-4 h-4" />, onClick: onNew, shortcut: 'Ctrl+N' },
    { label: 'Guardar', icon: <Save className="w-4 h-4" />, onClick: onSave, disabled: saveDisabled || saveLoading, shortcut: 'Ctrl+G' },
    { label: 'Eliminar', icon: <Trash2 className="w-4 h-4" />, onClick: onDelete, shortcut: 'Ctrl+E' },
    { label: 'Buscar', icon: <Search className="w-4 h-4" />, onClick: onSearch, shortcut: 'Ctrl+B' },
    { label: 'Imprimir', icon: <Printer className="w-4 h-4" />, onClick: onPrint, shortcut: 'Ctrl+I' },
  ].filter((a) => !!a.onClick);

  const toolbar = (
    <>
      {toolbarActions.map((action) => (
        <button
          key={action.label}
          type="button"
          title={action.shortcut ? `${action.label} (${action.shortcut})` : action.label}
          onClick={action.onClick}
          disabled={action.disabled || !action.onClick}
          className="erp-toolbtn flex flex-col items-center gap-0.5 min-w-[52px] px-1 py-1 disabled:opacity-40"
        >
          {action.icon}
          <span className="text-[10px] text-[#1a3a5c]">{action.label}</span>
        </button>
      ))}
    </>
  );

  const footer = (
    <>
      {observations && (
        <div className="erp-observations border-t border-[#b8c9dc] bg-[#eef3f9] p-2 shrink-0">
          <label className="text-[11px] font-bold text-[#1a3a5c] uppercase tracking-wide">Observaciones</label>
          <div className="mt-1">{observations}</div>
        </div>
      )}
      <div className="erp-actions flex items-center justify-between px-4 py-2 bg-[#eef3f9] border-t border-[#b8c9dc] shrink-0">
        <div className="flex items-center gap-2 text-xs text-[#5c7291]">
          <div className="w-7 h-7 bg-[#2563ad] border border-[#1e4d8c] text-white flex items-center justify-center font-bold text-xs">
            {companyName.charAt(0).toUpperCase()}
          </div>
          <span className="truncate max-w-[200px]">{companyName}</span>
        </div>
        <div className="flex items-center gap-2">
          {footerExtra}
          <button type="button" onClick={onCancel} className="erp-btn-secondary min-w-[100px]">
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saveDisabled || saveLoading}
            className="erp-btn-primary min-w-[100px]"
          >
            {saveLoading ? 'Procesando…' : saveLabel}
          </button>
        </div>
      </div>
    </>
  );

  return (
    <ErpAppChrome
      title={title}
      subtitle={subtitle}
      module={module}
      statusText={statusText}
      userRole={userRole}
      toolbar={toolbar}
      header={header}
      footer={footer}
    >
      {children}
    </ErpAppChrome>
  );
}

export function ErpFieldRow({
  label,
  codeWidth = 'w-24',
  children,
  code,
  description,
  onCodeChange,
  onSearch,
}: {
  label: string;
  codeWidth?: string;
  children?: ReactNode;
  code?: string;
  description?: string;
  onCodeChange?: (v: string) => void;
  onSearch?: () => void;
}) {
  if (children) {
    return (
      <div className="erp-field-row grid grid-cols-[140px_1fr] items-center gap-2 mb-1.5">
        <label className="text-[11px] font-semibold text-[#1a3a5c] text-right pr-2">{label}</label>
        <div>{children}</div>
      </div>
    );
  }

  return (
    <div className="erp-field-row grid grid-cols-[140px_auto_1fr_auto] items-center gap-1 mb-1.5">
      <label className="text-[11px] font-semibold text-[#1a3a5c] text-right pr-2">{label}</label>
      <input
        type="text"
        value={code || ''}
        onChange={(e) => onCodeChange?.(e.target.value)}
        className={`erp-input ${codeWidth}`}
      />
      <input type="text" value={description || ''} readOnly className="erp-input flex-1 bg-white/70" />
      {onSearch && (
        <button type="button" onClick={onSearch} className="erp-toolbtn p-1" title="Buscar">
          <Search className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
