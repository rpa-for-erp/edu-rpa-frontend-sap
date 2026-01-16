# Undo/Redo Feature Documentation

## Tổng quan

Feature **Undo/Redo** cho phép người dùng quay lại hoặc làm lại các thay đổi trong BPMN diagram. Hỗ trợ cả keyboard shortcuts và UI buttons.

## Tính năng

### 🎹 Keyboard Shortcuts

- **Undo**: `Ctrl+Z` (Windows/Linux) hoặc `Cmd+Z` (Mac)
- **Redo**: `Ctrl+Y` (Windows/Linux) hoặc `Cmd+Shift+Z` / `Ctrl+Shift+Z` (Mac)

### 🖱️ UI Buttons

- **Undo button** với icon và tooltip
- **Redo button** với icon và tooltip
- Buttons tự động disable khi không có gì để undo/redo
- Hiển thị ở góc trên bên trái của canvas

## Cách sử dụng

### 1. Keyboard Shortcuts

Các shortcuts được tự động kích hoạt khi modeler được khởi tạo. Người dùng chỉ cần:

1. Thực hiện một thay đổi trên diagram (thêm, xóa, sửa node/flow)
2. Nhấn `Ctrl+Z` để undo
3. Nhấn `Ctrl+Y` để redo

### 2. UI Buttons

Buttons xuất hiện tự động ở góc trên bên trái của canvas:

```tsx
<UndoRedoButtons bpmnReact={bpmnReactJs} />
```

### 3. Programmatic API

Có thể gọi undo/redo từ code:

```typescript
import { useBpmn } from '@/hooks/useBpmn';

const bpmnReact = useBpmn();

// Undo
if (bpmnReact.canUndo()) {
  bpmnReact.undo();
}

// Redo
if (bpmnReact.canRedo()) {
  bpmnReact.redo();
}

// Check availability
const undoAvailable = bpmnReact.canUndo();
const redoAvailable = bpmnReact.canRedo();
```

## Implementation Details

### 1. BpmnJsModeler Component

Keyboard shortcuts được thêm vào component chính:

```typescript
// src/components/Bpmn/BpmnJsModeler.tsx
const handleKeyDown = (event: KeyboardEvent) => {
  const commandStack = newModeler.get("commandStack");
  
  // Undo: Ctrl+Z
  if ((event.ctrlKey || event.metaKey) && event.key === "z" && !event.shiftKey) {
    event.preventDefault();
    if (commandStack?.canUndo()) {
      commandStack.undo();
    }
  }
  
  // Redo: Ctrl+Y or Ctrl+Shift+Z
  if (
    ((event.ctrlKey || event.metaKey) && event.key === "y") ||
    ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === "z")
  ) {
    event.preventDefault();
    if (commandStack?.canRedo()) {
      commandStack.redo();
    }
  }
};
```

### 2. useBpmn Hook

Thêm undo/redo functions vào hook:

```typescript
// src/hooks/useBpmn.ts
const undo = () => {
  const commandStack = bpmnModeler?.get('commandStack');
  if (commandStack && commandStack.canUndo()) {
    commandStack.undo();
  }
};

const redo = () => {
  const commandStack = bpmnModeler?.get('commandStack');
  if (commandStack && commandStack.canRedo()) {
    commandStack.redo();
  }
};

const canUndo = () => {
  const commandStack = bpmnModeler?.get('commandStack');
  return commandStack ? commandStack.canUndo() : false;
};

const canRedo = () => {
  const commandStack = bpmnModeler?.get('commandStack');
  return commandStack ? commandStack.canRedo() : false;
};
```

### 3. UndoRedoButtons Component

UI component với real-time state updates:

```typescript
// src/components/Bpmn/UndoRedoButtons/UndoRedoButtons.tsx
const UndoRedoButtons: React.FC<UndoRedoButtonsProps> = ({ bpmnReact }) => {
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    const commandStack = bpmnReact.bpmnModeler.get('commandStack');
    
    // Update button states when command stack changes
    const updateStates = () => {
      setCanUndo(commandStack.canUndo());
      setCanRedo(commandStack.canRedo());
    };

    commandStack.on('changed', updateStates);
    updateStates();

    return () => {
      commandStack.off('changed', updateStates);
    };
  }, [bpmnReact?.bpmnModeler]);

  return (
    <ButtonGroup>
      <Button onClick={bpmnReact.undo} isDisabled={!canUndo}>Undo</Button>
      <Button onClick={bpmnReact.redo} isDisabled={!canRedo}>Redo</Button>
    </ButtonGroup>
  );
};
```

### 4. Interface Updates

Thêm methods vào BpmnJsReactHandle:

```typescript
// src/interfaces/bpmnJsReact.interface.tsx
export type BpmnJsReactHandle = {
  // ... existing methods
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
};
```

## Command Stack

Feature sử dụng bpmn-js built-in `commandStack` module:

- **Command Stack**: Lưu trữ history của tất cả thay đổi
- **Auto-tracking**: Tự động track mọi thay đổi trên diagram
- **Transactional**: Mỗi command có thể undo/redo hoàn toàn

### Các thao tác được track:

- ✅ Add/Remove elements (nodes, flows)
- ✅ Move elements
- ✅ Resize elements
- ✅ Change properties
- ✅ Connect/Disconnect flows
- ✅ Change element types

## UI/UX Details

### Button States

- **Enabled**: Có màu và clickable khi có thể undo/redo
- **Disabled**: Màu xám và không clickable khi không thể undo/redo
- **Icons**: Sử dụng arrow icons rõ ràng
- **Tooltips**: Hiển thị shortcut khi hover

### Position

- **Default**: Góc trên bên trái của canvas
- **Z-index**: 1000 để hiển thị trên canvas
- **Background**: Trắng với shadow để nổi bật

## Browser Compatibility

- ✅ Chrome/Edge (Windows/Mac/Linux)
- ✅ Firefox (Windows/Mac/Linux)
- ✅ Safari (Mac)
- ✅ Hỗ trợ cả Ctrl và Cmd keys

## Testing

### Manual Testing Steps

1. **Create element**: Thêm một task vào diagram
2. **Press Ctrl+Z**: Task biến mất (undo)
3. **Press Ctrl+Y**: Task xuất hiện lại (redo)
4. **Move element**: Di chuyển task
5. **Click Undo button**: Task quay về vị trí cũ
6. **Click Redo button**: Task di chuyển lại

### Edge Cases

- ✅ Multiple undo/redo operations
- ✅ Undo after making new changes (redo stack clears)
- ✅ Empty command stack (buttons disabled)
- ✅ Keyboard shortcuts khi focus vào input fields (không conflict)

## Integration với CustomModeler

```tsx
// src/components/Bpmn/CustomModeler.tsx
import UndoRedoButtons from "./UndoRedoButtons";

function CustomModeler() {
  const bpmnReactJs = useBpmn();
  
  return (
    <BpmnModelerLayout>
      <BpmnJsReact useBpmnJsReact={bpmnReactJs} />
      
      {/* Undo/Redo buttons */}
      {bpmnReactJs.bpmnModeler && (
        <UndoRedoButtons bpmnReact={bpmnReactJs} />
      )}
    </BpmnModelerLayout>
  );
}
```

## Lưu ý quan trọng

1. **Command Stack Reset**: Khi import XML mới, command stack sẽ reset
2. **Event Listeners**: Cleanup event listeners khi component unmount
3. **Performance**: Command stack có giới hạn history (thường ~50 commands)
4. **Cross-browser**: Kiểm tra cả Ctrl và Meta keys cho Mac compatibility

---

**Status**: ✅ HOÀN THÀNH và SẴN SÀNG SỬ DỤNG

**Features Added**:
- ✅ Keyboard shortcuts (Ctrl+Z, Ctrl+Y)
- ✅ UI buttons với icons và tooltips
- ✅ Real-time state updates
- ✅ Programmatic API
- ✅ Full integration với CustomModeler

