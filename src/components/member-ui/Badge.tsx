import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, children, variant = 'default', ...props }, ref) => {
    const variantClasses = {
      default: 'badge',
      success: 'badge bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
      warning: 'badge bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
      error: 'badge bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    };

    return (
      <span
        ref={ref}
        className={cn(variantClasses[variant], className)}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
