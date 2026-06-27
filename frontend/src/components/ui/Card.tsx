import { clsx } from 'clsx';
import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={clsx('rounded-xl border border-gray-200 bg-white shadow-sm', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, ...props }: CardProps) {
  return (
    <div className={clsx('border-b border-gray-200 px-6 py-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardBody({ children, className, ...props }: CardProps) {
  return (
    <div className={clsx('px-6 py-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className, ...props }: CardProps) {
  return (
    <div className={clsx('border-t border-gray-200 px-6 py-4', className)} {...props}>
      {children}
    </div>
  );
}
