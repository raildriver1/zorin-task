import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
}

export const MemberCard = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, hover = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'card',
          hover && 'hover-lift',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

MemberCard.displayName = 'MemberCard';

interface IconContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const IconContainer = React.forwardRef<HTMLDivElement, IconContainerProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('icon-container', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

IconContainer.displayName = 'IconContainer';
