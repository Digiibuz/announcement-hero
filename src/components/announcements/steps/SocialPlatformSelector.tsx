import { Facebook, Instagram, Check } from "lucide-react";
import { cn } from "@/lib/utils";

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
      <h3 className="text-sm font-medium text-gray-700">Sélectionner les plateformes</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Facebook Card */}
        <button
          type="button"
          onClick={() => onFacebookChange(!facebookEnabled)}
          className={cn(
            "relative p-6 rounded-2xl border-2 transition-all duration-300 text-left group hover:scale-105",
            facebookEnabled
              ? "border-[#1877F2] bg-[#1877F2]/5 shadow-lg shadow-[#1877F2]/20"
              : "border-gray-200 bg-white hover:border-[#1877F2]/50"
          )}
        >
          {/* Checkmark Badge */}
          {facebookEnabled && (
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#1877F2] rounded-full flex items-center justify-center shadow-lg">
              <Check className="h-5 w-5 text-white" />
            </div>
          )}
          
          {/* Icon */}
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors",
            facebookEnabled ? "bg-[#1877F2]" : "bg-[#1877F2]/10 group-hover:bg-[#1877F2]/20"
          )}>
            <Facebook className={cn(
              "h-6 w-6",
              facebookEnabled ? "text-white" : "text-[#1877F2]"
            )} />
          </div>
          
          {/* Text */}
          <div>
            <h4 className={cn(
              "font-semibold text-lg mb-1",
              facebookEnabled ? "text-[#1877F2]" : "text-gray-900"
            )}>
              Facebook
            </h4>
            <p className="text-sm text-gray-500">
              Partagez avec votre communauté
            </p>
          </div>
        </button>

        {/* Instagram Card */}
        <button
          type="button"
          onClick={() => onInstagramChange(!instagramEnabled)}
          className={cn(
            "relative p-6 rounded-2xl border-2 transition-all duration-300 text-left group hover:scale-105",
            instagramEnabled
              ? "border-transparent bg-gradient-to-br from-[#E4405F]/10 via-[#C13584]/10 to-[#833AB4]/10 shadow-lg shadow-purple-500/20"
              : "border-gray-200 bg-white hover:border-purple-300"
          )}
          style={instagramEnabled ? {
            borderImage: "linear-gradient(135deg, #E4405F, #C13584, #833AB4) 1"
          } : {}}
        >
          {/* Checkmark Badge */}
          {instagramEnabled && (
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-[#E4405F] via-[#C13584] to-[#833AB4] rounded-full flex items-center justify-center shadow-lg">
              <Check className="h-5 w-5 text-white" />
            </div>
          )}
          
          {/* Icon */}
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all",
            instagramEnabled 
              ? "bg-gradient-to-br from-[#E4405F] via-[#C13584] to-[#833AB4]" 
              : "bg-gradient-to-br from-[#E4405F]/10 via-[#C13584]/10 to-[#833AB4]/10 group-hover:from-[#E4405F]/20 group-hover:via-[#C13584]/20 group-hover:to-[#833AB4]/20"
          )}>
            <Instagram className={cn(
              "h-6 w-6",
              instagramEnabled ? "text-white" : "text-[#C13584]"
            )} />
          </div>
          
          {/* Text */}
          <div>
            <h4 className={cn(
              "font-semibold text-lg mb-1",
              instagramEnabled ? "bg-gradient-to-r from-[#E4405F] via-[#C13584] to-[#833AB4] bg-clip-text text-transparent" : "text-gray-900"
            )}>
              Instagram
            </h4>
            <p className="text-sm text-gray-500">
              Touchez une audience visuelle
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};
