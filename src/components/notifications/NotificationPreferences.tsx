
import React from 'react';
import { AlertCircle, Info, Clock } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NotificationPreferences, useNotifications } from '@/hooks/useNotifications';

const NotificationPreferencesComponent = () => {
  const { preferences, updatePreferences } = useNotifications();

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean) => {
    updatePreferences({
      ...preferences,
      [key]: value
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Préférences de notifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Info className="h-5 w-5 text-blue-500" />
            <Label htmlFor="info-notifications">Notifications d'information</Label>
          </div>
          <Switch
            id="info-notifications"
            checked={preferences.info_enabled}
            onCheckedChange={(checked) => handlePreferenceChange('info_enabled', checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <Label htmlFor="alert-notifications">Alertes importantes</Label>
          </div>
          <Switch
            id="alert-notifications"
            checked={preferences.alert_enabled}
            onCheckedChange={(checked) => handlePreferenceChange('alert_enabled', checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-amber-500" />
            <Label htmlFor="reminder-notifications">Rappels</Label>
          </div>
          <Switch
            id="reminder-notifications"
            checked={preferences.reminder_enabled}
            onCheckedChange={(checked) => handlePreferenceChange('reminder_enabled', checked)}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationPreferencesComponent;
