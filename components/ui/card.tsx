import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  className = '',
}) => {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all ${className}`}
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
