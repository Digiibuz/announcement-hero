
import React from 'react';
import { Header } from './Header';
import { NetworkStatus } from '../network-status';

interface NetworkAwareHeaderProps {
  className?: string;
  children?: React.ReactNode;
}

export const NetworkAwareHeader = ({ 
  className,
  children,
  ...props
}: NetworkAwareHeaderProps) => {
  return (
    <Header className={className} {...props}>
      {children}
      
      <div className="ml-auto flex items-center gap-2">
        <NetworkStatus 
          className="hidden md:flex" 
          showDetailedInfo={true}
          onRetry={() => window.location.reload()}
        />
      </div>
    </Header>
  );
};
