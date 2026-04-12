# Estructura de carpetas para Next.js con i18n

```
app/
├── [locale]/
│   ├── layout.tsx          # Layout con NextIntlClientProvider
│   ├── page.tsx            # Página principal
│   └── globals.css
├── layout.tsx              # Layout root
└── loading.tsx

components/
├── LanguageSwitcher.tsx    # Selector de idioma
└── ...

i18n/
├── routing.ts              # Configuración de rutas
└── ...

messages/
├── es.json                 # Traducciones español
└── ca.json                 # Traducciones catalán

middleware.ts               # Middleware de internacionalización
i18n.ts                     # Configuración de mensajes
next.config.js              # Configuración Next.js
package.json
```