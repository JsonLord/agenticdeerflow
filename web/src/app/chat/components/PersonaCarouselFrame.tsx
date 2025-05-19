"use client";

import React, { useState } from "react";
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

  // Find the index of the currently selected persona
  const selectedIndex = coordinatorPersonas.findIndex(
    (persona) => persona.id === selectedPersonaId
  );

  const handlePersonaSelect = (personaId: string) => {
    setSelectedCoordinatorPersona(personaId);
  };

  const handlePrevious = () => {
    const newIndex = selectedIndex > 0 
      ? selectedIndex - 1 
      : coordinatorPersonas.length - 1;
    setSelectedCoordinatorPersona(coordinatorPersonas[newIndex].id);
  };

  const handleNext = () => {
    const newIndex = selectedIndex < coordinatorPersonas.length - 1 
      ? selectedIndex + 1 
      : 0;
    setSelectedCoordinatorPersona(coordinatorPersonas[newIndex].id);
  };

  if (!coordinatorPersonas || coordinatorPersonas.length === 0) {
    return null; // Don't render if no personas are defined
  }

  // Get the currently selected persona
  const selectedPersona = coordinatorPersonas[selectedIndex];

  return (
    <div className="w-full max-w-4xl mx-auto mb-2">
      <div className="flex items-center justify-center">
        <div className="flex items-center space-x-2 w-full max-w-4xl">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handlePrevious}
            className="shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="persona-carousel-frame-container border rounded-lg overflow-hidden w-full">
            <Card
              key={selectedPersona.id}
              className="border-0 shadow-none w-full"
            >
              <CardHeader className="p-4">
                <div className="flex items-center space-x-3">
                  {selectedPersona.icon && (
                    <selectedPersona.icon
                      className="h-6 w-6 text-primary"
                    />
                  )}
                  <CardTitle className="text-sm font-semibold leading-none text-primary">
                    {selectedPersona.name}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <CardDescription className="text-xs">
                  {selectedPersona.description}
                </CardDescription>
              </CardContent>
            </Card>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleNext}
            className="shrink-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

