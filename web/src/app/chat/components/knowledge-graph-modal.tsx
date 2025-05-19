"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { RefreshCw, AlertTriangle, Loader2 } from "lucide-react";
import { useStore } from "~/core/store";

import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Node,
  Edge,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// TypeScript interfaces mirroring backend Pydantic models
interface KGNode {
  id: string;
  label: string;
  status: string;
  type?: string | null;
  error_message?: string | null;
}

interface KGEdge {
  id: string;
  source: string;
  target: string;
  label?: string | null;
  type?: string | null;
}

interface KnowledgeGraphResponse {
  nodes: KGNode[];
  edges: KGEdge[];
}

interface KnowledgeGraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  threadId?: string; // Prop for display purposes, fetching uses store's threadId
}

const getNodeStyle = (status: string): React.CSSProperties => {
  switch (status) {
    case "active":
      return { background: "#90EE90", border: "1px solid green", padding: "10px", borderRadius: "3px", width: 150, whiteSpace: 'pre-wrap', textAlign: 'center' };
    case "completed":
      return { background: "#ADD8E6", border: "1px solid blue", padding: "10px", borderRadius: "3px", width: 150, whiteSpace: 'pre-wrap', textAlign: 'center' };
    case "final_completed":
      return { background: "#D3D3D3", border: "1px solid gray", padding: "10px", borderRadius: "3px", width: 150, whiteSpace: 'pre-wrap', textAlign: 'center' };
    case "error":
      return { background: "#FFCCCB", border: "1px solid red", padding: "10px", borderRadius: "3px", width: 150, whiteSpace: 'pre-wrap', textAlign: 'center' };
    case "pending":
    default:
      return { background: "#FFFFFF", border: "1px solid #777", padding: "10px", borderRadius: "3px", width: 150, whiteSpace: 'pre-wrap', textAlign: 'center' };
  }
};

const KnowledgeGraphFlow: React.FC<{ graphData: KnowledgeGraphResponse | null }> = ({ graphData }) => {
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState([]);
  const { fitView } = useReactFlow();

  useEffect(() => {
    if (graphData) {
      const transformedNodes: Node[] = graphData.nodes.map((n, i) => {
        let nodeLabel = n.label;
        if (n.status === "error" && n.error_message) {
          // Basic way to include error message in label. Tooltip would be better for long messages.
          nodeLabel = `${n.label}\nError: ${n.error_message.substring(0, 50)}${n.error_message.length > 50 ? '...' : ''}`;
        }
        return {
          id: n.id,
          data: { label: nodeLabel },
          position: { x: (i % 4) * 200, y: Math.floor(i / 4) * 120 }, // Simple grid layout
          style: getNodeStyle(n.status),
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        };
      });

      const transformedEdges: Edge[] = graphData.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label || undefined,
        animated: e.type === "dynamic_traversed",
        style: e.type === "static" ? { stroke: "#ccc", strokeDasharray: "5 5" } : { stroke: "#333" },
      }));

      setRfNodes(transformedNodes);
      setRfEdges(transformedEdges);
    } else {
      setRfNodes([]);
      setRfEdges([]);
    }
  }, [graphData, setRfNodes, setRfEdges]);

  useEffect(() => {
    if (rfNodes.length > 0) {
      // Timeout to allow nodes to render before fitting view
      setTimeout(() => fitView({ padding: 0.1, duration: 300 }), 100);
    }
  }, [rfNodes, rfEdges, fitView]); // Rerun fitView when nodes or edges change

  if (!graphData) {
    return (
      <p className="text-center text-muted-foreground">
        No graph data to display or data is being loaded.
      </p>
    );
  }
  
  if (graphData.nodes.length === 0 && graphData.edges.length === 0) {
     return (
      <p className="text-center text-muted-foreground">
        No nodes or edges to display for this graph state.
      </p>
    );
  }


  return (
    <ReactFlow
      nodes={rfNodes}
      edges={rfEdges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      fitView
      nodesDraggable={true}
      nodesConnectable={false}
      // defaultViewport={{ x: 0, y: 0, zoom: 1 }} // Optional: set an initial viewport
    >
      <Controls />
      <Background />
    </ReactFlow>
  );
};


export const KnowledgeGraphModal: React.FC<KnowledgeGraphModalProps> = ({
  isOpen,
  onClose,
  threadId: displayThreadId, 
}) => {
  const [graphData, setGraphData] = useState<KnowledgeGraphResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const threadIdFromStore = useStore((state) => state.threadId);

  const fetchGraphData = useCallback(async () => {
    if (!threadIdFromStore) {
      setFetchError("Thread ID is not available from the store.");
      setGraphData(null);
      return;
    }
    setIsLoading(true);
    setFetchError(null);
    try {
      const response = await fetch(`/api/graph_state/${threadIdFromStore}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to fetch graph data" }));
        const errorMsg = errorData.detail || `HTTP error! status: ${response.status}`;
        setFetchError(errorMsg);
        setGraphData(null);
        return;
      }
      const data: KnowledgeGraphResponse = await response.json();
      setGraphData(data);
    } catch (error) {
      console.error("Failed to fetch graph data:", error);
      setFetchError(error instanceof Error ? error.message : "An unknown error occurred.");
      setGraphData(null);
    } finally {
      setIsLoading(false);
    }
  }, [threadIdFromStore]);

  useEffect(() => {
    if (isOpen && threadIdFromStore) {
      fetchGraphData();
    }
    // Reset data when modal is closed to ensure fresh data on reopen and clear previous state
    if (!isOpen) {
        setGraphData(null);
        setFetchError(null);
        setIsLoading(false); // Ensure loading is reset
    }
  }, [isOpen, threadIdFromStore, fetchGraphData]);

  const handleRefresh = () => {
    fetchGraphData();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[80vw] md:max-w-[70vw] lg:max-w-[60vw] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Workflow Graph</DialogTitle>
        </DialogHeader>
        <div className="flex-grow overflow-hidden p-0 border rounded-md my-4 flex items-center justify-center relative"> {/* Ensure parent has dimensions for ReactFlow */}
          {isLoading ? (
            <div className="flex flex-col items-center text-muted-foreground">
              <Loader2 className="h-12 w-12 animate-spin mb-4" />
              <p>Loading graph data...</p>
            </div>
          ) : fetchError ? (
            <div className="flex flex-col items-center text-destructive p-4">
              <AlertTriangle className="h-12 w-12 mb-4" />
              <p className="font-semibold">Error loading graph:</p>
              <p className="text-sm text-center">{fetchError}</p>
            </div>
          ) : graphData ? (
            <ReactFlowProvider> {/* ReactFlowProvider is needed for useReactFlow hook */}
              <KnowledgeGraphFlow graphData={graphData} />
            </ReactFlowProvider>
          ) : (
             <p className="text-center text-muted-foreground">
              Click Refresh to load graph data.
            </p>
          )}
        </div>
        <DialogFooter className="sm:justify-between">
          <div className="text-xs text-muted-foreground">
            {/* Displaying thread IDs for debugging/confirmation */}
            {displayThreadId && (<span>Displaying for: {displayThreadId}</span>)}
            {threadIdFromStore && displayThreadId !== threadIdFromStore && (<span className="ml-2">(Store: {threadIdFromStore})</span>)}
          </div>
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <DialogClose asChild>
            <Button type="button" variant="secondary" onClick={onClose}>
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
