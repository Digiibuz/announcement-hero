
import React from 'react';
import { Wifi, WifiOff, AlertTriangle, Check } from 'lucide-react';

interface NetworkIconProps {
  isOnline: boolean;
  quality: 'slow' | 'medium' | 'fast';
}

export function NetworkIcon({ isOnline, quality }: NetworkIconProps) {
  if (!isOnline) return <WifiOff className="h-4 w-4" />;
  
  if (quality === 'slow') {
    return <AlertTriangle className="h-4 w-4" />;
  } else if (quality === 'medium') {
    return <Wifi className="h-4 w-4" />;
  } else {
    return <Check className="h-4 w-4" />;
  }
}
