import React from 'react';
import { cn } from '@/lib/utils';
import { Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
}

const icons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
};

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, children, variant = 'info', title, ...props }, ref) => {
    const Icon = icons[variant];

    const variantClasses = {
      info: 'alert-info',
      success: 'alert-success',
      warning: 'alert-warning',
      error: 'alert-error',
    };

    return (
      <div
        ref={ref}
        className={cn('alert', variantClasses[variant], className)}
        {...props}
      >
        <div className="flex items-start gap-3">
          <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            {title && <h4 className="font-semibold mb-1">{title}</h4>}
            <div>{children}</div>
          </div>
        </div>
      </div>
    );
  }
);

Alert.displayName = 'Alert';
