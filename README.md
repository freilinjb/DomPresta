# DomPresta - Sistema de Préstamos

Una aplicación móvil completa para la gestión de préstamos desarrollada con React Native y Expo.

## ✨ Características Implementadas

### 🔐 Autenticación
- Sistema de login con base de datos SQLite
- Usuario administrador por defecto
- Gestión de sesiones

### 💾 Base de Datos
- SQLite local con expo-sqlite
- Tablas para usuarios, préstamos y pagos
- Almacenamiento persistente de datos

### 🏠 Dashboard
- Vista general con estadísticas de préstamos
- Acciones rápidas para crear préstamos y ver reportes
- Resumen de préstamos recientes

### 📋 Gestión de Préstamos
- Lista completa de préstamos
- Detalles individuales de cada préstamo
- Creación y edición de préstamos
- Cálculos automáticos de pagos mensuales

### 💰 Registro de Pagos
- Historial completo de pagos
- Registro de nuevos pagos
- Actualización de estados de pago
- Cálculo de saldos pendientes

### 🔔 Notificaciones
- Recordatorios automáticos de pagos
- Notificaciones de vencimiento de préstamos
- Sistema de notificaciones push con Expo

### 📊 Reportes PDF
- Reporte general de todos los préstamos
- Reportes individuales por préstamo
- Historial de pagos en PDF
- Compartir reportes directamente

## Tecnologías Utilizadas

- React Native
- Expo
- TypeScript
- React Navigation
- NativeWind (TailwindCSS para React Native)

## Instalación

1. Instala las dependencias:
   ```bash
   npm install
   ```

2. Inicia la aplicación:
   ```bash
   npm start
   ```

## Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── common/         # Componentes comunes (Button, etc.)
│   └── loans/          # Componentes específicos de préstamos
├── constants/          # Constantes de la aplicación
├── navigation/         # Configuración de navegación
├── screens/            # Pantallas de la aplicación
│   ├── Auth/           # Pantallas de autenticación
│   ├── Home/           # Dashboard principal
│   ├── Loans/          # Gestión de préstamos
│   ├── Profile/        # Perfil de usuario
│   └── Settings/       # Configuraciones
├── services/           # Servicios API
├── types/              # Definiciones TypeScript
└── utils/              # Utilidades
```

## Próximas Funcionalidades

- Autenticación completa
- API backend
- Base de datos local
- Notificaciones push
- Generación de reportes
- Cálculo de intereses
- Gestión de pagos