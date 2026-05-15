"use client";

import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaUploadInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  accept?: string;
  className?: string;
}

export function MediaUploadInput({ value, onChange, placeholder, accept, className }: MediaUploadInputProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const getUploadUrl = useMutation(api.files.getUploadUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    // 50MB limit for video
    if (file.type.startsWith("video/") && file.size > 50 * 1024 * 1024) {
      alert("Video size exceeds 50MB limit.");
      return;
    }
    // 20MB limit for image/audio
    if (!file.type.startsWith("video/") && file.size > 20 * 1024 * 1024) {
      alert("File size exceeds 20MB limit.");
      return;
    }
    
    setIsUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();
      const url = await getUploadUrl({ storageId });
      if (url) onChange(url);
    } catch (e) {
      console.error(e);
      alert("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <div 
      className={cn(
        "relative rounded-xl border-2 transition-all overflow-hidden flex items-center bg-background",
        isDragging ? "border-purple-500 bg-purple-500/10" : "border-border",
        isUploading ? "opacity-50 pointer-events-none" : "",
        className
      )}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
    >
      <Input
        placeholder={placeholder || "Paste URL or Drag & Drop file..."}
        className="border-none bg-transparent h-12 flex-1 focus-visible:ring-0 rounded-none shadow-none text-foreground placeholder:text-muted-foreground"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="flex items-center pr-2 pl-2 border-l border-border/50">
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 px-3 text-xs bg-secondary hover:bg-secondary/80 text-muted-foreground flex items-center gap-2 rounded-lg"
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
          {isUploading ? "Uploading..." : "Upload"}
        </Button>
      </div>
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        accept={accept} 
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
