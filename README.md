# Sistema Integral de Gestión de Inventarios, Seguridad RBAC & Auditoría de Compras
## Constructora Del Valle S.A. &mdash; Caso de Estudio Barry Vega (Partes A & B)

Solución Full-Stack de nivel industrial y empresarial compuesta por un **Backend en Node.js/Express con MySQL** y una **Interfaz moderna en React 18, Vite y Tailwind CSS** con una **paleta corporativa basada estrictamente en rojo, blanco y negro**.

Repositorio oficial en GitHub: [https://github.com/DanielOR20/Constructora-Villa-S.A.git](https://github.com/DanielOR20/Constructora-Villa-S.A.git)

---

## 🏗️ Arquitectura del Sistema

```text
clase 15 09-11-2026/
├── start-dev.bat                 # Lanzador de 1-clic para Windows (CMD)
├── start-dev.ps1                 # Lanzador de 1-clic para PowerShell
├── package.json                  # Scripts orquestadores del monorepo
├── README.md                     # Documentación técnica completa
│
├── backend/                      # API REST Node.js + Express + MySQL2 (Puerto 4000)
│   ├── src/
│   │   ├── config/               # db.js (Pool mysql2/promise con auto-reintento y variables de entorno)
│   │   ├── database/             # schema.sql, seed.sql, seed.js (Migraciones y datos semilla oficiales)
│   │   ├── middlewares/          # auth.middleware.js (JWT, RBAC y jerarquías) y error.middleware.js
│   │   ├── services/             # Lógica de negocio y motores matemáticos
│   │   │   ├── auth.service.js        # Cifrado bcrypt y firma/verificación de tokens JWT
│   │   │   ├── materiales.service.js  # CRUD y stock neto dinámico
│   │   │   ├── movimientos.service.js # Transacciones ACID (BEGIN, FOR UPDATE, COMMIT, ROLLBACK)
│   │   │   ├── reorden.service.js     # Fórmulas SS y PR con redondeo Math.ceil
│   │   │   ├── duplicados.service.js  # Auditoría de compras duplicadas y sobreprecios (₡)
│   │   │   ├── alertas.service.js     # Consolidado de estado crítico y advertencias preventivas
│   │   │   └── ordenes.service.js     # Matriz de Aprobación Jerárquica y compras de octubre
│   │   ├── controllers/          # Controladores HTTP y validaciones estrictas
│   │   ├── routes/               # Enrutadores modulares (/api/auth, /api/materiales, /api/movimientos, etc.)
│   │   └── index.js              # Entrypoint Express, CORS y request logging
│   ├── test/
│   │   ├── reorden.test.js            # Pruebas de fórmulas SS y PR con Math.ceil
│   │   ├── transaccion-stock.test.js  # Pruebas de rollback y rechazo ante saldo negativo (400)
│   │   ├── auth-jwt.test.js           # Pruebas de hashing bcrypt y emisión/validación JWT
│   │   └── matriz-aprobacion.test.js  # Pruebas de la Matriz Jerárquica de Aprobación de Órdenes
│   ├── .env.example              # Plantilla de credenciales MySQL
│   ├── api_requests.http         # Colección de peticiones REST para VS Code REST Client
│   └── package.json
│
└── frontend/                     # Aplicación SPA React 18 + Vite + Tailwind CSS (Puerto 5173)
    ├── src/
    │   ├── components/
    │   │   ├── Sidebar.jsx          # Barra lateral negra (bg-zinc-950) con acentos rojos e insignias reactivas
    │   │   ├── Dashboard.jsx        # KPIs ejecutivos, valor de inventario, stock crítico y barras de cobertura
    │   │   ├── MaterialesTable.jsx  # Tabla con cabecera negra, badges rojo/verde y simulador interactivo
    │   │   ├── MovimientoForm.jsx   # Formulario con botón rojo corporativo y validación de saldo
    │   │   ├── AlertasPanel.jsx     # Auditoría Parte A & B (duplicados, sobreprecios y stock crítico)
    │   │   └── OrdenesPanel.jsx     # Módulo de Matriz de Aprobación en 1-clic con selector interactivo de rol
    │   ├── services/
    │   │   └── api.js               # Cliente HTTP Axios con interceptor automático Bearer JWT
    │   ├── App.jsx                  # Layout principal corporativo en rojo, blanco y negro
    │   └── index.css                # Directivas Tailwind y estilos corporativos
    └── package.json
```

---

## 👥 Credenciales de Acceso y Roles Oficiales (Seed Data)

Todos los usuarios cuentan con contraseña hasheada mediante `bcryptjs` (salt 10) precargada en MySQL:

| Nombre | Correo Electrónico | Contraseña | Rol en Sistema | Nivel | Límite de Aprobación |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Juan Pérez** | `juan.perez@constructoradelvalle.com` | `Password123!` | `jefatura_area` | 1 | Hasta ₡250,000.00 |
| **Carlos Mora** | `carlos.mora@constructoradelvalle.com` | `Password123!` | `jefatura_compras` | 2 | ₡250,001.00 a ₡2,000,000.00 |
| **Ana Gómez** | `ana.gomez@constructoradelvalle.com` | `Password123!` | `gerencia_financiera` | 3 | ₡2,000,001.00 a ₡10,000,000.00 |
| **Luis Rojas** | `luis.rojas@constructoradelvalle.com` | `Password123!` | `gerencia_general` | 4 | Más de ₡10,000,000.00 (+ Comité) |

---

## 🎨 Paleta Corporativa: Rojo, Blanco y Negro

| Componente UI | Especificación de Estilo | Propósito |
| :--- | :--- | :--- |
| **Sidebar / Navegación** | `bg-zinc-950 text-white`, logo `bg-red-600`, activo `bg-red-600 text-white` | Contraste máximo, sobriedad y presencia institucional. |
| **Tarjetas y Contenedores** | `bg-white border border-zinc-200 shadow-sm` | Claridad y legibilidad para métricas de inventario. |
| **Resaltes Críticos** | `text-red-600`, `border-2 border-red-600`, `bg-red-50 text-red-600` | Reservado exclusivamente para desabasto y órdenes duplicadas. |
| **Botones Principales** | `bg-red-600 hover:bg-red-700 text-white font-black` | Acciones de confirmación de movimientos e inspección de auditoría. |
| **Tablas de Datos** | Cabecera `bg-zinc-950 text-white font-bold`, filas con `bg-red-50/50` en críticos | Lectura ágil de insumos, SS, PR y déficit de stock. |
| **Badges de Estado** | `CRÍTICO` (Rojo `bg-red-600`), `ADVERTENCIA` (Ámbar `bg-amber-600`), `ESTABLE` (Verde `bg-emerald-600`) | Semáforo visual intuitivo de reposición de bodega. |

---

## 📐 Fórmulas Matemáticas y Reglas de Negocio

### 1. Motor de Reorden Riguroso (Quiz Barry Vega - Parte B)
Calculado mediante redondeo hacia arriba estricto (`Math.ceil`):
- **Stock de Seguridad ($SS$):**
  $$SS = \lceil(D_{max} - D_{prom}) \times L\rceil$$
- **Consumo durante Lead Time ($Consumo_{LT}$):**
  $$Consumo_{LT} = \lceil D_{prom} \times L\rceil$$
- **Punto de Reorden ($PR$):**
  $$PR = Consumo_{LT} + SS = \lceil D_{prom} \times L\rceil + \lceil(D_{max} - D_{prom}) \times L\rceil$$
- **Evaluación de Estados:**
  - `CRITICO`: $\text{Stock Actual} \le PR$ (Requiere emisión inmediata de OC).
  - `ADVERTENCIA`: $PR < \text{Stock Actual} \le \lceil PR \times 1.25\rceil$.
  - `ESTABLE`: $\text{Stock Actual} > \lceil PR \times 1.25\rceil$.

### 2. Gestión Transaccional ACID en Movimientos
- Los retiros de inventario se procesan con `connection.beginTransaction()` y bloqueo pesimista `SELECT ... FOR UPDATE`.
- Si un retiro excede el stock disponible en la bodega seleccionada, se invoca `connection.rollback()` y se devuelve un error **HTTP 400** (`STOCK_INSUFICIENTE`) impidiendo saldos negativos.

### 3. Matriz de Aprobación Jerárquica de Compras (Parte A)
- Clasificación automática del rol aprobador requerido al registrar una orden según su monto.
- Validación perimetral con middleware `verifyToken` y `requireRoles`.
- Bloqueo jerárquico estricto: Si el rol del usuario autenticado tiene un nivel menor al requerido por el monto de la orden, la API rechaza la firma con **HTTP 403 Forbidden** (`JERARQUIA_INSUFICIENTE`).

### 4. Auditoría de Compras Duplicadas y Fugas de Valor (Caso Barry Vega)
- **Moneda Oficial del Informe:** Colones costarricenses ($\unicode{x20A1}$).
- **Regla de Duplicados:** Mismo proveedor + partidas idénticas o similares ($<10\%$ variación) + ventana $\le 3$ días.
- **Hallazgos Clave:**
  - **Órdenes Duplicadas:** `OC-1041` y `OC-1042` con Proveedor A (Fuga evitable: $\unicode{x20A1}130,250.00$).
  - **Sobreprecios Contractuales:** `OC-1038` ($\unicode{x20A1}2,400.00$), `OC-1043` ($\unicode{x20A1}1,575.00$) y `OC-1044` ($\unicode{x20A1}2,600.00$), sumando $\unicode{x20A1}6,575.00$.
  - **Fuga Total Cuantificada:** $\unicode{x20A1}136,825.00$.

---

## ⚡ Guía de Inicio Rápido

### Opción A: Lanzador de 1-Clic para Windows
Ejecuta directamente desde la raíz del proyecto:
- **Doble clic en:** `start-dev.bat`
- **O en PowerShell:** `.\start-dev.ps1`

### Opción B: Ejecución Manual con npm

1. **Configurar y poblar la Base de Datos MySQL:**
   ```bash
   cd backend
   npm run seed
   ```
2. **Iniciar Backend (Terminal 1 - Puerto 4000):**
   ```bash
   npm run dev:backend   # Desde la raíz, o 'npm run dev' dentro de /backend
   ```
   *Servidor activo en: `http://localhost:4000/api`*

3. **Iniciar Frontend (Terminal 2 - Puerto 5173):**
   ```bash
   npm run dev:frontend  # Desde la raíz, o 'npm run dev' dentro de /frontend
   ```
   *Aplicación disponible en: `http://localhost:5173`*

---

## 🧪 Pruebas Automatizadas

Desde la raíz del proyecto o dentro de `/backend`:
```bash
npm test
```

Ejecuta **14 pruebas unitarias nativas** (`node:test`) que validan el 100% de la lógica del sistema:
- ✔ 6 pruebas de la Matriz de Aprobación Jerárquica y validación de jerarquías de roles.
- ✔ 2 pruebas de Cifrado Bcrypt y Emisión/Validación de tokens JWT.
- ✔ 4 pruebas del Motor Matemático de Reorden Riguroso con `Math.ceil`.
- ✔ 2 pruebas de Validación Transaccional de Saldo Negativo (Rollback en HTTP 400).

---

## 📡 Catálogo de Endpoints REST

| Módulo | Método | Endpoint | Descripción |
| :--- | :---: | :--- | :--- |
| **Auth** | `POST` | `/api/auth/register` | Registro de usuario corporativo |
| **Auth** | `POST` | `/api/auth/login` | Inicio de sesión y entrega de JWT Bearer |
| **Auth** | `GET` | `/api/auth/me` | Perfil y rol del usuario autenticado |
| **Auth** | `GET` | `/api/auth/usuarios` | Directorio de usuarios autorizados |
| **Materiales** | `GET` | `/api/materiales` | Listado de insumos con stock dinámico |
| **Materiales** | `GET` | `/api/materiales/:id/reorden` | Cálculo matemático de $SS$ y $PR$ |
| **Movimientos** | `GET` | `/api/movimientos` | Historial de transacciones de bodega |
| **Movimientos** | `POST` | `/api/movimientos` | **Transacción ACID con rollback ante saldo negativo (400)** |
| **Movimientos** | `GET` | `/api/movimientos/stock/ubicaciones` | Existencias por bodega/obra |
| **Alertas** | `GET` | `/api/alertas/resumen` | KPIs globales de inventario y alertas |
| **Alertas** | `GET` | `/api/alertas/reorden/criticos` | Insumos con $Stock \le PR$ |
| **Alertas** | `GET` | `/api/alertas/duplicados` | Cuantificación de fugas de valor en colones ($\unicode{x20A1}$) |
| **Órdenes** | `GET` | `/api/ordenes` | Listado de órdenes de compra |
| **Órdenes** | `POST` | `/api/ordenes` | Requisición de compra con asignación de rol |
| **Órdenes** | `PATCH` | `/api/ordenes/:id/aprobar` | **Aprobación/Rechazo con validación de jerarquía JWT (403)** |
