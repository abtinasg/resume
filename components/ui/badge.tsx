import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'high' | 'medium' | 'low' | 'content' | 'format' | 'ats';
  className?: string;
  onClick?: () => void;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
  onClick,
}) => {
  const variantStyles = {
    default: 'bg-gray-100 text-gray-700',
    high: 'bg-red-50 text-red-700 border border-red-200',
    medium: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    low: 'bg-green-50 text-green-700 border border-green-200',
    content: 'bg-blue-50 text-blue-700 border border-blue-200',
    format: 'bg-purple-50 text-purple-700 border border-purple-200',
    ats: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  };

  const Component = onClick ? 'button' : 'span';

  return (
    <Component
      onClick={onClick}
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </Component>
  );
};

export default Badge;
