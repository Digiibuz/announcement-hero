
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { AlertTriangle, Settings } from 'lucide-react';
import { useMaintenanceSettings } from '@/hooks/useMaintenanceSettings';
import { format } from 'date-fns';

const MaintenanceManager = () => {
  const { settings, isLoading, saveSettings, isMaintenanceActive } = useMaintenanceSettings();
  const [formData, setFormData] = useState({
    message: settings.message || '',
    isMaintenanceMode: settings.isMaintenanceMode,
    maintenanceStart: settings.maintenanceStart ? 
      format(new Date(settings.maintenanceStart), "yyyy-MM-dd'T'HH:mm") : '',
    maintenanceEnd: settings.maintenanceEnd ? 
      format(new Date(settings.maintenanceEnd), "yyyy-MM-dd'T'HH:mm") : '',
  });

  React.useEffect(() => {
    setFormData({
      message: settings.message || '',
      isMaintenanceMode: settings.isMaintenanceMode,
      maintenanceStart: settings.maintenanceStart ? 
        format(new Date(settings.maintenanceStart), "yyyy-MM-dd'T'HH:mm") : '',
      maintenanceEnd: settings.maintenanceEnd ? 
        format(new Date(settings.maintenanceEnd), "yyyy-MM-dd'T'HH:mm") : '',
    });
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await saveSettings({
      message: formData.message || null,
      isMaintenanceMode: formData.isMaintenanceMode,
      maintenanceStart: formData.maintenanceStart || null,
      maintenanceEnd: formData.maintenanceEnd || null,
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Gestion de la maintenance
        </CardTitle>
        {isMaintenanceActive && (
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-2 rounded-md">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Mode maintenance actif</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="message">Message d'information</Label>
            <Textarea
              id="message"
              placeholder="Ex: L'application ne sera pas disponible du 15/01 à 10h00 au 15/01 à 14h00 pour maintenance"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              rows={3}
            />
            <p className="text-sm text-muted-foreground">
              Ce message sera affiché sur la page de connexion
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="maintenance-mode"
              checked={formData.isMaintenanceMode}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, isMaintenanceMode: checked }))
              }
            />
            <Label htmlFor="maintenance-mode">
              Activer le mode maintenance (bloquer les connexions)
            </Label>
          </div>

          {formData.isMaintenanceMode && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="space-y-2">
                <Label htmlFor="start-date">Date et heure de début</Label>
                <Input
                  id="start-date"
                  type="datetime-local"
                  value={formData.maintenanceStart}
                  onChange={(e) => setFormData(prev => ({ ...prev, maintenanceStart: e.target.value }))}
                  required={formData.isMaintenanceMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">Date et heure de fin</Label>
                <Input
                  id="end-date"
                  type="datetime-local"
                  value={formData.maintenanceEnd}
                  onChange={(e) => setFormData(prev => ({ ...prev, maintenanceEnd: e.target.value }))}
                  required={formData.isMaintenanceMode}
                />
              </div>
            </div>
          )}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Sauvegarde...' : 'Sauvegarder les paramètres'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default MaintenanceManager;
