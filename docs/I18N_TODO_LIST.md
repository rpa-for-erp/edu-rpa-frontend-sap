# Danh sách components cần refactor với i18n

## 🔴 Workspace Components (Ưu tiên cao)

### ✅ Đã hoàn thành

- [x] CreateWorkspaceModal.tsx
- [x] InviteMemberModal.tsx

### ⏳ Cần làm

- [ ] CreateTeamModal.tsx - Tạo nhóm trong workspace
- [ ] CreateRoleModal.tsx - Tạo vai trò
- [ ] AddPackageModal.tsx - Thêm gói activity

**Estimated time:** 1-2 giờ

---

## 🤖 Robot Components (Ưu tiên cao)

### ✅ Đã hoàn thành

- [x] RobotTable.tsx
- [x] ScheduleForm.tsx
- [x] robot/detail/[id].tsx - Robot detail page với toast messages và tabs

### ⏳ Cần làm

- [ ] ConfigTriggerModal.tsx - Cấu hình kích hoạt robot
- [ ] ScheduleModal.tsx - Modal lịch trình
- [ ] TriggerEventDriveModal.tsx - Kích hoạt từ Google Drive
- [ ] TriggerEventFormsModal.tsx - Kích hoạt từ Google Forms
- [ ] TriggerEventGmailModal.tsx - Kích hoạt từ Gmail
- [ ] RobotRow.tsx - Hàng trong bảng robot

**Estimated time:** 2-3 giờ

---

## 📁 Storage Components (Ưu tiên trung bình)

### ✅ Đã hoàn thành

- [x] FileUploadModal.tsx - Upload files
- [x] CreateFolderModal.tsx - Quản lý thư mục
- [x] FileItem.tsx - Component hiển thị file
- [x] storage/index.tsx - Trang storage chính

**Completed time:** ~1 giờ

---

## 🎨 Studio Components (Ưu tiên cao)

### ✅ Đã hoàn thành

- [x] CustomModeler.tsx - Component modeler chính với tất cả các tính năng
  - [x] Save/Publish functionality với i18n
  - [x] Version management với i18n
  - [x] SubProcess controls với i18n
  - [x] Robot code generation với i18n
  - [x] Error handling messages với i18n
- [x] BpmnTopHeader.tsx - Header với breadcrumb navigation
- [x] UndoRedoButtons.tsx - Undo/Redo controls
- [x] SubProcessControls.tsx - SubProcess navigation controls
- [x] FunctionalTabBar.tsx - Save/Publish/Share buttons
- [x] CreateProcessFromSubProcessModal.tsx - Modal tạo process từ subprocess
- [x] CreateVersionModal.tsx - Modal tạo version mới
- [x] VariablesPanel.tsx - Panel quản lý biến (không có hardcoded text)
- [x] DisplayRobotCode.tsx - Modal hiển thị code (không có hardcoded text)

**Completed time:** ~3 giờ

### ✅ Activity Packages & Templates (MỚI - Hoàn thành)

- [x] **Activity Packages i18n Implementation** 🎉
  - [x] Tạo translation files (`activities.json`) cho EN/VI
  - [x] Tạo custom hook `useActivityPackages()`
  - [x] Refactor PropertiesPanel để sử dụng i18n
  - [x] Migration script để extract tất cả activities
  - [x] Hỗ trợ dịch:
    - ✅ 13 Activity Packages (displayName, description)
    - ✅ 118 Activity Templates (displayName, description)
    - ✅ Arguments (name, description)
    - ✅ Return values (name, description)
    - ✅ Variable types (scalar, list, dictionary, etc.)
  - [x] Documentation đầy đủ tại `docs/ACTIVITY_PACKAGES_I18N.md`

**Completed time:** ~2 giờ
**Chi tiết:** Xem [ACTIVITY_PACKAGES_I18N.md](./ACTIVITY_PACKAGES_I18N.md)

---

### ⏳ Cần làm

- [ ] PropertiesSideBar components - Sidebar thuộc tính (UI text còn lại)
- [ ] BPMN toolbar components (nếu có text hardcoded)
- [ ] Export/Import dialogs (nếu có modal riêng)
- [ ] Các modal khác: ShareWithModal, PublishRobotModal, UnsavedChangesModal

**Estimated time:** 0.5-1 giờ

---

## 👤 Profile Components (Ưu tiên trung bình)

### ✅ Đã hoàn thành

- [x] profile/index.tsx - Profile page chính

### ⏳ Cần làm

- [ ] Password change form
- [ ] Settings panels

**Estimated time:** 30 phút

---

## 🔐 Auth Components (Ưu tiên cao)

### ⏳ Cần làm

- [ ] Login form
- [ ] Sign up form
- [ ] Forgot password form
- [ ] Reset password form

**Estimated time:** 1-2 giờ

---

## 🔌 Connection Components (Ưu tiên trung bình)

### ⏳ Cần làm

- [ ] Google connection
- [ ] Moodle connection
- [ ] Other integrations

**Estimated time:** 1 giờ

---

## 📄 Document Template Components (Ưu tiên trung bình)

### ✅ Đã hoàn thành

- [x] document-template/index.tsx - Danh sách mẫu tài liệu
- [x] CreateDocumentTemplateModal.tsx - Tạo mẫu tài liệu mới
- [x] DetailDocumentTemplateModal.tsx - Xem chi tiết mẫu tài liệu
- [x] EditDocumentTemplateModal.tsx - Chỉnh sửa mẫu tài liệu

**Completed time:** ~1 giờ

---

## 👥 Team Components (Ưu tiên trung bình)

### ⏳ Cần làm

- [ ] Team management
- [ ] Member list
- [ ] Permission management

**Estimated time:** 1 giờ

---

## 📄 Pages cần cập nhật

### ✅ Đã có getServerSideTranslations

- [x] pages/home/index.tsx
- [x] pages/workspace/index.tsx
- [x] pages/robot/index.tsx
- [x] pages/studio/index.tsx
- [x] pages/storage/index.tsx
- [x] pages/profile/index.tsx
- [x] pages/invitation/index.tsx
- [x] pages/integration-service/index.tsx
- [x] pages/document-template/index.tsx

### ⏳ Cần kiểm tra và refactor hardcoded text trong pages

- [ ] pages/auth/login/index.tsx
- [ ] pages/auth/sign-up/index.tsx
- [ ] pages/404.tsx

**Estimated time:** 2 giờ

---

## 🧩 Form Components (Ưu tiên trung bình)

Trong `src/components/Forms/`:

- [ ] All input components
- [ ] Validation messages
- [ ] Form labels

**Estimated time:** 1-2 giờ

---

## 📊 Tổng kết

### Đã hoàn thành: ~35%

- ✅ Translation files (en/vi) cho tất cả modules
- ✅ Header với LanguageSwitcher
- ✅ Sidebar navigation
- ✅ **Studio Components** (CustomModeler và tất cả components liên quan)
  - ✅ CustomModeler.tsx
  - ✅ BpmnTopHeader.tsx
  - ✅ UndoRedoButtons.tsx
  - ✅ SubProcessControls.tsx
  - ✅ FunctionalTabBar.tsx
  - ✅ CreateProcessFromSubProcessModal.tsx
  - ✅ CreateVersionModal.tsx
  - ✅ VariablesPanel.tsx
  - ✅ DisplayRobotCode.tsx
- ✅ Storage components (FileUpload, CreateFolder, FileItem)
- ✅ Profile page
- ✅ Document Template components
- ✅ Workspace components (CreateWorkspace, InviteMember)
- ✅ Robot components (RobotTable, ScheduleForm)
- ✅ Infrastructure setup

### Còn lại: ~65%

- ⏳ ~35 components cần refactor
- ⏳ ~10 pages cần kiểm tra
- ⏳ Form components
- ⏳ Properties panel components (trong Studio)
- ⏳ Testing và validation

### Thời gian ước tính hoàn thành: 10-15 giờ

---

## 🎯 Kế hoạch thực hiện

### Sprint 1 (5 giờ) - Components cơ bản

1. Auth components (Login, Sign up)
2. Workspace modals còn lại
3. Robot modals

### Sprint 2 (5 giờ) - Studio & Storage

1. Studio components
2. Storage components
3. Profile components

### Sprint 3 (5 giờ) - Hoàn thiện

1. Form components
2. Connection & Team
3. Testing toàn bộ hệ thống

### Sprint 4 (2-3 giờ) - Polish & QA

1. Fix missing keys
2. UI/UX improvements
3. Final testing

---

## 📋 Checklist cho mỗi component

Khi refactor component, đảm bảo:

- [ ] Import `useTranslation` từ 'next-i18next'
- [ ] Khai báo `const { t } = useTranslation('namespace')`
- [ ] Replace tất cả hardcoded text:
  - [ ] Button text
  - [ ] Form labels
  - [ ] Placeholders
  - [ ] Toast messages
  - [ ] Modal titles
  - [ ] Error messages
  - [ ] Validation messages
- [ ] Kiểm tra translation keys đã có trong JSON files
- [ ] Thêm missing keys vào cả en và vi
- [ ] Test chuyển đổi ngôn ngữ
- [ ] Commit changes

---

## 🔍 Commands để tìm hardcoded text

```bash
# Tìm các FormLabel với hardcoded text
grep -r "FormLabel>" src/components/ | grep -v "t("

# Tìm các placeholder với hardcoded text
grep -r 'placeholder="' src/components/ | grep -v "t("

# Tìm các toast messages
grep -r "title: '" src/components/ | grep -v "t("

# Tìm các Button text
grep -r "<Button" src/components/ -A 2 | grep -v "t("

# Tìm components chưa import useTranslation
find src/components -name "*.tsx" -exec grep -L "useTranslation" {} \;
```

---

**Cập nhật:** ${new Date().toLocaleDateString('vi-VN')}
