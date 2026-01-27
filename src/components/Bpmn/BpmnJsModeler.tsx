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
//@ts-ignore
import EmbeddedCommentsModule from "bpmn-js-embedded-comments";
//@ts-ignore
import lintModule from "bpmn-js-bpmnlint";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-font/dist/css/bpmn-embedded.css";
import "bpmn-js-token-simulation/assets/css/bpmn-js-token-simulation.css";
import "bpmn-js-embedded-comments/assets/comments.css";
import "bpmn-js-bpmnlint/dist/assets/css/bpmn-js-bpmnlint.css";
import { useParams } from "next/navigation";
import { QUERY_KEY } from "@/constants/queryKey";
import processApi from "@/apis/processApi";
import { useQuery } from "@tanstack/react-query";
import CustomContextPadProvider from "./CustomContextPadProvider";
import customBpmnlintConfig from "@/utils/bpmnlint-custom-config";

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
      linting: {
        bpmnlint: customBpmnlintConfig,
        active: true,
      },
      additionalModules: [
        CustomContextPadProvider,
        BpmnColorPickerModule,
        gridModule,
        minimapModule,
        TokenSimulationModule,
        EmbeddedCommentsModule,
        lintModule,
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
        
        /* Hide the default bpmnlint panel and overlays - we show errors in the Problems tab instead */
        .bjsl-button,
        .bjsl-button-error,
        .bjsl-button-warning,
        .bjsl-button-success,
       
        .bjsl-issues,
        .bjsl-dropdown {
          display: none !important;
        }
        
        /* Context Pad Comment Icon */
        .bpmn-icon-comments::before {
          content: "💬" !important;
          font-size: 16px;
        }
        
        /* Embedded Comments - Modern Style */
        .comments-overlay {
          background: #fff !important;
          border-radius: 8px !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
          padding: 0 !important;
          overflow: hidden;
        }
        
        .comments-overlay .toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 0px 2px;
          cursor: pointer;
          transition: background 0.2s;
          background: #f7fafc;
          border-radius: 8px;
          position: relative;
        }
        
        .comments-overlay .toggle:hover {
          background: #edf2f7;
        }
        
        .comments-overlay .comment-count {
          font-size: 12px;
          color: #4a5568;
          font-weight: 500;
        }
        
        .comments-overlay.expanded {
          min-width: 280px;
        }
        
        .comments-overlay.expanded .toggle {
          border-radius: 8px 8px 0 0;
          border-bottom: 1px solid #e2e8f0;
          justify-content: space-between;
          padding: 2px 4px;
        }
        
        /* Close button (X) when expanded */
        .comments-overlay.expanded .toggle::after {
          content: "✕";
          font-size: 8px;
          color: #718096;
          cursor: pointer;
          padding: 2px 6px;
          border-radius: 4px;
          transition: all 0.2s;
        }
        
        .comments-overlay.expanded .toggle:hover::after {
          color: #e53e3e;
          background: #fed7d7;
        }
        
        .comments-overlay .content {
          padding: 12px;
          background: #fff;
        }
        
        .comments-overlay .comments {
          max-height: 180px;
          overflow-y: auto;
          margin-bottom: 10px;
        }
        
        .comments-overlay .comment {
          background: #f7fafc;
          border-radius: 6px;
          padding: 2px 4px;
          margin-bottom: 4px;
          border: none !important;
          position: relative;
        }
        
        .comments-overlay .comment:last-child {
          margin-bottom: 0;
        }
        
        .comments-overlay .comment [data-text] {
          font-size: 13px;
          color: #2d3748;
          line-height: 1.5;
          word-wrap: break-word;
        }
        
        .comments-overlay .comment .delete {
          position: absolute;
          right: 8px;
          top: 8px;
          opacity: 0;
          transition: opacity 0.2s;
          color: #e53e3e;
          text-decoration: none;
          font-size: 12px;
        }
        
        .comments-overlay .comment:hover .delete {
          opacity: 1;
          display: block;
        }
        
        .comments-overlay .icon-delete::before {
          content: "✕";
          font-size: 12px;
        }
        
        .comments-overlay .edit {
          margin-top: 8px;
        }
        
        .comments-overlay textarea {
          width: 100%;
          min-height: 70px;
          padding: 10px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          resize: vertical;
          font-size: 13px;
          font-family: inherit;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        
        .comments-overlay textarea:focus {
          outline: none;
          border-color: #319795;
          box-shadow: 0 0 0 3px rgba(49, 151, 149, 0.1);
        }
        
        .comments-overlay textarea::placeholder {
          color: #a0aec0;
        }
        
        /* With comments indicator */
        .comments-overlay.with-comments .toggle {
          background: #e6fffa;
        }
        
        .comments-overlay.with-comments .toggle:hover {
          background: #b2f5ea;
        }
      `}</style>
      <div id="bpmnview" style={{ width: "100%", height: "100%" }}></div>
    </div>
  );
};

export default forwardRef(BpmnJsModeler);
