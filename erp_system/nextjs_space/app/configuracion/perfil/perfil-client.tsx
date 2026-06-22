'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { User, Upload, Trash2, Save, ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { ErpPageShell } from '@/components/erp/erp-page-shell';
import { useErpSession } from '@/components/erp/use-erp-session';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function PerfilClient() {
  const { userRole } = useErpSession();
  const { data: session, update } = useSession();
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    fetch('/api/user/profile')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setName(data.name || '');
        setEmail(data.email || '');
        setImage(data.image || null);
        setImageUrl(data.image && !data.image.startsWith('data:') ? data.image : '');
      })
      .catch((e) => toast.error(e.message || 'Error al cargar perfil'))
      .finally(() => setLoading(false));
  }, []);

  const displayImage = imageUrl.trim() || image;
  const initials = (name || session?.user?.name || 'U').charAt(0).toUpperCase();

  const handleFile = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Seleccioná un archivo de imagen (PNG, JPG, WEBP)');
      return;
    }
    if (file.size > 350_000) {
      toast.error('La imagen debe pesar menos de 350 KB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImage(result);
      setImageUrl('');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: { name: string; image: string | null } = {
        name: name.trim(),
        image: imageUrl.trim() || image,
      };
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar');

      setImage(data.image || null);
      await update({ name: data.name, image: data.image });
      toast.success('Perfil actualizado');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const clearImage = () => {
    setImage(null);
    setImageUrl('');
    if (fileRef.current) fileRef.current.value = '';
  };

  if (loading) {
    return (
      <ErpPageShell title="Mi Perfil" module="CONFIGURACIÓN" userRole={userRole}>
        <div className="skeleton-shimmer h-64 erp-panel" />
      </ErpPageShell>
    );
  }

  return (
    <ErpPageShell
      title="Mi Perfil"
      subtitle="Personalizá tu nombre y avatar en el sistema"
      module="CONFIGURACIÓN"
      userRole={userRole}
    >
      <div className="max-w-xl space-y-4">
        <div className="erp-panel p-5 space-y-5">
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20 border-2 border-[#9bb3cc] rounded-none">
              {displayImage ? <AvatarImage src={displayImage} alt={name} className="object-cover" /> : null}
              <AvatarFallback className="rounded-none bg-[#2563ad] text-white text-2xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <p className="text-sm font-semibold text-[#1a3a5c]">Foto de perfil</p>
              <p className="text-xs text-[#5c7291]">
                Subí una imagen o pegá una URL. Se muestra en la barra superior y menú de usuario.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="erp-btn-secondary flex items-center gap-1.5 text-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Subir imagen
                </button>
                {(displayImage) && (
                  <button type="button" onClick={clearImage} className="erp-btn-secondary flex items-center gap-1.5 text-xs text-red-700">
                    <Trash2 className="w-3.5 h-3.5" />
                    Quitar
                  </button>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1a3a5c] mb-1">URL de imagen (opcional)</label>
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#5c7291] shrink-0" />
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  if (e.target.value.trim()) setImage(null);
                }}
                placeholder="https://..."
                className="premium-input flex-1 w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1a3a5c] mb-1">Nombre visible</label>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#5c7291] shrink-0" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="premium-input flex-1 w-full"
                maxLength={120}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1a3a5c] mb-1">Email</label>
            <input type="email" value={email} disabled className="premium-input w-full opacity-60 cursor-not-allowed" />
            <p className="text-[10px] text-[#5c7291] mt-1">El email no se puede cambiar desde aquí.</p>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="erp-btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </ErpPageShell>
  );
}
