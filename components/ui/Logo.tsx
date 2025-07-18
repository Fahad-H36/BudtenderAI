import React from 'react';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ 
  className = "", 
  width = 40, 
  height = 40, 
  priority = false 
}) => {
  return (
    <Image
      src="/budtender_logo.svg"
      alt="BudtenderAI Logo"
      width={width}
      height={height}
      className={className}
      priority={priority}
    />
  );
};

export default Logo; 