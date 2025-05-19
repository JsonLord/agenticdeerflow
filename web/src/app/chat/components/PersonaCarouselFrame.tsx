"use client";

import React, { useRef, useState } from "react";
import { useStore } from "~/core/store";
import { coordinatorPersonas, Persona } from "~/app/chat/personas";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { cn } from "~/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "~/components/ui/button";

export function PersonaCarouselFrame() {
  const selectedPersonaId = useStore((state) => state.selectedCoordinatorPersona);
  const setSelectedCoordinatorPersona = useStore((state) => state.setSelectedCoordinatorPersona);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const handlePersonaSelect = (personaId: string) => {
    setSelectedCoordinatorPersona(personaId);
  };

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    
    const scrollAmount = 200; // Adjust based on card width + margin
    const currentScroll = carouselRef.current.scrollLeft;
    const newScroll = direction === 'left' 
      ? currentScroll - scrollAmount 
      : currentScroll + scrollAmount;
    
    carouselRef.current.scrollTo({
      left: newScroll,
      behavior: 'smooth'
    });
  };

  const handleScroll = () => {
    if (!carouselRef.current) return;
    
    // Show left arrow if we're not at the start
    setShowLeftArrow(carouselRef.current.scrollLeft > 0);
    
    // Show right arrow if we're not at the end
    const isAtEnd = 
      carouselRef.current.scrollLeft + carouselRef.current.clientWidth >= 
      carouselRef.current.scrollWidth - 10; // Small buffer for rounding errors
    
    setShowRightArrow(!isAtEnd);
  };

  if (!coordinatorPersonas || coordinatorPersonas.length === 0) {
    return null; // Don't render if no personas are defined
  }

  return (
    <div className="persona-carousel-container w-full max-w-4xl mx-auto border rounded-lg overflow-hidden">
      <div className="relative">
        {/* Left scroll button */}
        {showLeftArrow && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => scrollCarousel('left')}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-background/80 shadow-md"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        
        {/* Carousel */}
        <div 
          ref={carouselRef}
          className="flex overflow-x-auto scrollbar-hide py-2 px-4 scroll-smooth"
          onScroll={handleScroll}
        >
          {coordinatorPersonas.map((persona: Persona) => {
            const isSelected = persona.id === selectedPersonaId;
            return (
              <Card
                key={persona.id}
                onClick={() => handlePersonaSelect(persona.id)}
                className={cn(
                  "min-w-[200px] max-w-[250px] flex-shrink-0 cursor-pointer transition-all hover:shadow-lg mr-3",
                  isSelected
                    ? "border-primary ring-2 ring-primary shadow-md"
                    : "border-border",
                )}
              >
                <CardHeader className="p-4">
                  <div className="flex items-center space-x-3">
                    {persona.icon && (
                      <persona.icon
                        className={cn(
                          "h-6 w-6",
                          isSelected ? "text-primary" : "text-muted-foreground",
                        )}
                      />
                    )}
                    <CardTitle className={cn("text-sm font-semibold leading-none", isSelected ? "text-primary" : "")}>
                      {persona.name}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <CardDescription className="text-xs line-clamp-3">
                    {persona.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {/* Right scroll button */}
        {showRightArrow && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => scrollCarousel('right')}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-background/80 shadow-md"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
