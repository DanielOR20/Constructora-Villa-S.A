# Sistema Integral de Gestión de Inventarios & Auditoría de Compras
## Constructora Del Valle S.A. &mdash; Caso de Estudio Barry Vega

Solución Full-Stack de nivel industrial y empresarial compuesta por un **Backend en Node.js/Express con MySQL** y una **Interfaz moderna en React 18, Vite y Tailwind CSS** con una **paleta corporativa basada estrictamente en rojo, blanco y negro**.

---

## 🏗️ Arquitectura del Sistema

```text
clase 15 09-11-2026/
├── start-dev.bat                 # Lanzador de 1-clic para Windows (CMD)
├── start-dev.ps1                 # Lanzador de 1-clic para PowerShell
├── package.json                  # Scripts orquestadores del proyecto raíz
├── README.md                     # Documentación técnica completa
│
├── backend/                      # API REST Node.js + Express + MySQL2 (Puerto 4000)
│   ├── src/
│   │   ├── config/               # db.js (Pool mysql2/promise, reintentos y variables de entorno)
│   │   ├── database/             # schema.sql, seed.sql, seed.js (Migraciones y datos semilla)
│   │   ├── services/             # Lógica de negocio y motores matemáticos
│   │   │   ├── materiales.service.js  # CRUD y stock dinámico
│   │   │   ├── movimientos.service.js # Transacciones ACID (BEGIN/COMMIT/ROLLBACK)
│   │   │   ├── reorden.service.js     # Fórmulas SS y PR con Math.ceil
│   │   │   ├── duplicados.service.js  # Auditoría de compras duplicadas y sobreprecios (₡)
│   │   │   ├── alertas.service.js     # Consolidado de estado crítico y advertencias
│   │   │   └── ordenes.service.js     # Consultas de compras de octubre
│   │   ├── controllers/          # Controladores HTTP y validaciones estrictas
│   │   ├── middlewares/          # error.middleware.js (Manejador global de errores)
│   │   ├── routes/               # Enrutadores modulares (/api/materiales, /api/movimientos, etc.)
│   │   └── index.js              # Entrypoint Express, CORS y request logging
│   ├── test/
│   │   ├── reorden.test.js       # Pruebas unitarias de fórmulas SS y PR
│   │   └── transaccion-stock.test.js # Pruebas unitarias de rollback ante saldo negativo
│   ├── .env.example              # Plantilla de credenciales MySQL
│   ├── api_requests.http         # Colección de peticiones REST para VS Code REST Client
│   └── package.json
│
└── frontend/                     # Aplicación SPA React 18 + Vite + Tailwind CSS (Puerto 5173)
    ├── src/
    │   ├── components/
    │   │   ├── Sidebar.jsx          # Barra lateral negra con acentos rojos e insignias reactivas
    │   │   ├── Dashboard.jsx        # KPIs ejecutivos, existencias por bodega y barras de cobertura
    │   │   ├── MaterialesTable.jsx  # Tabla con cabecera negra, badges y simulador en vivo
    │   │   ├── MovimientoForm.jsx   # Formulario con botón rojo corporativo y validación de saldo
    │   │   ├── AlertasPanel.jsx     # Auditoría Parte A & B (duplicados, sobreprecios y stock crítico)
    │   │   └── OrdenesPanel.jsx     # Visualización de compras de octubre con modal detallado
    │   ├── services/
    │   │   └── api.js               # Cliente HTTP centralizado Axios (http://localhost:4000/api)
    │   ├── App.jsx                  # Layout principal en rojo, blanco y negro
    │   └── index.css                # Directivas Tailwind y estilos corporativos
    └── package.json
```

---

## 🎨 Paleta Corporativa: Rojo, Blanco y Negro

| Componente UI | Especificación de Estilo | Propósito |
| :--- | :--- | :--- |
| **Sidebar / Navegación** | `bg-zinc-950 text-white`, logo `bg-red-600`, activo `bg-red-600 text-white` | Contraste máximo, sobriedad y presencia institucional. |
| **Tarjetas y Contenedores** | `bg-white border border-zinc-200 shadow-sm` | Claridad y legibilidad para métricas de inventario. |
| **Resaltes Críticos** | `text-red-600`, `border-2 border-red-600`, `bg-red-50 text-red-600` | Reservado exclusivamente para desabasto y órdenes duplicadas. |
| **Botones Principales** | `bg-red-600 hover:bg-red-700 text-white font-black` | Acciones de confirmación de movimientos e inspección de auditoría. |
| **Tablas de Datos** | Cabecera `bg-zinc-950 text-white font-bold`, filas con `bg-red-50/50` en críticos | Lectura ágil de insumos, SS, PR y déficit de stock. |

---

## 📐 Fórmulas Matemáticas y Reglas de Negocio

### 1. Motor de Reorden Riguroso
Calculado mediante redondeo hacia arriba estricto (`Math.ceil`):
- **Stock de Seguridad ($SS$):**
  $$SS = \lceil(D_{max} - D_{prom}) \times L\rceil$$
- **Punto de Reorden ($PR$):**
  $$PR = \lceil D_{prom} \times L\rceil + SS$$
- **Evaluación de Estados:**
  - `CRITICO`: $\text{Stock Actual} \le PR$ (Requiere emisión inmediata de OC).
  - `ADVERTENCIA`: $PR < \text{Stock Actual} \le \lceil PR \times 1.25\rceil$.
  - `ESTABLE`: $\text{Stock Actual} > \lceil PR \times 1.25\rceil$.

### 2. Gestión Transaccional ACID en Movimientos
- Los retiros de inventario se procesan con `connection.beginTransaction()` y bloqueo pesimista `SELECT ... FOR UPDATE`.
- Si un retiro excede el stock disponible en la bodega seleccionada, se invoca `connection.rollback()` y se devuelve un error **HTTP 400** impidiendo saldos negativos.

### 3. Auditoría de Compras Duplicadas y Sobreprecios (Caso Barry Vega)
- **Moneda Oficial del Informe:** Colones costarricenses ($\unicode{x20A1}$).
- **Regla de Duplicados:** Mismo proveedor + partidas idénticas o similares ($<10\%$ variación) + ventana $\le 3$ días.
- **Caso Detectado:** Órdenes `OC-1041` y `OC-1042` con Proveedor A (Fuga evitable: $\unicode{x20A1}130,250.00$).

---

## ⚡ Guía de Inicio Rápido

### Opción A: Lanzador de 1-Clic para Windows
Ejecuta directamente desde la raíz del proyecto:
- **Doble clic en:** `start-dev.bat`
- **O en PowerShell:** `.\start-dev.ps1`

### Opción B: Ejecución Manual con npm

1. **Configurar y poblar la Base de Datos:**
   ```bash
   cd backend
   npm run seed
   ```
2. **Iniciar Backend (Terminal 1):**
   ```bash
   npm run dev:backend   # Desde la raíz, o 'npm run dev' dentro de /backend
   ```
   *Servidor activo en: `http://localhost:4000/api`*

3. **Iniciar Frontend (Terminal 2):**
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
Ejecuta 6 pruebas unitarias nativas (`node:test`) que validan el 100% de los algoritmos de reorden y los rollbacks de transacciones.
