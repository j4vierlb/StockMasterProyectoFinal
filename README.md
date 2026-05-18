# 📦 StockMaster — Sistema de Gestión de Inventario

Aplicación móvil y web para la gestión de inventario, desarrollada con **Ionic + Angular** y compilada para **Android** mediante Capacitor. Permite administrar productos, usuarios y stock con una interfaz moderna y funcional.

---

## 🚀 Tecnologías utilizadas

| Capa | Tecnología |
|------|-----------|
| Frontend | Ionic 8 + Angular 20 + TypeScript |
| Base de datos | SQLite (Capacitor SQLite) |
| Mobile | Android (Capacitor 7) |
| Notificaciones | EmailJS |
| Testing | Jasmine + Karma |
| Estilos | SCSS |

---

## ✨ Funcionalidades principales

- 🔐 **Autenticación** — Login con validación de formularios
- 🔑 **Recuperación de contraseña** — Envío de email de reset via EmailJS
- 📦 **Gestión de productos** — Listado, búsqueda y filtrado por categoría
- 👤 **Panel de administración** — Gestión de usuarios y configuración
- 📊 **Dashboard** — Métricas y actividad reciente
- 📱 **App Android** — Compilada con Capacitor para dispositivos móviles
- 💾 **Almacenamiento local** — Base de datos SQLite embebida

---

## 🧪 Tests unitarios

El proyecto cuenta con más de **50 tests unitarios** distribuidos en 15 archivos:

- `EmailService` — Envío de emails y recuperación de contraseña
- `LoginFormComponent` — Validación de formulario y autenticación
- `ResetPasswordPage` — Flujo de recuperación de contraseña
- `HomePage` — Dashboard, navegación y logout
- `ProductsPage` — Filtrado y categorización de productos
- Componentes adicionales: `HomeMetrics`, `HomeQuickActions`, `HomeRecentActivities`, etc.

Para ejecutar los tests:

```bash
# Modo desarrollo (con navegador)
npm test

# Modo headless (para CI/CD)
npm test -- --no-watch --browsers=ChromeHeadless

# Con reporte de cobertura
npm test -- --no-watch --code-coverage
```

---

## ⚙️ Instalación y ejecución

### Requisitos previos

- Node.js 18+
- npm
- Angular CLI: `npm install -g @angular/cli`
- Ionic CLI: `npm install -g @ionic/cli`

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/j4vierlb/StockMasterProyectoFinal.git
cd StockMasterProyectoFinal

# 2. Instalar dependencias
npm install

# 3. Ejecutar en el navegador
ionic serve
```

### Ejecutar en Android

```bash
# Compilar
ionic build

# Sincronizar con Capacitor
npx cap sync android

# Abrir en Android Studio
npx cap open android
```

---

## 📁 Estructura del proyecto

```
src/
├── app/
│   ├── components/       # Componentes reutilizables
│   ├── pages/            # Páginas de la app (home, login, products, admin...)
│   ├── services/         # Servicios (email, auth, productos...)
│   └── app-routing.module.ts
├── assets/               # Imágenes e íconos
├── environments/         # Configuración de entornos
└── theme/                # Variables de estilos globales
Android/                  # Proyecto nativo Android (Capacitor)
```

---

## 📬 Configuración de EmailJS

El servicio de recuperación de contraseña utiliza [EmailJS](https://www.emailjs.com/). Para configurarlo, edita el archivo `src/app/services/email.service.ts` con tus propias credenciales de EmailJS.

---

## 👨‍💻 Autor

**Javier Lara Bustos**  
[GitHub](https://github.com/j4vierlb)
