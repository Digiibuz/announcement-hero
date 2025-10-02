import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Facebook, Instagram } from "lucide-react";

interface SocialPlatformSelectorProps {
  facebookEnabled: boolean;
  instagramEnabled: boolean;
  onFacebookChange: (enabled: boolean) => void;
  onInstagramChange: (enabled: boolean) => void;
}

export const SocialPlatformSelector = ({
  facebookEnabled,
  instagramEnabled,
  onFacebookChange,
  onInstagramChange,
}: SocialPlatformSelectorProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Sélectionner les plateformes</h3>
      <div className="flex gap-6">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="facebook"
            checked={facebookEnabled}
            onCheckedChange={onFacebookChange}
          />
          <Label htmlFor="facebook" className="flex items-center gap-2 cursor-pointer">
            <Facebook className="h-4 w-4" />
            Facebook
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="instagram"
            checked={instagramEnabled}
            onCheckedChange={onInstagramChange}
          />
          <Label htmlFor="instagram" className="flex items-center gap-2 cursor-pointer">
            <Instagram className="h-4 w-4" />
            Instagram
          </Label>
        </div>
      </div>
    </div>
  );
};
