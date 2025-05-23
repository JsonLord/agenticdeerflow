"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import React, { useState } from "react";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

import { PersonaCarousel } from "./PersonaCarousel";

export const PersonaCarouselFrame: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={cn(
      "bg-background/80 backdrop-blur-sm border rounded-lg transition-all duration-300 overflow-hidden",
      isExpanded ? "max-h-96" : "max-h-12"
    )}>
      <div className="flex items-center justify-between px-4 py-2">
        <h3 className="text-sm font-medium">Select Coordinator Mode</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={toggleExpanded}
          className="h-8 w-8 p-0"
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      <div className={cn(
        "transition-opacity duration-300",
        isExpanded ? "opacity-100" : "opacity-0"
      )}>
        <PersonaCarousel />
      </div>
    </div>
  );
};

