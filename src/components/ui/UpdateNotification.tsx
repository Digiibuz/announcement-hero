
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, X } from 'lucide-react';
import AnimatedContainer from './AnimatedContainer';

interface UpdateNotificationProps {
  onUpdate: () => void;
  onDismiss: () => void;
}

const UpdateNotification = ({ onUpdate, onDismiss }: UpdateNotificationProps) => {
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <AnimatedContainer direction="up">
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-5 w-5 text-white" />
                <div>
                  <p className="font-semibold text-sm">Mise à jour disponible</p>
                  <p className="text-xs text-blue-100">
                    Une nouvelle version de l'application est prête
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onUpdate}
                  className="bg-white text-blue-600 hover:bg-gray-100 text-xs px-3 py-1"
                >
                  Actualiser
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                  className="text-white hover:bg-white/20 p-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </AnimatedContainer>
    </div>
  );
};

export default UpdateNotification;
