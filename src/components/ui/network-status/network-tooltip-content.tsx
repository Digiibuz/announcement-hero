
import React from 'react';

interface NetworkTooltipContentProps {
  isOnline: boolean;
  networkType: string;
  downlink: number;
  rtt: number;
  quality: 'slow' | 'medium' | 'fast';
}

export function NetworkTooltipContent({
  isOnline,
  networkType,
  downlink,
  rtt,
  quality
}: NetworkTooltipContentProps) {
  if (isOnline) {
    return (
      <div className="text-xs">
        <p className="font-medium">{networkType}</p>
        {downlink > 0 && (
          <p>Débit: {downlink.toFixed(1)} Mbps</p>
        )}
        {rtt > 0 && (
          <p>Latence: {rtt} ms</p>
        )}
        <p className="mt-1 text-xs opacity-80">
          Qualité de connexion: {
            quality === 'slow' ? 'Faible' :
            quality === 'medium' ? 'Moyenne' : 'Bonne'
          }
        </p>
      </div>
    );
  } 
  
  return (
    <div className="text-xs">
      <p>Vous êtes actuellement hors ligne.</p>
      <p className="mt-1">Les fonctionnalités sont limitées.</p>
    </div>
  );
}
