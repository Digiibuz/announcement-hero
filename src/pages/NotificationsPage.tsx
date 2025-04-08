
import React from 'react';
import PageLayout from '@/components/ui/layout/PageLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import NotificationsList from '@/components/notifications/NotificationsList';
import NotificationPreferences from '@/components/notifications/NotificationPreferences';
import { useAuth } from '@/context/AuthContext';
import AnimatedContainer from '@/components/ui/AnimatedContainer';

const NotificationsPage = () => {
  const { notifications, isLoading, markAllAsRead, unreadCount } = useNotifications();
  const { isClient } = useAuth();
  
  // Filtrer les notifications par statut (lues/non lues)
  const unreadNotifications = notifications.filter(
    (notification: Notification) => !notification.is_read
  );
  
  const readNotifications = notifications.filter(
    (notification: Notification) => notification.is_read
  );

  return (
    <PageLayout title="Notifications">
      <AnimatedContainer delay={200}>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-muted-foreground">
              Gérez vos notifications{!isClient && " et préférences"}
            </p>
            {unreadCount > 0 && (
              <Button onClick={markAllAsRead} variant="outline">
                Tout marquer comme lu
              </Button>
            )}
          </div>

          <div className={`grid ${!isClient ? 'md:grid-cols-3' : ''} gap-6`}>
            <div className={`${!isClient ? 'md:col-span-2' : ''}`}>
              <Tabs defaultValue="unread">
                <TabsList className="mb-4">
                  <TabsTrigger value="unread">
                    Non lues {unreadCount > 0 && `(${unreadCount})`}
                  </TabsTrigger>
                  <TabsTrigger value="read">Lues</TabsTrigger>
                  <TabsTrigger value="all">Toutes</TabsTrigger>
                </TabsList>
                
                <Card>
                  <CardContent className="p-0">
                    <TabsContent value="unread" className="m-0">
                      <NotificationsList 
                        notifications={unreadNotifications}
                        isLoading={isLoading}
                      />
                    </TabsContent>
                    
                    <TabsContent value="read" className="m-0">
                      <NotificationsList 
                        notifications={readNotifications}
                        isLoading={isLoading}
                      />
                    </TabsContent>
                    
                    <TabsContent value="all" className="m-0">
                      <NotificationsList 
                        notifications={notifications}
                        isLoading={isLoading}
                      />
                    </TabsContent>
                  </CardContent>
                </Card>
              </Tabs>
            </div>
            
            {!isClient && (
              <div>
                <NotificationPreferences />
              </div>
            )}
          </div>
        </div>
      </AnimatedContainer>
    </PageLayout>
  );
};

export default NotificationsPage;
