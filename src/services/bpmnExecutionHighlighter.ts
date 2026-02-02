/**
 * BPMN Execution Highlighter Service
 *
 * Handles visual highlighting of BPMN nodes during robot execution.
 * Provides smooth animations for step-by-step tracking and sequence flow animations.
 */

import { StepStatus } from '@/hooks/useRobotTrackingSocket';

export interface HighlightConfig {
  running: {
    fill: string;
    stroke: string;
    strokeWidth: number;
  };
  pass: {
    fill: string;
    stroke: string;
    strokeWidth: number;
  };
  error: {
    fill: string;
    stroke: string;
    strokeWidth: number;
  };
  skip: {
    fill: string;
    stroke: string;
    strokeWidth: number;
  };
}

export const DEFAULT_HIGHLIGHT_CONFIG: HighlightConfig = {
  running: {
    fill: '#FEF3C7', // amber.100
    stroke: '#D97706', // amber.600
    strokeWidth: 3,
  },
  pass: {
    fill: '#D1FAE5', // emerald.100
    stroke: '#059669', // emerald.600
    strokeWidth: 2,
  },
  error: {
    fill: '#FEE2E2', // red.100
    stroke: '#DC2626', // red.600
    strokeWidth: 2,
  },
  skip: {
    fill: '#E5E7EB', // gray.200
    stroke: '#6B7280', // gray.500
    strokeWidth: 2,
  },
};

export class BpmnExecutionHighlighter {
  private modeler: any;
  private config: HighlightConfig;
  private overlays: any;
  private canvas: any;
  private elementRegistry: any;
  private graphicsFactory: any;
  private eventBus: any;
  private activeOverlays: Map<string, string[]> = new Map();
  private animationCleanup: Map<string, () => void> = new Map();

  constructor(modeler: any, config: HighlightConfig = DEFAULT_HIGHLIGHT_CONFIG) {
    this.modeler = modeler;
    this.config = config;
    this.overlays = modeler.get('overlays');
    this.canvas = modeler.get('canvas');
    this.elementRegistry = modeler.get('elementRegistry');
    this.graphicsFactory = modeler.get('graphicsFactory');
    this.eventBus = modeler.get('eventBus');
  }

  /**
   * Highlight a node with status
   */
  highlightNode(nodeId: string, status: StepStatus): void {
    const element = this.elementRegistry.get(nodeId);
    if (!element) {
      console.warn(`[BpmnHighlighter] Node not found: ${nodeId}`);
      return;
    }

    // Clear existing highlights for this node
    this.clearNodeHighlight(nodeId);

    const colorConfig = this.getColorConfig(status);
    
    // Create highlight overlay
    const overlayId = this.createHighlightOverlay(element, colorConfig, status);
    
    // Store overlay reference
    const existingOverlays = this.activeOverlays.get(nodeId) || [];
    existingOverlays.push(overlayId);
    this.activeOverlays.set(nodeId, existingOverlays);

    // Add pulse animation for running status
    if (status === 'RUNNING') {
      this.addPulseAnimation(nodeId, element);
    }
  }

  /**
   * Get color configuration for status
   */
  private getColorConfig(status: StepStatus) {
    switch (status) {
      case 'RUNNING':
        return this.config.running;
      case 'PASS':
        return this.config.pass;
      case 'ERROR':
      case 'FAIL':
        return this.config.error;
      case 'SKIP':
        return this.config.skip;
      default:
        return this.config.pass;
    }
  }

  /**
   * Create highlight overlay for an element
   */
  private createHighlightOverlay(element: any, colorConfig: any, status: StepStatus): string {
    const width = element.width || 100;
    const height = element.height || 80;

    // Create status badge
    const statusEmoji = this.getStatusEmoji(status);
    const statusClass = `execution-status-${status.toLowerCase()}`;

    const overlayHtml = document.createElement('div');
    overlayHtml.className = `bpmn-execution-overlay ${statusClass}`;
    overlayHtml.innerHTML = `
      <div class="execution-status-badge">
        <span class="status-emoji">${statusEmoji}</span>
      </div>
    `;

    overlayHtml.style.cssText = `
      position: absolute;
      pointer-events: none;
      width: ${width + 8}px;
      height: ${height + 8}px;
      margin-left: -4px;
      margin-top: -4px;
      border: ${colorConfig.strokeWidth}px solid ${colorConfig.stroke};
      border-radius: 10px;
      background-color: ${colorConfig.fill};
      opacity: 0.7;
      transition: all 0.3s ease-in-out;
      box-shadow: 0 0 15px ${colorConfig.stroke}40;
    `;

    // Style the badge
    const badge = overlayHtml.querySelector('.execution-status-badge') as HTMLElement;
    if (badge) {
      badge.style.cssText = `
        position: absolute;
        top: -12px;
        right: -12px;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: ${colorConfig.stroke};
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        font-size: 14px;
        animation: ${status === 'RUNNING' ? 'pulse-badge 1.5s ease-in-out infinite' : 'pop-in 0.3s ease-out'};
      `;
    }

    const overlayId = this.overlays.add(element, 'execution-highlight', {
      position: {
        top: 0,
        left: 0,
      },
      html: overlayHtml,
    });

    return overlayId;
  }

  /**
   * Get emoji for status
   */
  private getStatusEmoji(status: StepStatus): string {
    switch (status) {
      case 'RUNNING':
        return '⏳';
      case 'PASS':
        return '✅';
      case 'ERROR':
      case 'FAIL':
        return '❌';
      case 'SKIP':
        return '⏭️';
      default:
        return '•';
    }
  }

  /**
   * Add pulse animation for running nodes
   */
  private addPulseAnimation(nodeId: string, element: any): void {
    const gfx = this.elementRegistry._elements[nodeId]?.gfx;
    if (gfx) {
      gfx.classList.add('bpmn-node-running');
    }

    // Store cleanup function
    this.animationCleanup.set(nodeId, () => {
      if (gfx) {
        gfx.classList.remove('bpmn-node-running');
      }
    });
  }

  /**
   * Animate sequence flow between nodes
   */
  animateSequenceFlow(sourceNodeId: string, targetNodeId: string): void {
    const sourceElement = this.elementRegistry.get(sourceNodeId);
    const targetElement = this.elementRegistry.get(targetNodeId);

    if (!sourceElement || !targetElement) {
      console.warn('[BpmnHighlighter] Cannot find source or target for flow animation');
      return;
    }

    // Find connecting sequence flow
    const connections = sourceElement.outgoing || [];
    const flow = connections.find((conn: any) => 
      conn.target?.id === targetNodeId && conn.type === 'bpmn:SequenceFlow'
    );

    if (flow) {
      this.addFlowAnimation(flow);
    }
  }

  /**
   * Add animation to sequence flow
   */
  private addFlowAnimation(flow: any): void {
    const flowGfx = this.elementRegistry._elements[flow.id]?.gfx;
    if (!flowGfx) return;

    // Add animated class
    flowGfx.classList.add('bpmn-flow-animated');

    // Create flow particle overlay
    const overlayHtml = document.createElement('div');
    overlayHtml.className = 'flow-particle-container';
    overlayHtml.innerHTML = `<div class="flow-particle"></div>`;

    // Calculate flow path for animation
    const waypoints = flow.waypoints || [];
    if (waypoints.length >= 2) {
      const startX = waypoints[0].x;
      const startY = waypoints[0].y;
      
      overlayHtml.style.cssText = `
        position: absolute;
        pointer-events: none;
      `;

      const particle = overlayHtml.querySelector('.flow-particle') as HTMLElement;
      if (particle) {
        particle.style.cssText = `
          width: 10px;
          height: 10px;
          background: linear-gradient(135deg, #3B82F6, #10B981);
          border-radius: 50%;
          box-shadow: 0 0 10px #3B82F6, 0 0 20px #10B981;
          animation: flow-particle-move 0.8s ease-in-out forwards;
        `;
      }

      const overlayId = this.overlays.add(flow.source, 'flow-animation', {
        position: {
          top: startY - (flow.source.y || 0),
          left: startX - (flow.source.x || 0),
        },
        html: overlayHtml,
      });

      // Remove after animation
      setTimeout(() => {
        this.overlays.remove(overlayId);
        flowGfx.classList.remove('bpmn-flow-animated');
      }, 800);
    }
  }

  /**
   * Clear highlight from a specific node
   */
  clearNodeHighlight(nodeId: string): void {
    const overlayIds = this.activeOverlays.get(nodeId);
    if (overlayIds) {
      overlayIds.forEach((id) => {
        try {
          this.overlays.remove(id);
        } catch (e) {
          // Overlay might already be removed
        }
      });
      this.activeOverlays.delete(nodeId);
    }

    // Run animation cleanup
    const cleanup = this.animationCleanup.get(nodeId);
    if (cleanup) {
      cleanup();
      this.animationCleanup.delete(nodeId);
    }
  }

  /**
   * Clear all highlights
   */
  clearAllHighlights(): void {
    this.activeOverlays.forEach((_, nodeId) => {
      this.clearNodeHighlight(nodeId);
    });
    this.activeOverlays.clear();
    this.animationCleanup.clear();
  }

  /**
   * Scroll to and center a node
   */
  centerOnNode(nodeId: string): void {
    const element = this.elementRegistry.get(nodeId);
    if (element) {
      this.canvas.scrollToElement(element);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<HighlightConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get CSS styles to inject
   */
  static getGlobalStyles(): string {
    return `
      /* Execution Highlight Animations */
      @keyframes pulse-badge {
        0%, 100% {
          transform: scale(1);
          opacity: 1;
        }
        50% {
          transform: scale(1.2);
          opacity: 0.8;
        }
      }

      @keyframes pop-in {
        0% {
          transform: scale(0);
          opacity: 0;
        }
        50% {
          transform: scale(1.2);
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }

      @keyframes flow-particle-move {
        0% {
          transform: translate(0, 0) scale(1);
          opacity: 1;
        }
        100% {
          transform: translate(var(--flow-dx, 100px), var(--flow-dy, 0)) scale(0.5);
          opacity: 0;
        }
      }

      @keyframes node-pulse {
        0%, 100% {
          filter: brightness(1);
        }
        50% {
          filter: brightness(1.1);
        }
      }

      .bpmn-node-running {
        animation: node-pulse 1.5s ease-in-out infinite;
      }

      .bpmn-flow-animated path {
        stroke: #3B82F6 !important;
        stroke-width: 3px !important;
        stroke-dasharray: 10, 5;
        animation: dash-flow 0.5s linear infinite;
      }

      @keyframes dash-flow {
        to {
          stroke-dashoffset: -15;
        }
      }

      .bpmn-execution-overlay {
        z-index: 100;
      }

      /* Status-specific styles */
      .execution-status-running .execution-status-badge {
        background: linear-gradient(135deg, #F59E0B, #D97706) !important;
      }

      .execution-status-pass .execution-status-badge {
        background: linear-gradient(135deg, #10B981, #059669) !important;
      }

      .execution-status-error .execution-status-badge,
      .execution-status-fail .execution-status-badge {
        background: linear-gradient(135deg, #EF4444, #DC2626) !important;
      }

      .execution-status-skip .execution-status-badge {
        background: linear-gradient(135deg, #9CA3AF, #6B7280) !important;
      }

      .status-emoji {
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
      }
    `;
  }
}

export default BpmnExecutionHighlighter;
