# Create Process from SubProcess with Activities & Variables

## 🎯 Overview

Khi tạo process mới từ subprocess, system giờ sẽ **filter và copy** activities & variables từ parent process, chỉ giữ lại những gì liên quan đến subprocess.

## 🔧 New API

### Endpoint
```
POST /processes/all-params
```

### Request Body
```typescript
{
  id: string;           // New process ID
  name: string;         // Process name
  description: string;  // Description
  xml: string;          // BPMN XML
  activities: Array<any>;  // Filtered activities
  variables: any;          // Filtered variables
}
```

### Response
```typescript
{
  id: string;
  name: string;
  xml: string;
  activities: Array<any>;
  variables: any;
  // ... other fields
}
```

## 📦 Data Flow

```
┌─────────────────────────────────────┐
│  Parent Process (in localStorage)  │
│  - All activities (10 items)       │
│  - All variables (5 items)         │
└─────────────────────────────────────┘
            │
            │ User clicks "Create Process"
            │ from SubProcess A
            ↓
┌─────────────────────────────────────┐
│  Extract SubProcess Data            │
│  1. Get node IDs in subprocess      │
│  2. Filter activities by node IDs   │
│  3. Filter variables used in acts   │
└─────────────────────────────────────┘
            │
            ↓
┌─────────────────────────────────────┐
│  New Process (created via API)      │
│  - Filtered activities (3 items)    │
│  - Filtered variables (2 items)     │
│  - XML from subprocess only         │
└─────────────────────────────────────┘
```

## 🔍 Filter Logic

### 1. Get SubProcess Node IDs
```typescript
function getSubProcessNodeIds(modeler: any, subProcessId: string): string[]
```

**Logic**:
- Get all `flowElements` from subprocess `businessObject`
- Filter out sequence flows
- Extract IDs from tasks, events, gateways

**Example**:
```javascript
SubProcess "Loop: Chấm điểm"
  - SubProcess_Start (StartEvent)
  - n2 (ServiceTask)
  - n3 (ServiceTask)  
  - SubProcess_End (EndEvent)
  
→ Node IDs: ["SubProcess_Start", "n2", "n3", "SubProcess_End"]
```

### 2. Filter Activities
```typescript
function filterActivitiesForSubProcess(
  activities: any[],
  subProcessNodeIds: string[]
): any[]
```

**Logic**:
- Loop through all activities
- Keep only if `activity.activityID` matches a subprocess node ID
- Return filtered array với format gốc

**Example**:
```javascript
Input:
[
  { activityID: "n1", name: "Lấy danh sách", ... },
  { activityID: "n2", name: "Chấm điểm", ... },      // ← In subprocess
  { activityID: "n3", name: "Lưu kết quả", ... },    // ← In subprocess
  { activityID: "n4", name: "Gửi email", ... }
]

Subprocess node IDs: ["SubProcess_Start", "n2", "n3", "SubProcess_End"]

Output:
[
  { activityID: "n2", name: "Chấm điểm", ... },
  { activityID: "n3", name: "Lưu kết quả", ... }
]
```

### 3. Filter Variables
```typescript
function filterVariablesForSubProcess(
  variables: any,
  filteredActivities: any[]
): any
```

**Logic**:
- Scan filtered activities for variable references
- Look in: `properties`, `inputMapping`, `outputMapping`, `parameters`
- Find patterns: `${varName}`, `{{varName}}`
- Keep only variables that are referenced

**Example**:
```javascript
Input activities:
[
  {
    activityID: "n2",
    properties: {
      input: "${studentId}",
      output: "${score}"
    }
  },
  {
    activityID: "n3",
    parameters: {
      saveData: "${score}"
    }
  }
]

Input variables:
{
  studentId: { type: "string", value: "" },
  score: { type: "number", value: 0 },
  emailList: { type: "array", value: [] },  // ← Not used
  teacherId: { type: "string", value: "" }  // ← Not used
}

Output variables:
{
  studentId: { type: "string", value: "" },  // ✅ Used in n2
  score: { type: "number", value: 0 }        // ✅ Used in n2, n3
}
```

## 📝 Implementation

### 1. DTO Definition (`src/dtos/processDto.ts`)

```typescript
export interface CreateProcessWithAllParamsDto {
  id: string;
  name: string;
  description: string;
  xml: string;
  variables: any;
  activities: Array<any>;
}
```

### 2. API Function (`src/apis/processApi.ts`)

```typescript
const createProcessWithAllParams = async (
  payload: CreateProcessWithAllParamsDto
) => {
  return await apiBase
    .post(`${process.env.NEXT_PUBLIC_DEV_API}/processes/all-params`, payload)
    .then((res: any) => res.data);
};
```

### 3. Data Extraction (`src/utils/subprocessDataExtractor.ts`)

Main function:
```typescript
export function extractSubProcessData(
  modeler: any,
  subProcessId: string,
  allActivities: any[],
  allVariables: any
): {
  activities: any[];
  variables: any;
  nodeIds: string[];
}
```

Helper functions:
- `getSubProcessNodeIds()` - Get node IDs
- `filterActivitiesForSubProcess()` - Filter activities
- `filterVariablesForSubProcess()` - Filter variables

### 4. Integration (`src/components/Bpmn/CustomModeler.tsx`)

```typescript
const handleCreateProcessFromSubProcess = async (newProcessName: string) => {
  // 1. Extract subprocess XML
  const extracted = await extractSubProcessAsProcess(...);
  
  // 2. Get data from localStorage
  const currentProcess = getProcessFromLocalStorage(processID);
  const allActivities = currentProcess?.activities || [];
  const allVariables = currentProcess?.variables || {};
  
  // 3. Filter for subprocess
  const subProcessData = extractSubProcessData(
    bpmnReactJs.bpmnModeler,
    currentRoot.id,
    allActivities,
    allVariables
  );
  
  // 4. Create process with filtered data
  const newProcess = await processApi.createProcessWithAllParams({
    id: newProcessId,
    name: newProcessName,
    description: `Created from subprocess: ${extracted.name}`,
    xml: extracted.xml,
    activities: subProcessData.activities,
    variables: subProcessData.variables,
  });
  
  // 5. Navigate to new process
  router.push(`/studio/modeler/${newProcess.id}`);
};
```

## 📊 Console Logging

### When creating process:

```javascript
╔═══════════════════════════════════════════╗
║  CREATING PROCESS FROM SUBPROCESS         ║
╚═══════════════════════════════════════════╝
📦 Parent process data:
  - Total activities: 10
  - Total variables: 5

╔═══════════════════════════════════════════╗
║  EXTRACTING SUBPROCESS DATA               ║
╚═══════════════════════════════════════════╝
📦 SubProcess node IDs: ["SubProcess_Start", "n2", "n3", "SubProcess_End"]
📊 Filtered activities: 2 / 10
  Original activities: ["n1", "n2", "n3", "n4", ...]
  Filtered activities: ["n2", "n3"]
📊 Filtered variables: 2 / 5
  Original variables: ["studentId", "score", "emailList", "teacherId", "status"]
  Used in subprocess: ["studentId", "score"]
  Filtered variables: ["studentId", "score"]

✅ Extraction complete!
  - Nodes: 4
  - Activities: 2
  - Variables: 2
╚═══════════════════════════════════════════╝

✅ Process created successfully!
  - Process ID: process_abc123
  - Activities included: 2
  - Variables included: 2
╚═══════════════════════════════════════════╝
```

## 🎯 Benefits

### 1. Complete Process
- ✅ New process has all necessary activities
- ✅ Variables are properly scoped
- ✅ No manual reconfiguration needed

### 2. Clean Data
- ✅ No unused activities from parent
- ✅ No unused variables
- ✅ Only relevant data copied

### 3. Maintainability
- ✅ Activities maintain their original format
- ✅ Variables keep their structure
- ✅ Easy to import to new process

## ⚠️ Important Notes

### 1. Activity Format
Activities must have `activityID` field matching BPMN node IDs:
```typescript
{
  activityID: "n2",  // ← Must match BPMN node ID
  name: "Chấm điểm",
  // ... other fields
}
```

### 2. Variable References
System looks for these patterns:
- `${variableName}`
- `{{variableName}}`

Make sure your variables are referenced correctly in activities!

### 3. Nested SubProcesses
If subprocess contains nested subprocesses, their activities are also included (if node IDs match).

## 🧪 Testing

### Test Case 1: Simple SubProcess

```javascript
Parent Process:
  - Activities: n1, n2, n3, n4
  - Variables: var1, var2, var3

SubProcess A (contains: n2, n3):
  - n2 uses ${var1}
  - n3 uses ${var2}

Expected Result:
  - New process activities: [n2, n3]
  - New process variables: {var1, var2}
```

### Test Case 2: No Activities

```javascript
SubProcess has only auto-generated start/end events

Expected Result:
  - New process activities: []
  - New process variables: {}
```

### Test Case 3: Shared Variables

```javascript
SubProcess A (contains: n2, n3):
  - n2 uses ${sharedVar}
  - n3 uses ${sharedVar}

Expected Result:
  - Variable sharedVar included once
```

---

**Status**: ✅ IMPLEMENTED

**Files**:
- ✅ `src/dtos/processDto.ts` - DTO definition
- ✅ `src/apis/processApi.ts` - API function
- ✅ `src/utils/subprocessDataExtractor.ts` - Filter logic
- ✅ `src/components/Bpmn/CustomModeler.tsx` - Integration

**Ready to use!** 🚀

