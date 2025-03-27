
import React from "react";
import Header from "@/components/ui/layout/Header";
import Sidebar from "@/components/ui/layout/Sidebar";
import AnnouncementForm from "@/components/announcements/AnnouncementForm";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import { toast } from "sonner";

const CreateAnnouncement = () => {
  const handleSubmit = (data: any) => {
    console.log("Announcement data:", data);
    
    // In a real app, this would send the data to an API
    toast.success("Announcement saved as draft");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />

      <main className="pt-16 md:pl-64">
        <div className="container px-4 py-8">
          <AnimatedContainer>
            <div className="max-w-4xl mx-auto">
              <AnnouncementForm onSubmit={handleSubmit} />
            </div>
          </AnimatedContainer>
        </div>
      </main>
    </div>
  );
};

export default CreateAnnouncement;
