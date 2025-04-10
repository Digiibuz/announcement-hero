
import React from 'react';
import Header from './Header';
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
    <div className={className}>
      <div className="fixed top-0 left-0 right-0 z-40 bg-background/70 backdrop-blur-xl border-b border-border">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {children}
            
            <div className="ml-auto flex items-center gap-2">
              <NetworkStatus 
                className="hidden md:flex" 
                showDetailedInfo={true}
                onRetry={() => window.location.reload()}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
