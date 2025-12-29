# Hướng dẫn sử dụng i18n (Internationalization)

Dự án đã được setup với `next-i18next` để hỗ trợ đa ngôn ngữ (English và Tiếng Việt).

## Cấu trúc

- **File cấu hình**: `next-i18next.config.js`
- **File translations**: `public/locales/{locale}/{namespace}.json`
- **Utility functions**: `src/utils/i18n.ts`
- **Language Switcher**: `src/components/LanguageSwitcher/LanguageSwitcher.tsx`

## Cách sử dụng trong Components

### 1. Sử dụng `useTranslation` hook trong Client Components

```tsx
import { useTranslation } from 'next-i18next';

export default function MyComponent() {
  const { t } = useTranslation('common'); // 'common' là namespace
  
  return (
    <div>
      <button>{t('buttons.save')}</button>
      <p>{t('messages.welcome')}</p>
    </div>
  );
}
```

### 2. Thêm translations vào Page

Để translations hoạt động trong một page, bạn cần thêm `getServerSideProps` hoặc `getStaticProps`:

**Với getServerSideProps:**
```tsx
import { GetServerSideProps } from 'next';
import { getServerSideTranslations } from '@/utils/i18n';

export default function MyPage() {
  // Your component code
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    props: {
      ...(await getServerSideTranslations(context, ['common', 'navbar'])),
      // 'common', 'navbar' là các namespaces cần load
    },
  };
};
```

**Với getStaticProps:**
```tsx
import { GetStaticProps } from 'next';
import { getStaticTranslations } from '@/utils/i18n';

export const getStaticProps: GetStaticProps = async (context) => {
  return {
    props: {
      ...(await getStaticTranslations(context, ['common', 'navbar'])),
    },
  };
};
```

### 3. Thêm translations mới

1. Mở file translation tương ứng trong `public/locales/{locale}/{namespace}.json`
2. Thêm key-value mới:

```json
{
  "myNewKey": "My new text",
  "nested": {
    "key": "Nested text"
  }
}
```

3. Sử dụng trong component:
```tsx
const { t } = useTranslation('namespace');
t('myNewKey'); // "My new text"
t('nested.key'); // "Nested text"
```

## Namespaces hiện có

- **common**: Các text chung (buttons, labels, messages)
- **header**: Text cho Header component (auth pages)
- **navbar**: Text cho Navbar component
- **sidebar**: Text cho Sidebar menu items

## Loại trừ BPMN Modeler

Theo yêu cầu, nội dung bên trong canvas BPMN modeler (`/studio/modeler/[id]`) sẽ **KHÔNG** được dịch. Tuy nhiên, header và sidebar của BPMN modeler vẫn có thể được dịch nếu cần.

Để đảm bảo BPMN modeler không bị ảnh hưởng:
- Không thêm translations vào các component bên trong BPMN canvas
- Chỉ dịch các phần UI bên ngoài canvas (header, sidebar, buttons, etc.)

## Language Switcher

Language Switcher đã được thêm vào:
- **Navbar** (cho authenticated pages)
- **Header** (cho auth pages)

User có thể chuyển đổi giữa English và Tiếng Việt bằng cách click vào language switcher.

## Lưu ý

- Mặc định ngôn ngữ là **English** (`en`)
- Khi user chuyển ngôn ngữ, page sẽ reload với locale mới
- Translations được load ở server-side thông qua `getServerSideProps` hoặc `getStaticProps`
- Đảm bảo thêm translations vào page nếu muốn sử dụng `useTranslation` hook trong components của page đó

