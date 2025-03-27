
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Mic, MicOff } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import AnnouncementPreview from "./AnnouncementPreview";

interface AnnouncementFormProps {
  onSubmit?: (data: AnnouncementData) => void;
}

export interface AnnouncementData {
  title: string;
  description: string;
  category: string;
  publishDate: Date | undefined;
  status: "draft" | "published" | "scheduled";
  images: string[];
}

const MOCK_CATEGORIES = [
  { id: "news", name: "News" },
  { id: "events", name: "Events" },
  { id: "blog", name: "Blog" },
  { id: "product", name: "Product Updates" },
];

const AnnouncementForm = ({ onSubmit }: AnnouncementFormProps) => {
  const [formData, setFormData] = useState<AnnouncementData>({
    title: "",
    description: "",
    category: "",
    publishDate: undefined,
    status: "draft",
    images: [],
  });

  const [isRecording, setIsRecording] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateSelect = (date: Date | undefined) => {
    setFormData((prev) => ({ ...prev, publishDate: date }));
  };

  const toggleVoiceRecording = () => {
    // In a real app, this would use the Web Speech API
    setIsRecording(!isRecording);
    
    if (!isRecording) {
      // Simulate starting recording
      console.log("Starting voice recording...");
    } else {
      // Simulate stopping recording and transcribing
      console.log("Stopping voice recording...");
      // Simulate transcription result
      const transcription = "This is a simulated transcription of voice input that would be added to the description.";
      
      setFormData((prev) => ({
        ...prev,
        description: prev.description 
          ? `${prev.description}\n\n${transcription}` 
          : transcription
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (onSubmit) {
      onSubmit(formData);
    } else {
      console.log("Form submitted:", formData);
    }
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-semibold">Create New Announcement</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="w-full sm:w-auto"
            onClick={togglePreview}
          >
            {showPreview ? "Edit" : "Preview"}
          </Button>
          <Button 
            type="submit" 
            form="announcement-form"
            className="w-full sm:w-auto"
          >
            Save as Draft
          </Button>
        </div>
      </div>

      {showPreview ? (
        <div className="animate-fade-in">
          <AnnouncementPreview data={formData} />
        </div>
      ) : (
        <form id="announcement-form" onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter announcement title"
                className="mt-1"
              />
            </div>

            <div className="relative">
              <div className="flex justify-between items-center">
                <Label htmlFor="description">Description</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="flex items-center gap-1 text-xs"
                  onClick={toggleVoiceRecording}
                >
                  {isRecording ? (
                    <>
                      <MicOff size={14} className="text-destructive" />
                      <span className="text-destructive">Stop Recording</span>
                    </>
                  ) : (
                    <>
                      <Mic size={14} />
                      <span>Voice Input</span>
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter announcement description or use voice input"
                className={cn(
                  "mt-1 min-h-32",
                  isRecording && "border-primary ring-2 ring-primary/20"
                )}
              />
              {isRecording && (
                <div className="absolute bottom-3 right-3 flex items-center gap-2 text-primary text-sm font-medium bg-primary/10 px-2 py-1 rounded-md">
                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse-subtle"></span>
                  Recording...
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleSelectChange("category", value)}
                >
                  <SelectTrigger id="category" className="mt-1">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_CATEGORIES.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Publish Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full mt-1 justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.publishDate ? (
                        format(formData.publishDate, "PPP")
                      ) : (
                        <span>Select a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 glass-panel">
                    <Calendar
                      mode="single"
                      selected={formData.publishDate}
                      onSelect={handleDateSelect}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div>
              <Label>Images</Label>
              <div className="mt-1 border-2 border-dashed rounded-lg p-8 text-center">
                <p className="text-muted-foreground">
                  Drag & drop images here, or click to select files
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4"
                >
                  Upload Images
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default AnnouncementForm;
