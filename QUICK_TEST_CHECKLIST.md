# 🚨 Quick Test - Properties Panel Not Showing

## Step 1: Open Browser Console (F12)

## Step 2: Click vào bất kỳ node BPMN nào trên canvas

## Step 3: Check Console Logs - Phải thấy:

```
✅ Selection changed: {newSelection: [...]}
✅ Selected element: {id: "...", $type: "..."}
✅ Setting activityItem: {activityID: "...", activityName: "...", activityType: "..."}
✅ Opening sidebar (nếu sidebar đang closed)
✅ BpmnRightSidebar - activityItem changed: {...}
✅ PropertiesPanel - activityItem: {...}
```

---

## ❌ If Console Shows NOTHING:

**Problem**: Event listener chưa attach

**Fix**:

1. Refresh page (Ctrl + Shift + R)
2. Wait for diagram to fully load
3. Try click node again

---

## ❌ If Console Shows "Selection changed" nhưng không có "Setting activityItem":

**Problem**: Event handler có lỗi

**Check**: Có error màu đỏ trong console không?

---

## ❌ If Console Shows "Setting activityItem" nhưng Properties Panel trống:

**Problem**:

1. Sidebar đang collapsed
2. activityItem không pass đúng
3. Component render issue

**Fix**:

1. Check xem có nút "Details" ở edge bên phải không?
2. Click nút Details để mở sidebar
3. Check console xem có "PropertiesPanel - activityItem" không?

---

## ❌ If Sidebar mở nhưng Properties Panel chỉ hiển thị "Select an element...":

**Problem**: activityItem is null/undefined

**Debug**:

```
Check console log:
"PropertiesPanel - activityItem: ???"

Nếu null/undefined → prop không pass đúng
```

---

## ✅ What Should You SEE:

Khi click node, Properties Panel phải hiển thị:

```
┌─────────────────────────────────┐
│ Element Type                    │
│ bpmn:Task                       │
│                                 │
│ Activity ID                     │
│ Activity_0abc123                │
│                                 │
│ Name                            │
│ [Input field - editable]        │
└─────────────────────────────────┘
```

(Gray box, 3 fields luôn hiện)

---

## 🔧 Emergency Fixes:

### Fix 1: Hard Refresh

```
Ctrl + Shift + R
```

### Fix 2: Clear Cache & Restart

```bash
# Terminal
Ctrl + C (stop server)
npm run dev (restart)
```

### Fix 3: Clear Browser Data

```
DevTools (F12) → Application → Storage → Clear site data
```

---

## 📸 For Debugging, Send Me:

1. **Full console output** (copy-paste text)
2. **Screenshot của Properties Panel**
3. **Screenshot của sidebar** (open/closed?)
4. Tell me: "Có thấy nút Details màu hồng không?"

---

**Nếu vẫn không work sau các bước trên, có thể cần:**

- Check version của dependencies
- Reinstall node_modules
- Check browser compatibility
