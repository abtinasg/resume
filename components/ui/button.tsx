import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  onClick,
  disabled = false,
  type = 'button',
  className = '',
}) => {
  const baseStyles = 'group relative px-6 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base';

  const variantStyles = {
    primary: `
      bg-gradient-to-r from-blue-500 to-indigo-500 text-white
      shadow-lg shadow-blue-100
      hover:shadow-xl hover:shadow-blue-200
      hover:scale-[1.02] hover:-translate-y-0.5
      active:scale-[0.98] active:translate-y-0
      overflow-hidden
    `,
    secondary: `
      bg-white text-gray-700 border-2 border-gray-200
      shadow-sm
      hover:shadow-md hover:border-blue-300 hover:text-blue-500
      hover:scale-[1.02] hover:-translate-y-0.5
      active:scale-[0.98] active:translate-y-0
    `,
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      {variant === 'primary' && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
};

export default Button;
