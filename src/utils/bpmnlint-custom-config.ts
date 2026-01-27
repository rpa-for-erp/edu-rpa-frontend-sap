/**
 * Custom BPMN Lint configuration
 * Only includes rules requested by the user:
 * - No Gateway Join Fork
 * - Start/End Event Required
 * - Fake Join
 * - Conditional Flows
 * - No Disconnected
 * - Single Blank Start Event
 */

// Import the bundled config which contains all rules
import bpmnlintBundle from './bpmnlint-config';

// Custom rules configuration - only enable specific rules
const customRules = {
  // Disable all rules from the default config first
  "ad-hoc-sub-process": "off",
  "event-based-gateway": "off",
  "event-sub-process-typed-start-event": "off",
  "global": "off",
  "label-required": "off",
  "link-event": "off",
  "no-bpmndi": "off",
  "no-complex-gateway": "off",
  "no-duplicate-sequence-flows": "off",
  "no-implicit-split": "off",
  "no-implicit-end": "off",
  "no-implicit-start": "off",
  "no-inclusive-gateway": "off",
  "no-overlapping-elements": "off",
  "single-event-definition": "off",
  "sub-process-blank-start-event": "off",
  "superfluous-gateway": "off",
  "superfluous-termination": "off",

  // Enable only the requested rules
  "no-gateway-join-fork": "error",       // No Gateway Join Fork
  "start-event-required": "error",        // Start event required
  "end-event-required": "error",          // End event required  
  "fake-join": "error",                   // Fake Join
  "conditional-flows": "error",           // Conditional Flows
  "no-disconnected": "error",             // No disconnected elements
  "single-blank-start-event": "error",    // Single Blank Start Event
};

// Create custom config that uses the same resolver but with custom rules
export const customBpmnlintConfig = {
  resolver: bpmnlintBundle.resolver,
  config: {
    rules: customRules
  }
};

export default customBpmnlintConfig;
