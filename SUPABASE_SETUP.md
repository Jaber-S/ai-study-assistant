# Configurar Persistencia Permanente en Supabase

Para que los datos de los cuadernos (summaries, chats, quizzes, flashcards) se guarden permanentemente, necesitas configurar la tabla en Supabase.

## Pasos:

### 1. Abre tu proyecto en Supabase
- Ve a https://supabase.com
- Selecciona tu proyecto
- Ve a "SQL Editor"

### 2. Crea la tabla
- Copia todo el contenido del archivo `SUPABASE_MIGRATIONS.sql`
- Pégalo en el SQL Editor de Supabase
- Haz clic en "Execute" o presiona Cmd+Enter

### 3. Verifica la creación
- Ve a "Table Editor"
- Deberías ver una tabla llamada "notebooks"
- Comprueba que las columnas se han creado correctamente

## ¿Qué hace la migración?

- Crea la tabla `notebooks` con todos los campos necesarios
- Agrega índices para mejorar el rendimiento
- Configura Row Level Security (RLS) para que cada usuario solo vea sus propios cuadernos

## Troubleshooting

Si algo va mal:
1. Verifica que estés en el proyecto correcto
2. Comprueba que tus variables de entorno (VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY) sean correctas
3. Asegúrate de que el usuario esté autenticado antes de crear cuadernos

## Después de la configuración

Una vez configurada la tabla, la aplicación:
- Guardará automáticamente todos los datos en Supabase
- Carará los datos cuando entres en un cuaderno
- Mantendrá la sincronización entre localStorage y Supabase
