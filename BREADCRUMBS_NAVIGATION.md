# Breadcrumbs Navigation for SubProcess

## Tổng quan

Feature **Breadcrumbs Navigation** giúp người dùng điều hướng khi drill-down vào subprocess. Khi click vào subprocess để xem chi tiết bên trong, breadcrumbs sẽ hiển thị đường dẫn và cho phép quay lại process chính.

## Vấn đề

Khi click "Expand SubProcess" hoặc double-click vào subprocess:
- ❌ Canvas chuyển sang hiển thị nội dung bên trong subprocess
- ❌ Không có cách nào rõ ràng để quay lại process chính
- ❌ User bị "lạc" trong subprocess

## Giải pháp

✅ **Breadcrumbs Navigation** tự động hiển thị:
- Đường dẫn từ root process đến subprocess hiện tại
- Click vào bất kỳ level nào để quay lại
- Tự động ẩn khi ở root level (không cần thiết)

## Giao diện

### Vị trí
- **Position**: Góc trên bên trái canvas
- **Z-index**: 1000 (hiển thị trên canvas)
- **Style**: White background với shadow

### Ví dụ hiển thị

```
Process > For each assignment > Validation Subprocess
```

- **Process**: Root process (clickable)
- **For each assignment**: Subprocess level 1 (clickable)
- **Validation Subprocess**: Level hiện tại (bold, không clickable)

## Cách sử dụng

### 1. Drill down vào SubProcess

1. Double-click vào một subprocess trên canvas
2. Canvas sẽ zoom vào và hiển thị nội dung bên trong subprocess
3. Breadcrumbs tự động xuất hiện ở góc trên trái

### 2. Navigate quay lại

**Option 1**: Click vào breadcrumb item
```
Click "Process" → Quay về root process
Click "For each assignment" → Quay về subprocess level 1
```

**Option 2**: Sử dụng built-in canvas navigation
- Click vào vùng trống bên ngoài subprocess boundary
- Hoặc double-click vào background

## Implementation Details

### Component Structure

```tsx
<BreadcrumbsNavigation bpmnReact={bpmnReactJs} />
```

### How it works

1. **Listen to root changes**:
   - Event: `root.set` - khi canvas root element thay đổi
   - Event: `canvas.viewbox.changed` - khi zoom/pan

2. **Build breadcrumbs path**:
   ```typescript
   const rootElement = canvas.getRootElement();
   // Traverse up from root to current element
   // Build array: [Process, SubProcess1, SubProcess2]
   ```

3. **Navigate to level**:
   ```typescript
   const navigateTo = (element: any) => {
     canvas.setRootElement(element);
     canvas.zoom('fit-viewport');
   };
   ```

### Code Example

```tsx
// src/components/Bpmn/BreadcrumbsNavigation/BreadcrumbsNavigation.tsx

const updateBreadcrumbs = () => {
  const rootElement = canvas.getRootElement();
  const breadcrumbsPath: BreadcrumbItem[] = [];

  let currentElement = rootElement;
  const path: any[] = [];

  // Get all parent elements
  while (currentElement) {
    path.unshift(currentElement);
    currentElement = currentElement.parent;
  }

  // Build breadcrumbs with names
  path.forEach((element: any) => {
    const businessObject = element.businessObject;
    breadcrumbsPath.push({
      id: element.id,
      name: businessObject?.name || 'Process',
      element: element
    });
  });

  setBreadcrumbs(breadcrumbsPath);
};
```

## Features

### ✅ Auto-show/hide
- Tự động hiển thị khi drill-down vào subprocess
- Tự động ẩn khi ở root level (không có parent)

### ✅ Real-time updates
- Listen events từ eventBus
- Update ngay khi canvas root thay đổi

### ✅ Visual feedback
- Current level: **Bold** và không clickable
- Parent levels: Blue color và clickable
- Hover effect: Underline khi hover

### ✅ Smart naming
- Sử dụng `businessObject.name` nếu có
- Fallback to element type nếu không có name
- Default to "Process" cho root

## Integration với CustomModeler

```tsx
// src/components/Bpmn/CustomModeler.tsx

function CustomModeler() {
  const bpmnReactJs = useBpmn();
  
  return (
    <BpmnModelerLayout>
      <BpmnJsReact useBpmnJsReact={bpmnReactJs} />
      
      {/* Breadcrumbs for subprocess navigation */}
      {bpmnReactJs.bpmnModeler && (
        <BreadcrumbsNavigation bpmnReact={bpmnReactJs} />
      )}
      
      {/* Undo/Redo buttons */}
      {bpmnReactJs.bpmnModeler && (
        <UndoRedoButtons bpmnReact={bpmnReactJs} />
      )}
    </BpmnModelerLayout>
  );
}
```

## UI Layout

```
┌─────────────────────────────────────────────┐
│ [Process > SubProcess > Current] ← Breadcrumbs
│                                             │
│                                             │
│           BPMN Canvas                       │
│                                             │
│                                             │
│                                             │
│ [Undo] [Redo] ← Controls                   │
└─────────────────────────────────────────────┘
```

**Positions**:
- Breadcrumbs: `top: 10px, left: 10px`
- Undo/Redo: `bottom: 10px, left: 10px`

## Events Handling

### Listened Events

1. **`root.set`**: 
   - Triggered when canvas root element changes
   - When drilling down or up

2. **`canvas.viewbox.changed`**:
   - Triggered when zoom/pan
   - Backup update mechanism

### Cleanup

```typescript
return () => {
  eventBus.off('root.set', updateBreadcrumbs);
  eventBus.off('canvas.viewbox.changed', updateBreadcrumbs);
};
```

## Use Cases

### 1. Simple Subprocess
```
Root Process
└── SubProcess A
```
Breadcrumbs: `Process > SubProcess A`

### 2. Nested Subprocesses
```
Root Process
└── SubProcess A
    └── SubProcess B
        └── SubProcess C
```
Breadcrumbs: `Process > SubProcess A > SubProcess B > SubProcess C`

### 3. Multiple Subprocesses (parallel)
```
Root Process
├── SubProcess A
└── SubProcess B
```
- In SubProcess A: `Process > SubProcess A`
- In SubProcess B: `Process > SubProcess B`

## Browser Compatibility

- ✅ Chrome/Edge (Windows/Mac/Linux)
- ✅ Firefox (Windows/Mac/Linux)
- ✅ Safari (Mac)

## Testing

### Manual Test Steps

1. **Create subprocess**: Thêm subprocess vào canvas
2. **Add internal elements**: Thêm start event, tasks vào subprocess
3. **Double-click subprocess**: Drill down vào bên trong
4. **Verify breadcrumbs**: Check breadcrumbs hiển thị
5. **Click "Process"**: Verify quay về root
6. **Navigate again**: Test multiple times

### Edge Cases

- ✅ Empty subprocess (no internal elements)
- ✅ Deeply nested subprocesses (3+ levels)
- ✅ Multiple parallel subprocesses
- ✅ Subprocess without name
- ✅ Rapid navigation (click nhiều lần)

## Lưu ý quan trọng

1. **Canvas API**: Sử dụng `canvas.setRootElement()` để navigate
2. **Auto zoom**: Tự động zoom fit-viewport sau khi navigate
3. **Event listeners**: Cleanup properly khi component unmount
4. **Performance**: Minimal re-renders, only update when root changes

---

**Status**: ✅ HOÀN THÀNH và SẴN SÀNG SỬ DỤNG

**Features Added**:
- ✅ Breadcrumbs navigation với visual feedback
- ✅ Auto-show/hide based on drill-down level
- ✅ Click to navigate to any parent level
- ✅ Real-time updates khi drill down/up
- ✅ Smart naming với fallbacks
- ✅ Full integration với CustomModeler

