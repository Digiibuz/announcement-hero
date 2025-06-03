
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Save } from 'lucide-react';
import { useVersionManager } from '@/hooks/useVersionManager';
import { toast } from 'sonner';

const VersionManager = () => {
  const { version, updateVersion } = useVersionManager();
  const [newVersion, setNewVersion] = useState(version);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    
    try {
      updateVersion(newVersion);
      toast.success('Version mise à jour avec succès');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour de la version');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setNewVersion(version);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Gestion de la version
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid gap-3">
            <Label htmlFor="current-version">Version actuelle</Label>
            <div id="current-version" className="text-lg font-medium text-muted-foreground">
              v{version}
            </div>
          </div>
          
          <div className="grid gap-3">
            <Label htmlFor="new-version">Nouvelle version</Label>
            <Input
              id="new-version"
              value={newVersion}
              onChange={(e) => setNewVersion(e.target.value)}
              placeholder="Ex: 1.2.3"
              disabled={isSaving}
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleSave} 
              disabled={isSaving || newVersion === version || !newVersion.trim()}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleReset}
              disabled={isSaving}
            >
              Annuler
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VersionManager;
