# Internacionalización (i18n) con Next.js y next-intl

Este proyecto implementa internacionalización para soportar Español y Catalán usando next-intl.

## Instalación

```bash
npm install next-intl
```

## Configuración

### 1. Estructura de carpetas

La estructura de carpetas utiliza el App Router de Next.js con carpetas dinámicas `[locale]`:

```
app/
├── [locale]/
│   ├── layout.tsx          # Layout con NextIntlClientProvider
│   ├── page.tsx            # Página principal
│   └── ...
├── layout.tsx              # Layout root
└── ...

components/
├── LanguageSwitcher.tsx    # Selector de idioma

i18n/
├── routing.ts              # Configuración de rutas

messages/
├── es.json                 # Traducciones español
└── ca.json                 # Traducciones catalán

middleware.ts               # Middleware de internacionalización
i18n.ts                     # Configuración de mensajes
```

### 2. Archivos de configuración

#### `i18n/routing.ts`
Configura las rutas y locales soportados.

#### `i18n.ts`
Configura cómo cargar los mensajes para cada locale.

#### `middleware.ts`
Middleware que maneja el enrutamiento internacional.

#### `app/[locale]/layout.tsx`
Layout que envuelve las páginas con `NextIntlClientProvider`.

### 3. Archivos de mensajes

- `messages/es.json`: Traducciones en español
- `messages/ca.json`: Traducciones en catalán

### 4. Componente LanguageSwitcher

Componente que permite cambiar entre idiomas. Actualiza la URL con el nuevo locale.

## Uso en componentes

```tsx
import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations();

  return (
    <div>
      <h1>{t('nav.title')}</h1>
      <button>{t('buttons.runAssistant')}</button>
    </div>
  );
}
```

## URLs

Las URLs incluirán el prefijo del idioma:
- `/es` - Español (por defecto)
- `/ca` - Catalán

## Próximos pasos

1. Instalar next-intl
2. Configurar los archivos como se muestra arriba
3. Actualizar todos los componentes para usar `useTranslations()`
4. Probar el cambio de idioma