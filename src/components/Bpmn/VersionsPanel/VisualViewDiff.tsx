import React, { useEffect, useRef, useState } from "react";
import { Box, Text, Spinner, Center } from "@chakra-ui/react";

// Types for diff result
interface DiffResult {
  _added: Record<string, any>;
  _removed: Record<string, any>;
  _changed: Record<string, any>;
  _layoutChanged: Record<string, any>;
}

export interface DetectedChange {
  id: string;
  elementId: string;
  elementName: string;
  changeType: "added" | "removed" | "changed" | "layoutChanged";
}

interface VisualViewDiffProps {
  currentXml: string;
  selectedXml?: string;
  showDiff?: boolean;
  onElementClick?: (elementId: string) => void;
  onChangesDetected?: (changes: DetectedChange[]) => void;
}

export default function VisualViewDiff({
  currentXml,
  selectedXml,
  showDiff = true,
  onElementClick,
  onChangesDetected,
}: VisualViewDiffProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);

  useEffect(() => {
    if (!containerRef.current || !currentXml) return;

    let viewer: any = null;
    let isMounted = true;

    const initViewer = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Dynamic imports to avoid SSR issues
        const [{ default: BpmnViewer }, { default: BpmnModdle }, { diff }] =
          await Promise.all([
            import("bpmn-js/lib/NavigatedViewer"),
            import("bpmn-moddle"),
            import("bpmn-js-differ"),
          ]);

        // Clean up previous viewer
        if (viewerRef.current) {
          viewerRef.current.destroy();
        }

        // Create new viewer
        viewer = new BpmnViewer({
          container: containerRef.current,
        });

        viewerRef.current = viewer;

        // Import the current (newer) XML for display
        await viewer.importXML(currentXml);

        // Fit viewport
        const canvas = viewer.get("canvas");
        canvas.zoom("fit-viewport");

        // If showDiff is enabled and we have both XMLs, compute diff
        if (showDiff && selectedXml && currentXml !== selectedXml) {
          const moddle = new BpmnModdle();

          try {
            // Parse both XMLs
            const [oldDefinitions, newDefinitions] = await Promise.all([
              moddle.fromXML(selectedXml),
              moddle.fromXML(currentXml),
            ]);

            // Compute diff (old -> new)
            const result: DiffResult = diff(
              oldDefinitions.rootElement,
              newDefinitions.rootElement
            );

            if (isMounted) {
              setDiffResult(result);

              // Highlight changes on the diagram
              highlightDiffResult(viewer, result);

              // Convert diff result to DetectedChange array
              const detectedChanges = convertDiffToChanges(result);
              onChangesDetected?.(detectedChanges);
            }
          } catch (diffErr) {
            console.error("Failed to compute diff:", diffErr);
          }
        } else {
          setDiffResult(null);
          onChangesDetected?.([]);
        }

        // Add click listener
        const eventBus = viewer.get("eventBus");
        eventBus.on("element.click", (event: any) => {
          const element = event.element;
          if (element && onElementClick) {
            onElementClick(element.id);
          }
        });

        if (isMounted) {
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Failed to import BPMN XML:", err);
        if (isMounted) {
          setError("Failed to load BPMN diagram");
          setIsLoading(false);
        }
      }
    };

    initViewer();

    return () => {
      isMounted = false;
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [currentXml, selectedXml, showDiff]);

  const highlightDiffResult = (viewer: any, result: DiffResult) => {
    try {
      const canvas = viewer.get("canvas");
      const elementRegistry = viewer.get("elementRegistry");

      // Highlight added elements (green)
      Object.keys(result._added || {}).forEach((id) => {
        if (elementRegistry.get(id)) {
          canvas.addMarker(id, "diff-added");
        }
      });

      // Highlight removed elements (red) - these might not exist in current
      // We can't show removed elements on the current diagram
      // They would only appear if we showed the old diagram

      // Highlight changed elements (orange)
      Object.keys(result._changed || {}).forEach((id) => {
        if (elementRegistry.get(id)) {
          canvas.addMarker(id, "diff-changed");
        }
      });

      // Highlight layout changed elements (purple/moved)
      Object.keys(result._layoutChanged || {}).forEach((id) => {
        if (elementRegistry.get(id)) {
          canvas.addMarker(id, "diff-moved");
        }
      });
    } catch (err) {
      console.error("Failed to highlight diff:", err);
    }
  };

  const convertDiffToChanges = (result: DiffResult): DetectedChange[] => {
    const changes: DetectedChange[] = [];

    // Added elements
    Object.entries(result._added || {}).forEach(([id, element]) => {
      changes.push({
        id: `added-${id}`,
        elementId: id,
        elementName: element.name || element.$type || id,
        changeType: "added",
      });
    });

    // Removed elements
    Object.entries(result._removed || {}).forEach(([id, element]) => {
      changes.push({
        id: `removed-${id}`,
        elementId: id,
        elementName: element.name || element.$type || id,
        changeType: "removed",
      });
    });

    // Changed elements
    Object.entries(result._changed || {}).forEach(([id, element]) => {
      changes.push({
        id: `changed-${id}`,
        elementId: id,
        elementName: element.name || element.$type || id,
        changeType: "changed",
      });
    });

    // Layout changed elements
    Object.entries(result._layoutChanged || {}).forEach(([id, element]) => {
      changes.push({
        id: `layout-${id}`,
        elementId: id,
        elementName: element.name || element.$type || id,
        changeType: "layoutChanged",
      });
    });

    return changes;
  };

  if (error) {
    return (
      <Center h="100%" bg="gray.50">
        <Text color="red.500">{error}</Text>
      </Center>
    );
  }

  // Show empty state if no XML provided
  if (!currentXml) {
    return (
      <Center h="100%" bg="gray.50">
        <Text color="gray.500">Select a version to view the diagram</Text>
      </Center>
    );
  }

  return (
    <Box h="100%" w="100%" position="relative" bg="gray.50">
      {isLoading && (
        <Center
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="whiteAlpha.800"
          zIndex={10}
        >
          <Spinner size="lg" color="teal.500" />
        </Center>
      )}
      <Box
        ref={containerRef}
        h="100%"
        w="100%"
        sx={{
          ".bjs-container": {
            height: "100% !important",
          },
          // ===== ADDED - Green highlight =====
          ".diff-added .djs-visual > rect, .diff-added .djs-visual > polygon": {
            fill: "#C6F6D5 !important",
            stroke: "#38A169 !important",
            strokeWidth: "3px !important",
          },
          ".diff-added .djs-visual > circle": {
            stroke: "#38A169 !important",
            strokeWidth: "3px !important",
          },
          ".diff-added .djs-visual > path": {
            stroke: "#38A169 !important",
            strokeWidth: "2px !important",
          },
          ".diff-added .djs-label": {
            fill: "#276749 !important",
            fontWeight: "600 !important",
          },

          // ===== CHANGED - Orange highlight =====
          ".diff-changed .djs-visual > rect, .diff-changed .djs-visual > polygon":
            {
              fill: "#FEEBC8 !important",
              stroke: "#DD6B20 !important",
              strokeWidth: "3px !important",
            },
          ".diff-changed .djs-visual > circle": {
            stroke: "#DD6B20 !important",
            strokeWidth: "3px !important",
          },
          ".diff-changed .djs-visual > path": {
            stroke: "#DD6B20 !important",
            strokeWidth: "2px !important",
          },
          ".diff-changed .djs-label": {
            fill: "#C05621 !important",
            fontWeight: "600 !important",
          },

          // ===== MOVED/LAYOUT CHANGED - Purple highlight =====
          ".diff-moved .djs-visual > rect, .diff-moved .djs-visual > polygon": {
            fill: "#E9D8FD !important",
            stroke: "#805AD5 !important",
            strokeWidth: "3px !important",
          },
          ".diff-moved .djs-visual > circle": {
            stroke: "#805AD5 !important",
            strokeWidth: "3px !important",
          },
          ".diff-moved .djs-visual > path": {
            stroke: "#805AD5 !important",
            strokeWidth: "2px !important",
          },
          ".diff-moved .djs-label": {
            fill: "#553C9A !important",
            fontWeight: "600 !important",
          },

          // ===== REMOVED - Red highlight (for reference, shown on old diagram) =====
          ".diff-removed .djs-visual > rect, .diff-removed .djs-visual > polygon":
            {
              fill: "#FED7D7 !important",
              stroke: "#E53E3E !important",
              strokeWidth: "3px !important",
              strokeDasharray: "6 3 !important",
            },
          ".diff-removed .djs-visual > circle": {
            stroke: "#E53E3E !important",
            strokeWidth: "3px !important",
            strokeDasharray: "6 3 !important",
          },
          ".diff-removed .djs-visual > path": {
            stroke: "#E53E3E !important",
            strokeWidth: "2px !important",
            strokeDasharray: "6 3 !important",
          },
          ".diff-removed .djs-label": {
            fill: "#C53030 !important",
            fontWeight: "600 !important",
            textDecoration: "line-through !important",
          },
        }}
      />
    </Box>
  );
}
