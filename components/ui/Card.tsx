import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
}

export function Card({ children, className = '', onClick, selected = false }: CardProps) {
  return (
    <div
      className={`
        bg-white rounded-xl p-6 shadow-md
        ${onClick ? 'cursor-pointer hover:shadow-lg transition-all duration-200' : ''}
        ${selected ? 'ring-2 ring-primary-500 shadow-lg' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
