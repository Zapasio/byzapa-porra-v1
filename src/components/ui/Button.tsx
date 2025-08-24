// src/components/ui/Button.tsx
import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import './Button.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'gradient';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const { theme } = useTheme();

  const baseClasses = 'btn btn-base';
  const variantClasses = `btn-${variant}`;
  const sizeClasses = `btn-${size}`;
  const loadingClasses = isLoading ? 'btn-loading' : '';
  const disabledClasses = (disabled || isLoading) ? 'btn-disabled' : '';

  const classes = `${baseClasses} ${variantClasses} ${sizeClasses} ${loadingClasses} ${disabledClasses} ${className}`.trim();

  return (
    <button
      className={classes}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <div className="btn-spinner">
          <div className="spinner"></div>
        </div>
      )}
      {leftIcon && !isLoading && (
        <span className="btn-icon btn-icon-left">{leftIcon}</span>
      )}
      <span className={`btn-content ${isLoading ? 'btn-content-loading' : ''}`}>
        {children}
      </span>
      {rightIcon && !isLoading && (
        <span className="btn-icon btn-icon-right">{rightIcon}</span>
      )}
    </button>
  );
};