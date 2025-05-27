
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import AnimatedContainer from "@/components/ui/AnimatedContainer";

const DynamicHeader = () => {
  const { user, isAdmin } = useAuth();

  // Messages dynamiques basés sur l'heure
  const getGreetingMessage = () => {
    const hour = new Date().getHours();
    const firstName = user?.name?.split(' ')[0] || 'Utilisateur';
    
    if (hour < 12) {
      return `Bonjour ${firstName} ! ☀️`;
    } else if (hour < 18) {
      return `Bon après-midi ${firstName} ! 🌤️`;
    } else {
      return `Bonsoir ${firstName} ! 🌙`;
    }
  };

  const getMotivationalMessage = () => {
    const messages = [
      "Prêt à créer quelque chose d'extraordinaire aujourd'hui ?",
      "Votre créativité n'attend que vous !",
      "Transformons vos idées en réalité !",
      "Que souhaitez-vous partager avec le monde aujourd'hui ?",
      "Votre prochaine belle histoire commence ici !"
    ];
    
    const today = new Date().getDate();
    return messages[today % messages.length];
  };

  return (
    <div className="text-center py-12 px-4">
      <AnimatedContainer delay={100}>
        <div className="flex items-center justify-center mb-4">
          <Sparkles className="h-8 w-8 text-purple-500 mr-3 animate-pulse" />
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent">
            {getGreetingMessage()}
          </h1>
          <Sparkles className="h-8 w-8 text-blue-500 ml-3 animate-pulse" />
        </div>
      </AnimatedContainer>

      <AnimatedContainer delay={200}>
        <p className="text-xl md:text-2xl text-gray-600 mb-8 font-medium">
          {getMotivationalMessage()}
        </p>
      </AnimatedContainer>

      {!isAdmin && (
        <AnimatedContainer delay={300}>
          <Button 
            asChild 
            size="lg"
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold px-8 py-4 rounded-full transform transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95 group relative overflow-hidden shadow-lg"
          >
            <Link to="/create">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              <Plus className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:rotate-90" />
              Créer une nouvelle annonce
            </Link>
          </Button>
        </AnimatedContainer>
      )}
    </div>
  );
};

export default DynamicHeader;
