
import React, { useState } from 'react';
import PageLayout from '@/components/ui/layout/PageLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NotificationSender from '@/components/notifications/admin/NotificationSender';
import NotificationTemplates from '@/components/notifications/admin/NotificationTemplates';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';

const NotificationAdminPage = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('send');

  // Si l'utilisateur n'est pas administrateur, on le redirige
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <PageLayout title="Gestion des notifications">
      <div className="max-w-4xl mx-auto space-y-6">
        <p className="text-muted-foreground mb-6">
          Gérez et envoyez des notifications aux utilisateurs de l'application
        </p>

        <Tabs defaultValue="send" onValueChange={setActiveTab} value={activeTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="send">Envoyer des notifications</TabsTrigger>
            <TabsTrigger value="templates">Modèles de notifications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="send">
            <NotificationSender />
          </TabsContent>
          
          <TabsContent value="templates">
            <NotificationTemplates />
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default NotificationAdminPage;
