
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AlertCircle, Info, Clock, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Notification, useNotifications } from '@/hooks/useNotifications';
import { LoadingIndicator } from '@/components/ui/loading-indicator';

interface NotificationsListProps {
  notifications: Notification[];
  isLoading: boolean;
  showEmpty?: boolean;
}

const NotificationsList: React.FC<NotificationsListProps> = ({ 
  notifications, 
  isLoading, 
  showEmpty = true 
}) => {
  const { markAsRead } = useNotifications();

  // Rendu des icônes selon le type de notification
  const renderIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'reminder':
        return <Clock className="h-5 w-5 text-amber-500" />;
      default:
        return <Info className="h-5 w-5 text-muted-foreground" />;
    }
  };

  // Formatage de la date en format relatif (ex: "il y a 2 heures")
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true,
        locale: fr 
      });
    } catch (e) {
      return 'Date invalide';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingIndicator variant="dots" size={32} />
      </div>
    );
  }

  if (notifications.length === 0 && showEmpty) {
    return (
      <div className="text-center py-6 px-4 text-muted-foreground">
        <div className="flex justify-center mb-2">
          <Check className="h-10 w-10 text-green-500" />
        </div>
        <p>Vous n'avez aucune notification</p>
      </div>
    );
  }

  return (
    <div>
      {notifications.map(notification => (
        <div 
          key={notification.id} 
          className={`p-4 border-b last:border-0 ${!notification.is_read ? 'bg-accent/40' : ''}`}
        >
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              {renderIcon(notification.type)}
            </div>
            <div className="flex-1">
              <h5 className="text-sm font-medium mb-1">{notification.title}</h5>
              <p className="text-sm text-muted-foreground mb-2">{notification.content}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{formatDate(notification.created_at)}</span>
                {!notification.is_read && (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-6 px-2 text-xs" 
                    onClick={() => markAsRead(notification.id)}
                  >
                    Marquer comme lu
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationsList;
