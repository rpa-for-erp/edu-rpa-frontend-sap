import React, { useState, useEffect, useRef } from "react";
import { Button, Box, Tooltip, HStack, Badge, Icon } from "@chakra-ui/react";
import { ArrowBackIcon, AddIcon } from "@chakra-ui/icons";
import { useBpmn } from "@/hooks/useBpmn";
import {
  hasNestedSubProcesses,
  countSubProcessElements,
} from "@/utils/subprocessExtractor";

interface SubProcessControlsProps {
  bpmnReact?: ReturnType<typeof useBpmn>;
  onCreateProcessFromSubProcess?: (info: {
    name: string;
    elementCount: number;
    hasNested: boolean;
  }) => void;
}

const SubProcessControls: React.FC<SubProcessControlsProps> = ({
  bpmnReact,
  onCreateProcessFromSubProcess,
}) => {
  const [currentRoot, setCurrentRoot] = useState<any>(null);
  const [isInSubProcess, setIsInSubProcess] = useState(false);
  const [hasNested, setHasNested] = useState(false);
  const lastRootIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!bpmnReact?.bpmnModeler) return;

    const canvas = bpmnReact.bpmnModeler.get("canvas") as any;
    const eventBus = bpmnReact.bpmnModeler.get("eventBus") as any;

    const updateRootInfo = async () => {
      try {
        const root = canvas.getRootElement();

        // Check if root actually changed to avoid unnecessary updates
        if (root?.id && root.id !== lastRootIdRef.current) {
          lastRootIdRef.current = root.id;
          setCurrentRoot(root);

          // Check if current root is a subprocess (not the main process)
          const isSubProcess =
            root?.businessObject?.$type === "bpmn:SubProcess";
          setIsInSubProcess(isSubProcess);

          // Check for nested subprocesses
          if (isSubProcess) {
            const nested = hasNestedSubProcesses(
              bpmnReact.bpmnModeler,
              root.id
            );
            setHasNested(nested);

            console.log("═══════════════════════════════════════════");
            console.log("🎯 EXPANDED SUBPROCESS - DRILL DOWN");
            console.log("═══════════════════════════════════════════");
            console.log("📍 SubProcess Name:", root.businessObject.name);
            console.log("📍 SubProcess ID:", root.id);
            console.log("📍 SubProcess Type:", root.businessObject.$type);
            console.log(
              "📊 FlowElements Count:",
              root.businessObject.flowElements?.length || 0
            );

            // Log all elements
            const flowElements = root.businessObject.flowElements || [];
            console.log("\n🔹 Elements breakdown:");
            flowElements.forEach((el: any) => {
              console.log(
                `  - ${el.$type}: ${el.id} ${el.name ? `(${el.name})` : ""}`
              );
            });

            // Check for nested subprocesses
            const children = root.children || [];
            const nestedSubProcesses = children.filter(
              (child: any) =>
                child.businessObject?.$type === "bpmn:SubProcess" ||
                child.businessObject?.$type === "bpmn:subProcess"
            );

            console.log("\n📦 Nested SubProcesses:", nestedSubProcesses.length);
            if (nestedSubProcesses.length > 0) {
              console.log("⚠️ THIS SUBPROCESS CONTAINS NESTED SUBPROCESSES!");
              console.log(
                "→ Publish/RobotCode will require creating new process"
              );
              nestedSubProcesses.forEach((nested: any) => {
                console.log(
                  `  - ${nested.id}: ${
                    nested.businessObject?.name || "Unnamed"
                  }`
                );
              });
            } else {
              console.log("✅ No nested subprocesses");
              console.log("→ Publish/RobotCode will work normally");
            }

            // Try to get XML of current view
            try {
              const { xml } = await bpmnReact.bpmnModeler.saveXML({
                format: true,
              });
              console.log("\n📄 Current XML length:", xml.length);
              console.log("═══════════════════════════════════════════\n");
              // console.log("📄 Full XML:", xml); // Uncomment to see full XML
            } catch (err) {
              console.error("Failed to get XML:", err);
            }
          } else {
            setHasNested(false);
            console.log("═══════════════════════════════════════════");
            console.log("🏠 RETURNED TO MAIN PROCESS");
            console.log("═══════════════════════════════════════════");
            console.log(
              "📍 Process Name:",
              root.businessObject.name || "Main Process"
            );
            console.log("📍 Process ID:", root.id);
            console.log("✅ All features available (Publish, RobotCode, etc.)");
            console.log("═══════════════════════════════════════════\n");
          }
        }
      } catch (error) {
        console.error("Error updating root info:", error);
      }
    };

    // Listen to root element changes
    eventBus.on("root.set", updateRootInfo);

    // Initial check
    setTimeout(updateRootInfo, 100);

    return () => {
      eventBus.off("root.set", updateRootInfo);
    };
  }, [bpmnReact?.bpmnModeler]);

  const goBack = () => {
    if (!bpmnReact?.bpmnModeler || !currentRoot) return;

    const canvas = bpmnReact.bpmnModeler.get("canvas") as any;
    const elementRegistry = bpmnReact.bpmnModeler.get("elementRegistry") as any;

    console.log(
      "⬅️ Going back from subprocess:",
      currentRoot.businessObject?.name
    );

    // Get parent of current root
    const parent = currentRoot.parent;

    if (parent) {
      console.log(
        "⬅️ Navigating to parent:",
        parent.businessObject?.name || parent.id
      );
      // Navigate to parent
      canvas.setRootElement(parent);
      canvas.zoom("fit-viewport");

      // Force state update
      setTimeout(() => {
        setIsInSubProcess(parent.businessObject?.$type === "bpmn:SubProcess");
        setCurrentRoot(parent);
        console.log(
          "✅ State updated after back. Is in subprocess:",
          parent.businessObject?.$type === "bpmn:SubProcess"
        );
      }, 50);
    } else {
      console.log("⬅️ Navigating to main process");
      // Go back to main process (find the process element)
      const elements = elementRegistry.getAll();
      const processElement = elements.find(
        (el: any) => el.businessObject?.$type === "bpmn:Process"
      );

      if (processElement) {
        canvas.setRootElement(processElement);
        canvas.zoom("fit-viewport");

        // Force state update
        setTimeout(() => {
          setIsInSubProcess(false);
          setCurrentRoot(processElement);
          console.log("✅ State updated after back to main process");
        }, 50);
      }
    }
  };

  const handleCreateProcess = () => {
    if (
      !bpmnReact?.bpmnModeler ||
      !currentRoot ||
      !onCreateProcessFromSubProcess
    )
      return;

    const subProcessName = currentRoot?.businessObject?.name || "SubProcess";
    const elementCount = countSubProcessElements(
      bpmnReact.bpmnModeler,
      currentRoot.id
    );

    onCreateProcessFromSubProcess({
      name: subProcessName,
      elementCount,
      hasNested,
    });
  };

  // Don't show if not in subprocess
  if (!isInSubProcess) {
    return null;
  }

  const subProcessName = currentRoot?.businessObject?.name || "SubProcess";

  return (
    <Box position="absolute" top="10px" left="10px" zIndex={1000}>
      <HStack spacing={2}>
        <Tooltip
          label={`Back to parent (Exit ${subProcessName})`}
          placement="right"
        >
          <Button
            size="sm"
            colorScheme="blue"
            leftIcon={<ArrowBackIcon />}
            onClick={goBack}
            shadow="md"
          >
            Back to Process
          </Button>
        </Tooltip>

        {/* Button to create process from subprocess */}
        {onCreateProcessFromSubProcess && (
          <Tooltip
            label="Extract this subprocess as a new standalone process"
            placement="right"
          >
            <Button
              size="sm"
              colorScheme="green"
              leftIcon={<AddIcon />}
              onClick={handleCreateProcess}
              shadow="md"
            >
              Create Process from SubProcess
              {hasNested && (
                <Badge ml={2} colorScheme="orange" fontSize="xs">
                  Nested
                </Badge>
              )}
            </Button>
          </Tooltip>
        )}
      </HStack>
    </Box>
  );
};

export default SubProcessControls;
