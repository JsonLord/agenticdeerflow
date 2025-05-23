"use client";

import type { Edge, Node } from "@xyflow/react";
import { Background, Controls, ReactFlow, useReactFlow } from "@xyflow/react";
import { Loader2, X } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { useStore } from "~/core/store";

interface KnowledgeGraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  threadId?: string;
}

interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

interface GraphNode {
  id: string;
  position?: { x: number; y: number };
  label?: string;
  type?: string;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export const KnowledgeGraphModal: React.FC<KnowledgeGraphModalProps> = ({
  isOpen,
  onClose,
  threadId,
}) => {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reactFlowInstance = useReactFlow();
  const threadIdFromStore = useStore((state) => state.threadId);

  const fetchGraphData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Use the thread ID from props or fall back to the one from store
      const effectiveThreadId = threadId ?? threadIdFromStore;
      
      if (!effectiveThreadId) {
        throw new Error("No thread ID available");
      }

      const response = await fetch(`/api/knowledge_graph/${effectiveThreadId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transform the data if needed to match the ReactFlow format
      const transformedData: GraphData = {
        nodes: data.nodes.map((node: GraphNode) => ({
          id: node.id,
          position: node.position ?? { x: Math.random() * 500, y: Math.random() * 500 },
          data: { label: node.label ?? node.id },
          type: "default",
          style: {
            background: node.type === "concept" ? "#e6f7ff" : "#f6ffed",
            border: "1px solid #1890ff",
            borderRadius: "8px",
            padding: "10px",
            width: "auto",
            minWidth: "150px",
          },
        })),
        edges: data.edges.map((edge: GraphEdge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.label,
          type: "default",
          animated: true,
          style: { stroke: "#1890ff" },
        })),
      };
      
      setGraphData(transformedData);
      
      // Center the graph after it's loaded
      setTimeout(() => {
        if (reactFlowInstance && transformedData.nodes.length > 0) {
          void reactFlowInstance.fitView({ padding: 0.2 });
        }
      }, 100);
    } catch (error) {
      console.error("Error fetching knowledge graph:", error);
      setError(error instanceof Error ? error.message : "Failed to load knowledge graph");
    } finally {
      setIsLoading(false);
    }
  }, [threadId, threadIdFromStore, reactFlowInstance]);

  useEffect(() => {
    if (isOpen) {
      void fetchGraphData();
    }
  }, [isOpen, fetchGraphData]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[70vw] h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle>Knowledge Graph</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-grow relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <p className="text-sm text-muted-foreground">Loading knowledge graph...</p>
              </div>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center p-4">
                <p className="text-destructive font-medium mb-2">Error loading graph</p>
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => void fetchGraphData()} 
                  className="mt-4"
                >
                  Retry
                </Button>
              </div>
            </div>
          ) : graphData.nodes.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-muted-foreground">No knowledge graph data available for this thread.</p>
            </div>
          ) : (
            <ReactFlow
              nodes={graphData.nodes}
              edges={graphData.edges}
              fitView
              attributionPosition="bottom-right"
            >
              <Background />
              <Controls />
            </ReactFlow>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

