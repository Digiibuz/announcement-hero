
import React from 'react';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationsList from './NotificationsList';

const NotificationIcon = () => {
  const { unreadCount, notifications, markAllAsRead, isLoading } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-medium">Notifications</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Tout marquer comme lu
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          <NotificationsList notifications={notifications} isLoading={isLoading} />
        </div>
        <div className="p-4 border-t text-center">
          <Button 
            variant="link" 
            className="text-sm text-muted-foreground"
            size="sm"
            asChild
          >
            <a href="/notifications">Voir toutes les notifications</a>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationIcon;
