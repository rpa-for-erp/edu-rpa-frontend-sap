import { useState, useEffect, useCallback, useRef } from "react";
import { Problem } from "@/components/Bpmn/ProblemsPanel/ProblemsPanel";
import { trackProblems } from "@/utils/problemTracker";
import { LocalStorage } from "@/constants/localStorage";

/**
 * Interface for bpmnlint issue
 */
export interface LintIssue {
  id: string;
  message: string;
  category: "error" | "warn";
  rule: string;
}

/**
 * Interface for lint issues grouped by element
 */
export interface LintIssuesByElement {
  [elementId: string]: LintIssue[];
}

/**
 * Hook to track problems for a process
 * Combines activity validation problems and bpmnlint issues
 * Automatically updates when localStorage changes or linting completes
 */
export function useProblemTracker(processID: string, modelerRef?: any) {
  const [activityProblems, setActivityProblems] = useState<Problem[]>([]);
  const [lintProblems, setLintProblems] = useState<Problem[]>([]);
  const listenersSetupRef = useRef(false);

  // Convert bpmnlint issues to Problem format
  const convertLintIssuesToProblems = useCallback(
    (issues: LintIssuesByElement): Problem[] => {
      const problems: Problem[] = [];
      let problemIdCounter = 1;

      Object.entries(issues).forEach(([elementId, elementIssues]) => {
        elementIssues.forEach((issue) => {
          problems.push({
            id: `lint_${problemIdCounter++}`,
            type: issue.category === "error" ? "error" : "warning",
            nodeName: elementId,
            content: `[Lint] ${issue.message}`,
          });
        });
      });

      return problems;
    },
    []
  );

  // Update activity validation problems
  const updateActivityProblems = useCallback(() => {
    if (!processID) {
      setActivityProblems([]);
      return;
    }
    const trackedProblems = trackProblems(processID);
    setActivityProblems(trackedProblems);
  }, [processID]);

  // Initial load of activity problems
  useEffect(() => {
    updateActivityProblems();
  }, [updateActivityProblems]);

  // Listen to localStorage changes for activity problems
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LocalStorage.PROCESS_LIST) {
        // Small delay to ensure localStorage is updated
        setTimeout(() => {
          updateActivityProblems();
        }, 100);
      }
    };

    // Listen to storage events from other tabs/windows
    window.addEventListener("storage", handleStorageChange);

    // Also listen to custom events for same-tab updates
    const handleCustomStorageChange = () => {
      setTimeout(() => {
        updateActivityProblems();
      }, 100);
    };

    // Create a custom event listener for same-tab updates
    // This will be triggered when process data is updated in the same tab
    window.addEventListener("processUpdated", handleCustomStorageChange as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("processUpdated", handleCustomStorageChange as EventListener);
    };
  }, [updateActivityProblems]);

  // Setup bpmnlint event listeners
  useEffect(() => {
    const modeler = modelerRef?.bpmnModeler;

    if (!modeler || listenersSetupRef.current) return;

    try {
      const eventBus = modeler.get("eventBus");

      // Listen for linting.completed event
      const handleLintingCompleted = (event: any) => {
        console.log("🔍 [bpmnlint] Linting completed:", event.issues);
        const problems = convertLintIssuesToProblems(event.issues);
        setLintProblems(problems);

        // Dispatch custom event for other components to listen
        window.dispatchEvent(
          new CustomEvent("bpmnlint-updated", {
            detail: { problems, issues: event.issues },
          })
        );
      };

      eventBus.on("linting.completed", handleLintingCompleted);
      listenersSetupRef.current = true;

      // Trigger initial lint after a short delay
      setTimeout(() => {
        try {
          const linting = modeler.get("linting");
          if (linting) {
            linting.lint();
          }
        } catch (e) {
          console.warn("Could not trigger initial lint:", e);
        }
      }, 1000);

      return () => {
        try {
          eventBus.off("linting.completed", handleLintingCompleted);
          listenersSetupRef.current = false;
        } catch (e) {
          // Modeler might be destroyed
        }
      };
    } catch (error) {
      console.warn("Could not setup lint tracking:", error);
    }
  }, [modelerRef?.bpmnModeler, convertLintIssuesToProblems]);

  // Re-lint when diagram changes
  useEffect(() => {
    const modeler = modelerRef?.bpmnModeler;
    if (!modeler) return;

    let debounceTimer: NodeJS.Timeout;

    const handleDiagramChange = () => {
      // Debounce the linting
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        try {
          const linting = modeler.get("linting");
          if (linting) {
            linting.lint();
          }
        } catch (e) {
          // Ignore
        }
      }, 500);
    };

    try {
      const eventBus = modeler.get("eventBus");
      eventBus.on("commandStack.changed", handleDiagramChange);

      return () => {
        clearTimeout(debounceTimer);
        try {
          eventBus.off("commandStack.changed", handleDiagramChange);
        } catch (e) {
          // Modeler might be destroyed
        }
      };
    } catch (e) {
      // Ignore
    }
  }, [modelerRef?.bpmnModeler]);

  // Combine both activity problems and lint problems
  const allProblems = [...lintProblems, ...activityProblems];

  return allProblems;
}

