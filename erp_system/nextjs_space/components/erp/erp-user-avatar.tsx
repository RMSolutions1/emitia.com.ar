'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ErpUserAvatarProps {
  name: string;
  image?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'h-6 w-6 text-[11px] rounded-none',
  md: 'h-8 w-8 text-xs rounded-none',
  lg: 'h-10 w-10 text-sm rounded-none',
};

export function ErpUserAvatar({ name, image, size = 'sm', className = '' }: ErpUserAvatarProps) {
  const initials = (name || 'U').charAt(0).toUpperCase();
  return (
    <Avatar className={`${sizeMap[size]} border border-white/30 shrink-0 ${className}`}>
      {image ? <AvatarImage src={image} alt={name} className="object-cover" /> : null}
      <AvatarFallback className="rounded-none bg-white/20 text-white font-bold">{initials}</AvatarFallback>
    </Avatar>
  );
}
