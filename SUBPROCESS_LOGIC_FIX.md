# SubProcess Logic Fix - Publish/Robot Code Behavior

## 🎯 Correct Logic

Khi user click **"Publish"** hoặc **"Run Robot Code"** trong subprocess:

### Case 1: SubProcess có nested subprocesses ✅
```
User trong SubProcess A
  ├─ Task 1
  ├─ SubProcess B (nested!)  ← Có subprocess con
  └─ Task 2

→ BẮT BUỘC hiện popup "Create Process from SubProcess"
→ User phải tạo process mới từ SubProcess A
```

### Case 2: SubProcess KHÔNG có nested ✅
```
User trong SubProcess A
  ├─ Task 1
  ├─ Task 2  ← Chỉ có tasks, không có subprocess con
  └─ Task 3

→ Compile/Publish BÌNH THƯỜNG
→ KHÔNG cần tạo process mới
```

## 🐛 Problem

### Issue 1: Logic bị ngược
**Before (Wrong)**:
```typescript
if (hasNested) {
  // Show modal ✅
} else {
  // Show warning and return ❌ SAI!
  toast({ title: "Cannot publish..." });
  return;
}
```

→ Subprocess KHÔNG có nested bị block, không thể publish!

### Issue 2: State không update kịp
```typescript
const { isInSubProcess } = useSubProcessContext(bpmnReactJs);

// User drill down vào subprocess
// → State chưa update kịp
// → isInSubProcess vẫn = false
// → Logic không chạy!
```

## ✅ Solution

### 1. Fix Logic Flow

**After (Correct)**:
```typescript
if (hasNested) {
  // Show modal and STOP
  onOpenCreateFromSubProcess();
  return;
}

// No nested → CONTINUE with normal flow
// (don't return, let code continue below)
```

### 2. Check Canvas Directly (Not State)

**Before (State-based)**:
```typescript
if (isInSubProcess && bpmnReactJs.bpmnModeler) {
  // Check nested...
}
```

→ Dựa vào state từ hook → Có thể chậm update

**After (Direct check)**:
```typescript
if (bpmnReactJs.bpmnModeler) {
  const canvas = bpmnReactJs.bpmnModeler.get("canvas");
  const currentRoot = canvas.getRootElement();
  const isCurrentlyInSubProcess = 
    currentRoot?.businessObject?.$type === "bpmn:SubProcess";
  
  if (isCurrentlyInSubProcess) {
    // Check nested...
  }
}
```

→ Lấy giá trị real-time trực tiếp từ canvas!

### 3. Add Detailed Logging

```typescript
console.log("📍 Current root type:", currentRoot?.businessObject?.$type);
console.log("📍 Is in subprocess:", isCurrentlyInSubProcess);
console.log("📦 SubProcess has nested:", hasNested);
```

### 4. Fix hasNestedSubProcesses Function

Check both casing variants:
```typescript
const isSubProcess = 
  type === "bpmn:SubProcess" || 
  type === "bpmn:subProcess";
```

Add logging:
```typescript
console.log("🔍 Checking for nested subprocesses in:", subProcessId);
console.log("  ✅ Found nested subprocess:", child.id);
console.log("📊 Has nested subprocesses:", hasNested);
```

## 📋 Complete Implementation

### File: `src/components/Bpmn/CustomModeler.tsx`

#### handlePublish()
```typescript
const handlePublish = async () => {
  // Check directly from canvas (not state)
  if (bpmnReactJs.bpmnModeler) {
    const canvas = bpmnReactJs.bpmnModeler.get("canvas") as any;
    const currentRoot = canvas.getRootElement();
    const isCurrentlyInSubProcess = 
      currentRoot?.businessObject?.$type === "bpmn:SubProcess";
    
    console.log("📍 Current root type:", currentRoot?.businessObject?.$type);
    console.log("📍 Is in subprocess:", isCurrentlyInSubProcess);

    if (isCurrentlyInSubProcess) {
      const hasNested = hasNestedSubProcesses(
        bpmnReactJs.bpmnModeler,
        currentRoot.id
      );
      
      console.log("📦 SubProcess has nested:", hasNested);

      if (hasNested) {
        // MUST create new process
        const elementCount = countSubProcessElements(...);
        const currentSubProcessName = currentRoot?.businessObject?.name || "SubProcess";
        
        setSubProcessInfo({
          name: currentSubProcessName,
          elementCount,
          hasNested: true,
          action: "publish",
        });
        onOpenCreateFromSubProcess();
        return; // STOP - don't continue to publish
      }
      
      // No nested → CONTINUE with normal publish
      console.log("✅ No nested subprocess, proceeding with normal publish");
    }
  }

  // Normal publish flow continues here...
  try {
    const result = compileRobotCodePublish(processID as string);
    // ...
  }
};
```

#### handleRobotCode()
```typescript
const handleRobotCode = async () => {
  // Same logic as handlePublish
  if (bpmnReactJs.bpmnModeler) {
    const canvas = bpmnReactJs.bpmnModeler.get("canvas") as any;
    const currentRoot = canvas.getRootElement();
    const isCurrentlyInSubProcess = 
      currentRoot?.businessObject?.$type === "bpmn:SubProcess";

    if (isCurrentlyInSubProcess) {
      const hasNested = hasNestedSubProcesses(...);

      if (hasNested) {
        // MUST create new process
        setSubProcessInfo({...});
        onOpenCreateFromSubProcess();
        return; // STOP
      }
      
      // No nested → CONTINUE
      console.log("✅ No nested subprocess, proceeding with normal compilation");
    }
  }

  // Normal robot code flow continues here...
  if (bpmnReactJs.bpmnModeler) {
    const xmlResult = await bpmnReactJs.saveXML();
    // ...
  }
};
```

### File: `src/utils/subprocessExtractor.ts`

#### hasNestedSubProcesses()
```typescript
export function hasNestedSubProcesses(
  modeler: any,
  subProcessId: string
): boolean {
  try {
    const elementRegistry = modeler.get("elementRegistry");
    const subProcess = elementRegistry.get(subProcessId);

    if (!subProcess) {
      console.warn("⚠️ SubProcess not found:", subProcessId);
      return false;
    }

    const children = subProcess.children || [];
    
    console.log("🔍 Checking for nested subprocesses in:", subProcessId);
    console.log("🔍 Children count:", children.length);

    const hasNested = children.some((child: any) => {
      const type = child.businessObject?.$type;
      const isSubProcess = 
        type === "bpmn:SubProcess" || 
        type === "bpmn:subProcess";
        
      if (isSubProcess) {
        console.log("  ✅ Found nested subprocess:", child.id, child.businessObject?.name);
      }
      return isSubProcess;
    });
    
    console.log("📊 Has nested subprocesses:", hasNested);
    return hasNested;
  } catch (error) {
    console.error("Error checking nested subprocesses:", error);
    return false;
  }
}
```

## 🧪 Testing

### Test Case 1: Nested SubProcess
```
1. Tạo process với:
   - SubProcess A
     ├─ Task 1
     ├─ SubProcess B (nested!)
     └─ Task 2

2. Drill down vào SubProcess A

3. Click "Publish" hoặc "Run Robot Code"

Expected Console Output:
📍 Current root type: bpmn:SubProcess
📍 Is in subprocess: true
🔍 Checking for nested subprocesses in: SubProcess_A
🔍 Children count: 3
  ✅ Found nested subprocess: SubProcess_B ...
📊 Has nested subprocesses: true
📦 SubProcess has nested: true

Expected Behavior:
✅ Modal "Create Process from SubProcess" appears
✅ User can create new process
```

### Test Case 2: Simple SubProcess (No nested)
```
1. Tạo process với:
   - SubProcess A
     ├─ Task 1
     ├─ Task 2
     └─ Task 3

2. Drill down vào SubProcess A

3. Click "Publish" hoặc "Run Robot Code"

Expected Console Output:
📍 Current root type: bpmn:SubProcess
📍 Is in subprocess: true
🔍 Checking for nested subprocesses in: SubProcess_A
🔍 Children count: 3
📊 Has nested subprocesses: false
📦 SubProcess has nested: false
✅ No nested subprocess, proceeding with normal publish

Expected Behavior:
✅ NO modal appears
✅ Normal publish/compile flow continues
✅ Toast notification or robot code modal appears
```

### Test Case 3: Main Process (Not in subprocess)
```
1. Ở main process view (không drill down)

2. Click "Publish" hoặc "Run Robot Code"

Expected Console Output:
📍 Current root type: bpmn:Process

Expected Behavior:
✅ Normal publish/compile flow
✅ No subprocess checks
```

## 🎯 Key Improvements

1. ✅ **Direct Canvas Check**: Không dựa vào state hook (có thể chậm)
2. ✅ **Correct Logic Flow**: Nested → Modal + Stop, No nested → Continue
3. ✅ **Comprehensive Logging**: Easy to debug với detailed console logs
4. ✅ **Case Sensitivity**: Check cả "SubProcess" và "subProcess"
5. ✅ **Real-time Detection**: Lấy giá trị trực tiếp từ canvas

---

**Status**: ✅ FIXED

**Issue**: Popup không xuất hiện khi cần, hoặc xuất hiện khi không cần  
**Cause 1**: Logic flow sai (show warning thay vì continue)  
**Cause 2**: State không update kịp thời  
**Solution**: Direct canvas check + correct logic flow  
**Result**: Popup chỉ xuất hiện khi có nested subprocess! ✅

