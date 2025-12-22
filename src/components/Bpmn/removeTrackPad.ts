import PaletteProvider from "bpmn-js/lib/features/palette/PaletteProvider";

const removeUnsupportedBpmnFunctions = () => {
  const { getPaletteEntries } = PaletteProvider.prototype;
  PaletteProvider.prototype.getPaletteEntries = function () {
    const entries = getPaletteEntries.apply(this);
    delete entries["create.intermediate-event"];
    delete entries["create.data-store"];
    delete entries["create.data-object"];
    // Keep create.participant-expanded and create.group
    return entries;
  };

  class CustomContextPadProvider {
    private bpmnReplace: any;
    private translate: any;
    private modeling: any;
    static $inject: string[];

    constructor(
      contextPad: any,
      bpmnReplace: any,
      translate: any,
      modeling: any
    ) {
      this.bpmnReplace = bpmnReplace;
      this.translate = translate;
      this.modeling = modeling;
      contextPad.registerProvider(this);
    }

    getContextPadEntries(element: any) {
      const bpmnReplace = this.bpmnReplace;
      const translate = this.translate;
      const modeling = this.modeling;

      return function (entries: any) {
        const customizesEntries = entries;

        // Remove unwanted entries
        delete customizesEntries["append.text-annotation"];
        delete customizesEntries["append.gateway"];
        delete customizesEntries["append.intermediate-event"];
        delete customizesEntries["lane-insert-above"];
        delete customizesEntries["lane-divide-two"];
        delete customizesEntries["lane-divide-three"];
        delete customizesEntries["lane-insert-below"];
        delete customizesEntries.replace;

        const businessObject = element.businessObject;

        // Add change type menu for Tasks
        if (
          businessObject.$type === "bpmn:Task" ||
          businessObject.$type === "bpmn:UserTask" ||
          businessObject.$type === "bpmn:ServiceTask" ||
          businessObject.$type === "bpmn:ManualTask" ||
          businessObject.$type === "bpmn:SendTask" ||
          businessObject.$type === "bpmn:ReceiveTask" ||
          businessObject.$type === "bpmn:ScriptTask" ||
          businessObject.$type === "bpmn:BusinessRuleTask"
        ) {
          // Change to Task
          if (businessObject.$type !== "bpmn:Task") {
            customizesEntries["replace-with-task"] = {
              group: "edit",
              className: "bpmn-icon-task",
              title: translate("Change to Task"),
              action: function () {
                const oldId = element.id;
                const oldName = element.businessObject.name;
                const newElement = bpmnReplace.replaceElement(element, {
                  type: "bpmn:Task",
                });
                // Keep the same ID and name
                if (newElement && newElement.id !== oldId) {
                  modeling.updateProperties(newElement, {
                    id: oldId,
                    name: oldName,
                  });
                }
              },
            };
          }

          // Change to User Task
          if (businessObject.$type !== "bpmn:UserTask") {
            customizesEntries["replace-with-user-task"] = {
              group: "edit",
              className: "bpmn-icon-user-task",
              title: translate("Change to User Task"),
              action: function () {
                const oldId = element.id;
                const oldName = element.businessObject.name;
                const newElement = bpmnReplace.replaceElement(element, {
                  type: "bpmn:UserTask",
                });
                // Keep the same ID and name
                if (newElement && newElement.id !== oldId) {
                  modeling.updateProperties(newElement, {
                    id: oldId,
                    name: oldName,
                  });
                }
              },
            };
          }

          // Change to Manual Task
          if (businessObject.$type !== "bpmn:ManualTask") {
            customizesEntries["replace-with-manual-task"] = {
              group: "edit",
              className: "bpmn-icon-manual-task",
              title: translate("Change to Manual Task"),
              action: function () {
                const oldId = element.id;
                const oldName = element.businessObject.name;
                const newElement = bpmnReplace.replaceElement(element, {
                  type: "bpmn:ManualTask",
                });
                // Keep the same ID and name
                if (newElement && newElement.id !== oldId) {
                  modeling.updateProperties(newElement, {
                    id: oldId,
                    name: oldName,
                  });
                }
              },
            };
          }

          // Change to Send Task
          if (businessObject.$type !== "bpmn:SendTask") {
            customizesEntries["replace-with-send-task"] = {
              group: "edit",
              className: "bpmn-icon-send-task",
              title: translate("Change to Send Task"),
              action: function () {
                const oldId = element.id;
                const oldName = element.businessObject.name;
                const newElement = bpmnReplace.replaceElement(element, {
                  type: "bpmn:SendTask",
                });
                // Keep the same ID and name
                if (newElement && newElement.id !== oldId) {
                  modeling.updateProperties(newElement, {
                    id: oldId,
                    name: oldName,
                  });
                }
              },
            };
          }

          // Change to Receive Task
          if (businessObject.$type !== "bpmn:ReceiveTask") {
            customizesEntries["replace-with-receive-task"] = {
              group: "edit",
              className: "bpmn-icon-receive-task",
              title: translate("Change to Receive Task"),
              action: function () {
                const oldId = element.id;
                const oldName = element.businessObject.name;
                const newElement = bpmnReplace.replaceElement(element, {
                  type: "bpmn:ReceiveTask",
                });
                // Keep the same ID and name
                if (newElement && newElement.id !== oldId) {
                  modeling.updateProperties(newElement, {
                    id: oldId,
                    name: oldName,
                  });
                }
              },
            };
          }
        }

        // Add change type menu for Gateways
        if (
          businessObject.$type === "bpmn:ExclusiveGateway" ||
          businessObject.$type === "bpmn:ParallelGateway" ||
          businessObject.$type === "bpmn:InclusiveGateway" ||
          businessObject.$type === "bpmn:EventBasedGateway"
        ) {
          // Change to Exclusive Gateway
          if (businessObject.$type !== "bpmn:ExclusiveGateway") {
            customizesEntries["replace-with-exclusive-gateway"] = {
              group: "edit",
              className: "bpmn-icon-gateway-xor",
              title: translate("Change to Exclusive Gateway"),
              action: function () {
                const oldId = element.id;
                const oldName = element.businessObject.name;
                const newElement = bpmnReplace.replaceElement(element, {
                  type: "bpmn:ExclusiveGateway",
                });
                // Keep the same ID and name
                if (newElement && newElement.id !== oldId) {
                  modeling.updateProperties(newElement, {
                    id: oldId,
                    name: oldName,
                  });
                }
              },
            };
          }

          // Change to Parallel Gateway
          if (businessObject.$type !== "bpmn:ParallelGateway") {
            customizesEntries["replace-with-parallel-gateway"] = {
              group: "edit",
              className: "bpmn-icon-gateway-parallel",
              title: translate("Change to Parallel Gateway"),
              action: function () {
                const oldId = element.id;
                const oldName = element.businessObject.name;
                const newElement = bpmnReplace.replaceElement(element, {
                  type: "bpmn:ParallelGateway",
                });
                // Keep the same ID and name
                if (newElement && newElement.id !== oldId) {
                  modeling.updateProperties(newElement, {
                    id: oldId,
                    name: oldName,
                  });
                }
              },
            };
          }
        }

        return customizesEntries;
      };
    }
  }

  CustomContextPadProvider.$inject = [
    "contextPad",
    "bpmnReplace",
    "translate",
    "modeling",
  ];

  return CustomContextPadProvider;
};

export default removeUnsupportedBpmnFunctions;
