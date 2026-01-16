import { convertJsonToBpmn } from "./src/utils/bpmn-parser/json-to-bpmn-xml.util";

const testData = {
  bpmn: {
    nodes: [
      {
        id: "s1",
        type: "StartEvent",
        name: "Bắt đầu",
        in_loop: false,
      },
      {
        id: "n2",
        type: "ServiceTask",
        name: "Nhận danh sách bài làm",
        in_loop: false,
      },
      {
        id: "n3",
        type: "ServiceTask",
        name: "Chấm điểm bài làm",
        in_loop: true,
      },
      {
        id: "n4",
        type: "ServiceTask",
        name: "Lưu kết quả chấm điểm",
        in_loop: true,
      },
      {
        id: "n5",
        type: "ServiceTask",
        name: "Gửi thông báo",
        in_loop: false,
      },
      {
        id: "e1",
        type: "EndEvent",
        name: "Kết thúc",
        in_loop: false,
      },
    ],
    flows: [
      { source: "s1", target: "n2", type: "SequenceFlow", condition: null },
      { source: "n2", target: "n3", type: "SequenceFlow", condition: null },
      { source: "n3", target: "n4", type: "SequenceFlow", condition: null },
      { source: "n4", target: "n5", type: "SequenceFlow", condition: null },
      { source: "n5", target: "e1", type: "SequenceFlow", condition: null },
    ],
  },
};

const result = convertJsonToBpmn(testData);

if (result.success && result.xml) {
  console.log("=== Generated XML ===");
  console.log(result.xml);

  // Check subprocess elements
  const hasSubProcess = result.xml.includes("<bpmn:subProcess");
  const hasExpandedShape = result.xml.includes('isExpanded="true"');

  console.log("\n=== Verification ===");
  console.log("Has subprocess:", hasSubProcess);
  console.log("Has isExpanded:", hasExpandedShape);

  // Extract subprocess ID and check shape
  const subProcessMatch = result.xml.match(/<bpmn:subProcess id="([^"]+)"/);
  if (subProcessMatch) {
    const subProcessId = subProcessMatch[1];
    console.log("SubProcess ID:", subProcessId);

    const shapeMatch = result.xml.match(
      new RegExp(`bpmnElement="${subProcessId}"`)
    );
    console.log("Has matching BPMNShape:", !!shapeMatch);

    if (!shapeMatch) {
      console.log(
        "\n❌ ERROR: BPMNShape with bpmnElement matching subprocess ID not found!"
      );

      // Show all bpmnElements
      const allShapes = result.xml.match(/bpmnElement="[^"]+"/g);
      console.log("All bpmnElements:", allShapes);
    } else {
      console.log("\n✅ SUCCESS: BPMNShape matches subprocess ID");
    }
  }
} else {
  console.error("Errors:", result.errors);
}
