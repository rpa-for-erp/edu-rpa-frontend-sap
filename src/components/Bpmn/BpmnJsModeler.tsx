import React, {
  forwardRef,
  ForwardRefRenderFunction,
  Ref,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import CamundaBpmnModeler from "bpmn-js/lib/Modeler";
import {
  BpmnJsReactHandle,
  BpmnJsReactProps,
} from "@/interfaces/bpmnJsReact.interface";
//@ts-ignore
import BpmnColorPickerModule from "bpmn-js-color-picker";
import minimapModule from "diagram-js-minimap";
//@ts-ignore
import gridModule from "diagram-js-grid";
//@ts-ignore
import TokenSimulationModule from "bpmn-js-token-simulation";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-font/dist/css/bpmn-embedded.css";
import "bpmn-js-token-simulation/assets/css/bpmn-js-token-simulation.css";
import { useParams } from "next/navigation";
import { QUERY_KEY } from "@/constants/queryKey";
import processApi from "@/apis/processApi";
import { useQuery } from "@tanstack/react-query";
import CustomContextPadProvider from "./CustomContextPadProvider";

const BpmnJsModeler: ForwardRefRenderFunction<
  BpmnJsReactHandle,
  BpmnJsReactProps
> = (
  {
    useBpmnJsReact,
    height,
    onError = () => {},
    onShown = () => {},
  }: BpmnJsReactProps,
  ref
) => {
  const params = useParams();
  const [bpmnEditor, setBpmnEditor] = useState<CamundaBpmnModeler | null>(null);

  const { data: processDetail, isLoading } = useQuery({
    queryKey: [QUERY_KEY.PROCESS_DETAIL],
    queryFn: () => processApi.getProcessByID(params.id as string),
  });

  useEffect(() => {
    const newModeler = new CamundaBpmnModeler({
      container: "#bpmnview",
      keyboard: {
        bindTo: window,
      },
      additionalModules: [
        CustomContextPadProvider,
        BpmnColorPickerModule,
        gridModule,
        minimapModule,
        TokenSimulationModule,
      ],
      height: "100%",
    });
    useBpmnJsReact?.setBpmnModeler(newModeler);
    setBpmnEditor(newModeler);

    // Setup keyboard shortcuts for Undo/Redo
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!newModeler) return;

      const commandStack = newModeler.get("commandStack") as any;

      // Undo: Ctrl+Z (Windows/Linux) or Cmd+Z (Mac)
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key === "z" &&
        !event.shiftKey
      ) {
        event.preventDefault();
        if (commandStack?.canUndo()) {
          commandStack.undo();
        }
        return;
      }

      // Redo: Ctrl+Y (Windows/Linux) or Cmd+Shift+Z (Mac) or Ctrl+Shift+Z
      if (
        ((event.ctrlKey || event.metaKey) && event.key === "y") ||
        ((event.ctrlKey || event.metaKey) &&
          event.shiftKey &&
          event.key === "z")
      ) {
        event.preventDefault();
        if (commandStack?.canRedo()) {
          commandStack.redo();
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      bpmnEditor?.destroy();
    };
  }, []);

  useEffect(() => {
    if (isLoading && !processDetail) return;
    bpmnEditor?.importXML(processDetail?.xml as string);
    bpmnEditor?.on("import.done", (event: any) => {
      const { error, warning } = event;
      if (error) {
        return onError(error);
      }
      zoomFit();
      onShown(warning);
    });
  }, [bpmnEditor]);

  const zoomFit = () => {
    (bpmnEditor as any).get("canvas").zoom("fit-viewport");
  };

  return (
    <div className="bpmn-wrapper" style={{ width: "100%", height: "100%" }}>
      {/* Hide the default token simulation toggle button on canvas */}
      <style>{`
        .bts-toggle-mode {
          display: none !important;
        }
      `}</style>
      <div id="bpmnview" style={{ width: "100%", height: "100%" }}></div>
    </div>
  );
};

export default forwardRef(BpmnJsModeler);
