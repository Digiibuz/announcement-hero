
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import { ArrowRight, FileText, Edit, BarChart2, Mic } from "lucide-react";

const Index = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if already logged in
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const features = [
    {
      icon: <FileText size={24} />,
      title: "Easy Content Management",
      description: "Create, edit, archive, and delete announcements with an intuitive interface designed for efficiency."
    },
    {
      icon: <Edit size={24} />,
      title: "SEO Optimization",
      description: "Automatic suggestions for improving your content's SEO performance and visibility."
    },
    {
      icon: <Mic size={24} />,
      title: "Voice Recognition",
      description: "Dictate your announcements using advanced speech-to-text technology for faster content creation."
    },
    {
      icon: <BarChart2 size={24} />,
      title: "WordPress Integration",
      description: "Seamlessly publishes to your WordPress site with Divi Builder and DiviPixel compatibility."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/70 backdrop-blur-xl border-b border-border">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                DiviAnnounce
              </span>
            </div>

            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate("/login")}
              >
                Log in
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 lg:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-muted/30 to-background"></div>
          <div className="container px-4 md:px-6 relative">
            <div className="flex flex-col items-center text-center space-y-6 md:space-y-8">
              <AnimatedContainer>
                <div className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-2">
                  Streamline Your WordPress Workflow
                </div>
              </AnimatedContainer>
              
              <AnimatedContainer delay={100}>
                <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight tracking-tighter md:leading-none max-w-3xl text-balance">
                  Manage Your WordPress Announcements with Elegance
                </h1>
              </AnimatedContainer>
              
              <AnimatedContainer delay={200}>
                <p className="text-muted-foreground text-base md:text-lg lg:text-xl max-w-2xl text-balance">
                  A beautiful, intuitive interface for creating and managing announcements on your WordPress site with Divi Builder and DiviPixel.
                </p>
              </AnimatedContainer>
              
              <AnimatedContainer delay={300}>
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <Button 
                    size="lg" 
                    className="px-6 sm:px-8"
                    onClick={() => navigate("/login")}
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </AnimatedContainer>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <AnimatedContainer>
              <div className="text-center mb-12">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">
                  Powerful Features, Simple Interface
                </h2>
                <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                  Everything you need to manage your WordPress announcements effectively, while maintaining a beautiful, intuitive experience.
                </p>
              </div>
            </AnimatedContainer>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mt-12">
              {features.map((feature, index) => (
                <AnimatedContainer key={index} delay={100 + index * 100}>
                  <div className="flex flex-col items-center text-center p-6 rounded-xl bg-card hover-scale card-shadow">
                    <div className="p-3 rounded-full bg-primary/10 text-primary mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </AnimatedContainer>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 md:py-12">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-6 md:mb-0">
              <span className="text-lg font-semibold">DiviAnnounce</span>
              <p className="text-sm text-muted-foreground mt-1">
                Elegant WordPress announcement management
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} DiviAnnounce. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
