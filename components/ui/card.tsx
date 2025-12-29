import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  className = '',
  onClick,
}) => {
  const isClickable = !!onClick;
  
  return (
    <div
      className={`
        bg-white rounded-xl border border-gray-200 p-6 shadow-sm
        transition-all duration-200 ease-out
        hover:shadow-lg hover:scale-[1.02] hover:border-gray-300
        ${isClickable ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      } : undefined}
    >
      {title && (
        <h3 className="text-xl font-semibold text-[#374151] mb-4">
          {title}
        </h3>
      )}
      <div className="text-[#374151]">
        {children}
      </div>
    </div>
  );
};

export default Card;
