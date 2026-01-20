import { useState, useEffect } from "react";
import { useBpmn } from "./useBpmn";

/**
 * Hook to track subprocess navigation context
 * Returns whether we're currently in a subprocess drill-down view
 */
export const useSubProcessContext = (
  bpmnReact?: ReturnType<typeof useBpmn>
) => {
  const [isInSubProcess, setIsInSubProcess] = useState(false);
  const [subProcessName, setSubProcessName] = useState<string>("");
  const [currentRootId, setCurrentRootId] = useState<string | null>(null);

  useEffect(() => {
    if (!bpmnReact?.bpmnModeler) return;

    const canvas = bpmnReact.bpmnModeler.get("canvas") as any;
    const eventBus = bpmnReact.bpmnModeler.get("eventBus") as any;

    const updateContext = () => {
      try {
        const root = canvas.getRootElement();

        if (root?.id !== currentRootId) {
          setCurrentRootId(root?.id || null);

          const isSubProcess =
            root?.businessObject?.$type === "bpmn:SubProcess";
          setIsInSubProcess(isSubProcess);

          if (isSubProcess) {
            setSubProcessName(root?.businessObject?.name || "SubProcess");
          } else {
            setSubProcessName("");
          }
        }
      } catch (error) {
        console.error("Error updating subprocess context:", error);
      }
    };

    eventBus.on("root.set", updateContext);

    // Initial check
    setTimeout(updateContext, 100);

    return () => {
      eventBus.off("root.set", updateContext);
    };
  }, [bpmnReact?.bpmnModeler, currentRootId]);

  return {
    isInSubProcess,
    subProcessName,
  };
};
