# DomPresta - Sistema de Préstamos

Una aplicación móvil para la gestión de préstamos desarrollada con React Native y Expo.

## Características

- **Dashboard**: Vista general de préstamos activos y estadísticas
- **Gestión de Préstamos**: Lista completa de préstamos con detalles
- **Perfil de Usuario**: Información del usuario y opciones de cuenta
- **Configuraciones**: Personalización de la aplicación

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