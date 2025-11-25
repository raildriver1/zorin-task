import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'light' | 'outline-light';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const MemberButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    const baseClass = 'btn';

    const variantClasses = {
      default: '',
      outline: 'btn-outline',
      light: 'btn-light',
      'outline-light': 'btn-outline-light',
    };

    const sizeClasses = {
      sm: 'text-sm px-4 py-2',
      md: 'text-base px-7 py-3.5',
      lg: 'text-lg px-8 py-4',
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseClass,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

MemberButton.displayName = 'MemberButton';
