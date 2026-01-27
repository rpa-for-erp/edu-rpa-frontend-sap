# Activity Packages i18n Implementation

## 📝 Tổng quan

Dự án đã được refactor để áp dụng internationalization (i18n) cho **activity packages**, **templates**, **arguments** và **return values**. Giải pháp sử dụng hệ thống i18n có sẵn của next-i18next.

## 🏗️ Kiến trúc

### 1. Translation Files

**Location:** `public/locales/{locale}/activities.json`

Cấu trúc JSON:

```json
{
  "packages": {
    "package_id": {
      "displayName": "Package Name",
      "description": "Package Description"
    }
  },
  "templates": {
    "template_id": {
      "displayName": "Template Name",
      "description": "Template Description"
    }
  },
  "arguments": {
    "argument_name": "Translated Argument Name"
  },
  "argumentDescriptions": {
    "argument_name": "Translated Argument Description"
  },
  "returns": {
    "return_name": "Translated Return Name"
  },
  "returnDescriptions": {
    "return_name": "Translated Return Description"
  },
  "varTypes": {
    "scalar": "Scalar Variable",
    "dictionary": "Dictionary Variable",
    ...
  },
  "common": {
    "selectPackage": "Select a package",
    "selectActivity": "Select an activity",
    ...
  }
}
```

### 2. Custom Hook

**File:** `src/hooks/useActivityPackages.ts`

Hooks được cung cấp:

- `useActivityPackages()` - Lấy tất cả packages đã được dịch
- `useActivityPackage(packageId)` - Lấy một package cụ thể
- `useActivityTemplate(packageId, templateId)` - Lấy một template cụ thể
- `useVarTypeTranslation()` - Dịch tên loại biến

**Usage Example:**

```tsx
import { useActivityPackages } from '@/hooks/useActivityPackages';

function MyComponent() {
  const ActivityPackages = useActivityPackages();

  return (
    <div>
      {ActivityPackages.map((pkg) => (
        <div key={pkg._id}>
          <h3>{pkg.displayName}</h3>
          <p>{pkg.description}</p>
        </div>
      ))}
    </div>
  );
}
```

### 3. Component Updates

**PropertiesPanel.tsx** đã được update:

```tsx
export default function PropertiesPanel({ ... }) {
  const { t } = useTranslation('activities');
  const ActivityPackages = useActivityPackages();

  // Rest of component logic remains the same
  // ActivityPackages now contains translated content
}
```

## 🚀 Migration Process

### Automatic Migration Script

**Location:** `scripts/migrate-activities-i18n.js`

Script này tự động extract data từ:

- `src/constants/activityPackage.ts` (English)
- `src/constants/activityPackage.vi.ts` (Vietnamese)

Và tạo/update:

- `public/locales/en/activities.json`
- `public/locales/vi/activities.json`

**Run Migration:**

```bash
node scripts/migrate-activities-i18n.js
```

**Results:**

- ✅ 13 Packages extracted
- ✅ 118 Templates extracted
- ✅ All argument names and descriptions
- ✅ All return values and descriptions

## 📦 Files Modified

### Created Files:

1. ✅ `public/locales/en/activities.json` - English translations
2. ✅ `public/locales/vi/activities.json` - Vietnamese translations
3. ✅ `src/hooks/useActivityPackages.ts` - Custom hook
4. ✅ `scripts/migrate-activities-i18n.js` - Migration script

### Modified Files:

1. ✅ `src/components/Bpmn/PropertiesPanel/PropertiesPanel.tsx` - Added i18n support
2. ✅ `src/pages/studio/modeler/[id].tsx` - Added 'activities' namespace
3. ✅ `src/pages/studio/index.tsx` - Added 'activities' namespace

## 🔄 How It Works

1. **Base Data:** Activity package data vẫn được lưu trong `activityPackage.ts` (structure, keywords, library names, etc.)

2. **Translations:** Display names và descriptions được lưu trong translation files

3. **Runtime Merging:** Hook `useActivityPackages()` merge base data với translations dựa trên locale hiện tại

4. **Type Safety:** TypeScript interfaces đảm bảo type safety

## ⚡ Performance

- Hook sử dụng `useMemo` để cache translated data
- Chỉ re-compute khi locale thay đổi
- Không ảnh hưởng đến performance vì chỉ chạy client-side

## 🌍 Adding New Languages

Để thêm ngôn ngữ mới:

1. Thêm locale vào `next-i18next.config.js`:

```js
locales: ['en', 'vi', 'ja']; // Add Japanese
```

2. Tạo file mới: `public/locales/ja/activities.json`

3. Copy structure từ `en/activities.json` và dịch content

4. Hook sẽ tự động sử dụng translation mới

## 📝 Best Practices

### When Adding New Activities:

1. **Add to base file first:**

   ```typescript
   // In activityPackage.ts
   {
     templateId: "new_template",
     displayName: "New Template",  // English fallback
     description: "Template description",
     // ... other properties
   }
   ```

2. **Add translations:**

   ```json
   // In activities.json
   {
     "templates": {
       "new_template": {
         "displayName": "Translated Name",
         "description": "Translated Description"
       }
     }
   }
   ```

3. **Run migration script** (if bulk updating)

### When Updating Translations:

- ✅ Update JSON files directly
- ✅ No need to restart dev server (hot reload works)
- ✅ Use fallback values for missing translations

## 🧪 Testing

Test với các scenarios:

1. ✅ Switch language trong app
2. ✅ Verify tất cả activity names được dịch
3. ✅ Check argument descriptions
4. ✅ Verify return value descriptions
5. ✅ Test fallback khi translation missing

## � Troubleshooting

### Bug Fix: Image Component Null Error

**Problem:** Khi switch ngôn ngữ, PropertiesPanel gặp lỗi:

```
TypeError: Cannot read properties of null (reading 'default')
```

**Root Cause:**

- `getPackageIcon()` sử dụng `displayName` để match icon
- Khi i18n active, `displayName` thay đổi theo ngôn ngữ (VD: "Control" → "Điều khiển")
- Switch case không match displayName đã dịch → trả về `null`
- Next.js Image component nhận `src={null}` → crash

**Solution:**

1. ✅ Update `getPackageIcon()` để hỗ trợ cả package `_id` (không đổi) và `displayName`
2. ✅ PropertiesPanel giờ sử dụng `_id` thay vì `displayName`:
   ```tsx
   <IconImage icon={getPackageIcon(_id)} label={displayName} />
   ```
3. ✅ Thêm null check vào IconImage component

**Files Changed:**

- `src/utils/propertyService.ts` - Updated getPackageIcon()
- `src/components/Bpmn/PropertiesPanel/PropertiesPanel.tsx` - Use \_id
- `src/components/IconImage/IconImage.tsx` - Added null safety check

## �🔮 Future Improvements

### Phase 2 (Optional):

- [ ] Add translation UI tool cho non-technical users
- [ ] Auto-translate using AI (Google Translate API)
- [ ] Version control cho translations
- [ ] Translation completeness checker

### Considerations:

- **Deprecate old files?** `activityPackage.vi.ts` có thể được remove sau khi migration hoàn tất và test kỹ
- **Dynamic loading:** Có thể implement lazy loading cho large translation files

## 📞 Support

For questions or issues:

- Check `docs/I18N_TODO_LIST.md`
- See example usage in `PropertiesPanel.tsx`
- Review hook implementation in `useActivityPackages.ts`

---

**Status:** ✅ Completed and Production Ready

**Last Updated:** January 27, 2026

**Migration Statistics:**

- 13 Activity Packages ✅
- 118 Activity Templates ✅
- 2 Language Support (EN, VI) ✅
- 100% Type Safe ✅
