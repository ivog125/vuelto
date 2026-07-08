# Vuelto

Aplicación web simple para controlar gastos personales con HTML, CSS y JavaScript vanilla, Firebase Auth y Firestore.

## Qué incluye
- Login con email/password mediante Firebase Auth
- Configuración mensual por mes
- Registro de gastos con categorías predefinidas
- Resumen mensual con sobres y margen
- Lista de movimientos con borrado
- Histórico de los últimos 6 meses con gráfico

## Configuración de Firebase
1. Crear un proyecto en Firebase Console.
2. Habilitar Authentication > Sign-in method > Email/password.
3. Crear una base de Firestore.
4. Reemplazar los valores de `firebaseConfig` en [js/app.js](js/app.js) con tus datos del proyecto.
5. Reemplazar `'YOUR_FIREBASE_UID'` en [firestore.rules](firestore.rules) con tu UID real de Firebase Auth.
6. Subir las reglas de seguridad de [firestore.rules](firestore.rules) en Firebase Console.

## Uso local
- Abrir [index.html](index.html) en un navegador, o usar un servidor simple como `python -m http.server`.
- Ingresar con el usuario creado en Firebase Auth.

## Deploy en Vercel
1. Crear un repositorio con estos archivos.
2. Conectar el repo en Vercel.
3. Deployar el proyecto.
4. Asegurarse de que la app use el mismo proyecto de Firebase configurado.
