import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-blue-50 text-blue-700 border-blue-100',
        secondary:
          'border-transparent bg-slate-50 text-slate-600 border-slate-100',
        destructive:
          'border-transparent bg-red-50 text-red-700 border-red-100',
        outline: 'text-foreground border-slate-200',
        success: 'border-transparent bg-emerald-50 text-emerald-700 border-emerald-100',
        warning: 'border-transparent bg-amber-50 text-amber-700 border-amber-100',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
