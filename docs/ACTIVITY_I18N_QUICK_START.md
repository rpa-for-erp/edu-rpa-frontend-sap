# Activity Packages i18n - Quick Start Guide

## 🚀 Sử dụng trong Components

### Import hook:

```tsx
import { useActivityPackages } from '@/hooks/useActivityPackages';
```

### Sử dụng trong component:

```tsx
function MyComponent() {
  const { t } = useTranslation('activities');
  const ActivityPackages = useActivityPackages();

  return (
    <div>
      {ActivityPackages.map((pkg) => (
        <div key={pkg._id}>
          <h3>{pkg.displayName}</h3> {/* Đã được dịch tự động */}
          <p>{pkg.description}</p> {/* Đã được dịch tự động */}
        </div>
      ))}
    </div>
  );
}
```

### Sử dụng trực tiếp translation:

```tsx
function MyComponent() {
  const { t } = useTranslation('activities');

  return (
    <div>
      <h3>{t('packages.google_drive.displayName')}</h3>
      <p>{t('common.selectPackage')}</p>
      <span>{t('varTypes.scalar')}</span>
    </div>
  );
}
```

## 📝 Thêm Activity mới

### 1. Thêm vào file base (activityPackage.ts):

```typescript
{
  templateId: "my_new_template",
  displayName: "My New Template",  // English fallback
  description: "Does something cool",
  iconCode: "FaIcon",
  type: "activity",
  keyword: "My Keyword",
  arguments: {
    "Input": {
      type: "string",
      description: "Input value",
      keywordArg: "input",
      value: ""
    }
  }
}
```

### 2. Thêm translation (activities.json):

**EN:**

```json
{
  "templates": {
    "my_new_template": {
      "displayName": "My New Template",
      "description": "Does something cool"
    }
  },
  "argumentDescriptions": {
    "Input": "Input value for the operation"
  }
}
```

**VI:**

```json
{
  "templates": {
    "my_new_template": {
      "displayName": "Mẫu mới của tôi",
      "description": "Làm điều gì đó tuyệt vời"
    }
  },
  "argumentDescriptions": {
    "Input": "Giá trị đầu vào cho thao tác"
  }
}
```

### 3. Chạy migration (nếu cần):

```bash
node scripts/migrate-activities-i18n.js
```

## 🔄 Switch Language

Language tự động switch theo locale của app. Không cần thêm code!

```tsx
// Trong LanguageSwitcher component
const changeLanguage = (locale: string) => {
  router.push({ pathname, query }, asPath, { locale });
};
```

## 📁 Files quan trọng

- `public/locales/en/activities.json` - English translations
- `public/locales/vi/activities.json` - Vietnamese translations
- `src/hooks/useActivityPackages.ts` - Custom hook
- `src/constants/activityPackage.ts` - Base data (structure, keywords, etc.)

## 🎯 Best Practices

✅ **DO:**

- Sử dụng `useActivityPackages()` hook trong components
- Thêm translations cho tất cả activity mới
- Sử dụng fallback values trong base file
- Test với cả EN và VI locale

❌ **DON'T:**

- Không import trực tiếp từ `activityPackage.ts` nữa
- Không hardcode display text trong components
- Không quên thêm namespace 'activities' vào getServerSideProps

## 🐛 Debugging

### Nếu translation không hiển thị:

1. **Check namespace đã load chưa:**

```tsx
export const getServerSideProps = async (context) => {
  return {
    props: {
      ...(await getServerSideTranslations(context, [
        'common',
        'activities', // ← Phải có dòng này!
      ])),
    },
  };
};
```

2. **Check translation key:**

```tsx
// Đúng
t('packages.google_drive.displayName');

// Sai
t('google_drive.displayName'); // Missing 'packages.'
```

3. **Check JSON syntax:**

- Đảm bảo không có trailing comma
- Đảm bảo proper escaping cho special characters

## 📚 Xem thêm

- [Chi tiết đầy đủ](./ACTIVITY_PACKAGES_I18N.md)
- [I18N TODO List](./I18N_TODO_LIST.md)
