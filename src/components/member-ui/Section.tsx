import React from 'react';
import { cn } from '@/lib/utils';

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  gap?: boolean;
}

export const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ className, children, gap = true, ...props }, ref) => {
    return (
      <section
        ref={ref}
        className={cn(gap && 'section-gap', className)}
        {...props}
      >
        {children}
      </section>
    );
  }
);

Section.displayName = 'Section';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('container', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Container.displayName = 'Container';

interface SectionTitleProps {
  title: string | React.ReactNode;
  description?: string;
  className?: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ title, description, className }) => {
  return (
    <div className={cn('section-title', className)}>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
};

SectionTitle.displayName = 'SectionTitle';
