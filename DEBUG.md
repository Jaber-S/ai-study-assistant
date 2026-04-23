# 🔧 Debugging - Persistencia de Cuadernos

## Problema
Los cuadernos desaparecen al recargar la página.

## Paso 1: Compilar la app con logs

La app está lista para compilar con logs detallados. Ejecuta:

```bash
cd client
npm run dev
```

## Paso 2: Prueba en el navegador

1. Abre `http://localhost:5173`
2. Inicia sesión con tu cuenta
3. **Abre la Consola del Navegador** (F12 o Ctrl+Shift+I)
4. Busca los logs que comienzan con `[NotebookContext]`

## Paso 3: Crear un cuaderno y observar logs

1. En NotebookSelector, clica "+ Crear cuaderno"
2. Mira la Consola - deberías ver:
   ```
   [NotebookContext] Creating notebook: { title: 'Nuevo Cuaderno', ... }
   [NotebookContext] Updating notebooks state with new notebook
   [NotebookContext] Saving notebooks to localStorage: { key: 'notebooks_USER_ID', count: 1, ... }
   ```

## Paso 4: Recargar página y observar logs

1. Presiona F5 (recargar)
2. Mira la Consola - deberías ver:
   ```
   [NotebookContext] Load effect triggered with userId: USER_ID
   [NotebookContext] Loading notebooks for userId: USER_ID
   [NotebookContext] Found in localStorage: { notebooksCount: 1, activeId: 'nb_...' }
   [NotebookContext] Loaded notebooks: [{ id: ..., title: 'Nuevo Cuaderno', ... }]
   [NotebookContext] Setting active notebook: nb_...
   ```

## Paso 5: Verificar localStorage directamente

1. En la Consola, ejecuta:
   ```javascript
   localStorage
   ```
   
2. O ejecuta:
   ```javascript
   Object.keys(localStorage).filter(k => k.includes('notebook'))
   ```
   
   Deberías ver algo como:
   ```
   ["notebooks_user-123-abc", "activeNotebook_user-123-abc"]
   ```

## Paso 6: Ver el contenido

En la Consola, ejecuta:
```javascript
// Ver todos los cuadernos guardados
JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k => k.startsWith('notebooks'))))

// Ver cuaderno activo
localStorage.getItem(Object.keys(localStorage).find(k => k.startsWith('activeNotebook')))
```

## 📋 Checklist de Debugging

- [ ] ¿Ves logs de `[NotebookContext]` cuando creas un cuaderno?
- [ ] ¿El log "Saving notebooks" aparece después de crear?
- [ ] ¿Puedes ver `notebooks_*` en localStorage?
- [ ] ¿Después de F5, ves el log "Found in localStorage"?
- [ ] ¿El log muestra `notebooksCount: 1` después de F5?
- [ ] ¿Los cuadernos aparecen en NotebookSelector después de F5?

## 🆘 Si algo falla

Reporta qué sucede en cada paso. Por ejemplo:

- "Vi el log de creación pero NO vi el de guardado"
- "localStorage tiene los datos pero el log dice notebooksCount: 0"
- "Después de F5, el log no aparece en absoluto"
- "El log de loading dice Found in localStorage pero luego desaparece"

## 📁 Herramienta de Prueba

También puedes usar `http://localhost:5173/localStorage-test.html` para:
- Probar localStorage básico
- Simular creación de cuadernos
- Ver todo el contenido de localStorage
- Limpiar localStorage

## 🔍 Información Útil

**userId** - Se obtiene de Supabase auth, debería ser un UUID
**Clave de almacenamiento** - `notebooks_${userId}` (por ejemplo: `notebooks_550e8400-e29b-41d4-a716-446655440000`)
**Contenido** - Array JSON de objetos notebook

Si tienes problemas, comparte:
1. Los logs de la Consola (F12 → Console)
2. El contenido de localStorage (copia lo que ves)
3. Exactamente qué pasos hiciste
