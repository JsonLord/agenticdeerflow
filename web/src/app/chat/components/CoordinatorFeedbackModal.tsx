
"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { useStore } from "~/core/store";
import { coordinatorPersonas } from "~/app/chat/personas";
import { submitCoordinatorFeedback } from "~/core/api/feedback";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CoordinatorFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CoordinatorFeedbackModal: React.FC<CoordinatorFeedbackModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedPersonaId = useStore((state) => state.selectedCoordinatorPersona);
  const [selectedPersonaName, setSelectedPersonaName] = useState("Default");

  useEffect(() => {
    const persona = coordinatorPersonas.find((p) => p.id === selectedPersonaId);
    if (persona) {
      setSelectedPersonaName(persona.name);
    } else {
      const defaultPersona = coordinatorPersonas.find((p) => p.id === "default");
      setSelectedPersonaName(defaultPersona ? defaultPersona.name : "Default");
    }
  }, [selectedPersonaId]);

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await submitCoordinatorFeedback({
        persona_id: selectedPersonaId,
        feedback_text: feedbackText,
      });
      toast.success("Feedback submitted successfully!");
      setFeedbackText(""); // Clear textarea
      onClose(); // Close modal
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      toast.error(error instanceof Error ? error.message : "Failed to submit feedback.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset feedback text and submitting state when modal is opened/closed
  useEffect(() => {
    if (!isOpen) {
      setFeedbackText("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Feedback on Coordinator Persona</DialogTitle>
          <DialogDescription>
            You are providing feedback for the &quot;{selectedPersonaName}&quot; persona.
            Your input helps improve its responses and adherence to its defined role.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="feedback-text">Your Feedback</Label>
            <Textarea
              id="feedback-text"
              placeholder={`How well did the "${selectedPersonaName}" persona perform? What could be improved?`}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              rows={6}
              className="min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={handleSubmitFeedback}
            disabled={!feedbackText.trim() || isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Feedback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
