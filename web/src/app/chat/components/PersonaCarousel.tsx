"use client";

import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";

import { coordinatorPersonas } from "~/app/chat/personas";
import { useStore } from "~/core/store";
import { cn } from "~/lib/utils";

interface PersonaCarouselProps {
  onPersonaSelect?: (personaId: string) => void;
}

export const PersonaCarousel: React.FC<PersonaCarouselProps> = ({
  onPersonaSelect,
}) => {
  const selectedPersonaId = useStore((state) => state.selectedCoordinatorPersona);
  const setSelectedPersonaId = useStore((state) => state.setSelectedCoordinatorPersona);
  
  // Local state to track the selected card for animation purposes
  const [selectedCardId, setSelectedCardId] = useState<string>(selectedPersonaId);

  // Sync local state with store when the store changes
  useEffect(() => {
    setSelectedCardId(selectedPersonaId);
  }, [selectedPersonaId]);

  const handleCardClick = (personaId: string) => {
    // Update local state for immediate UI feedback
    setSelectedCardId(personaId);
    
    // Update the global store
    setSelectedPersonaId(personaId);
    
    // Call the callback if provided
    if (onPersonaSelect) {
      onPersonaSelect(personaId);
    }
    
    console.log(`Selected persona: ${personaId}`);
  };

  return (
    <div className="w-full overflow-hidden">
      <div className="flex space-x-4 overflow-x-auto pb-4 pt-2 px-2 scrollbar-hide">
        {coordinatorPersonas.map((persona) => (
          <motion.div
            key={persona.id}
            className={cn(
              "flex-shrink-0 cursor-pointer rounded-lg border p-4 shadow-sm transition-all",
              "hover:shadow-md",
              selectedCardId === persona.id
                ? "border-primary bg-primary/5"
                : "border-border bg-card"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleCardClick(persona.id)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col items-start space-y-2">
              <div className="flex items-center space-x-2">
                {persona.icon && (
                  <span className="text-xl">{persona.icon}</span>
                )}
                <h3 className="font-medium">{persona.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground max-w-[200px]">
                {persona.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

