"use client";

import React from "react";
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

export function PersonaCarousel() {
  const selectedPersonaId = useStore((state) => state.selectedCoordinatorPersona);
  const setSelectedCoordinatorPersona = useStore((state) => state.setSelectedCoordinatorPersona);

  const handlePersonaSelect = (personaId: string) => {
    setSelectedCoordinatorPersona(personaId);
  };

  if (!coordinatorPersonas || coordinatorPersonas.length === 0) {
    return null; // Don't render if no personas are defined
  }

  return (
    <div className="w-full overflow-x-auto py-2 px-1">
      <div className="flex space-x-4">
        {coordinatorPersonas.map((persona: Persona) => {
          const isSelected = persona.id === selectedPersonaId;
          return (
            <Card
              key={persona.id}
              onClick={() => handlePersonaSelect(persona.id)}
              className={cn(
                "min-w-[200px] max-w-[250px] cursor-pointer transition-all hover:shadow-lg",
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
    </div>
  );
}
