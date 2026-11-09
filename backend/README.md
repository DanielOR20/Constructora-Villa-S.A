# Sistema de Gestión de Inventarios & Auditoría de Compras (Nivel Empresarial)
## Constructora Del Valle S.A. — Parte A & B (Caso de Estudio: Quiz Barry Vega)

Infraestructura de Backend robusta, desacoplada y de nivel industrial desarrollada con **Node.js**, **Express**, **MySQL** (`mysql2/promise`), **Autenticación JWT**, **Control de Acceso Basado en Roles (RBAC)** y el **Motor de la Matriz de Aprobación de Órdenes de Compra**.

---

## 🏛️ Arquitectura y Patrones de Software Empresarial

```text
backend/
├── src/
│   ├── config/
│   │   └── db.js                         # Pool MySQL2 con reintentos y lectura .env
│   ├── database/
│   │   ├── schema.sql                    # DDL normalizado con claves foráneas, usuarios y matriz
│   │   ├── seed.sql                      # DML con insumos, usuarios por rol y órdenes de compra
│   │   └── seed.js                       # Runner ejecutable (npm run seed)
│   ├── middlewares/
│   │   ├── auth.middleware.js            # verifyToken (JWT), requireRoles y jerarquía RBAC
│   │   └── error.middleware.js           # Manejo global de excepciones MySQL/Express
│   ├── services/
│   │   ├── auth.service.js               # Registro seguro (bcrypt), Login (JWT) y perfiles
│   │   ├── ordenes.service.js            # Motor de Matriz de Aprobación, creación y firma digital
│   │   ├── materiales.service.js         # CRUD SQL y cálculo dinámico de stock
│   │   ├── movimientos.service.js        # Transacciones ACID estrictas (beginTransaction, commit, rollback)
│   │   ├── reorden.service.js            # Motor matemático con Math.ceil y estados de inventario
│   │   ├── duplicados.service.js         # Auditoría de compras duplicadas y sobreprecios en colones (₡)
│   │   └── alertas.service.js            # Consulta centralizada de insumos bajo punto de reorden
│   ├── controllers/
│   │   ├── auth.controller.js            # Registro, login, perfil y listado de usuarios
│   │   ├── ordenes.controller.js         # Aprobación y rechazo jerárquico de órdenes
│   │   ├── materiales.controller.js      # Validaciones numéricas y códigos HTTP limpios
│   │   ├── movimientos.controller.js     # Validaciones transaccionales y captura de saldo negativo
│   │   └── alertas.controller.js         # Respuestas JSON de reorden
│   ├── routes/
│   │   ├── auth.routes.js                # /api/auth (register, login, me, usuarios)
│   │   ├── ordenes.routes.js             # /api/ordenes (GET, POST, PATCH /:id/aprobar)
│   │   ├── materiales.routes.js          # /api/materiales
│   │   ├── movimientos.routes.js         # /api/movimientos
│   │   ├── alertas.routes.js             # /api/alertas
│   │   └── inventario.routes.js          # /api/inventario
│   └── index.js                          # Servidor Express, CORS, puerto 4000
├── test/
│   ├── aprobacion-matrix.test.js         # Pruebas unitarias de la matriz de aprobación, bcrypt y JWT
│   ├── reorden.test.js                   # Pruebas unitarias de reorden riguroso (Math.ceil)
│   └── transaccion-stock.test.js         # Pruebas unitarias de rechazo de saldo negativo
├── .env.example
├── .env
├── package.json
└── README.md
```

---

## 🔐 1. Seguridad, Autenticación JWT y Roles (RBAC)

El sistema implementa control de acceso jerárquico mediante tokens Bearer firmados con `jsonwebtoken` y almacenamiento de credenciales cifradas con `bcryptjs`:

### Roles del Sistema y Cuentas Semilla
Todas las cuentas de prueba iniciales tienen la contraseña: **`Password123!`**

| Rol | Usuario de Prueba | Correo Electrónico | Nivel Jerárquico |
| :--- | :--- | :--- | :---: |
| `jefatura_area` | Ing. Carlos Mendoza | `carlos.mendoza@constructoradelvalle.com` | Nivel 1 |
| `jefatura_compras` | Lic. Sofía Ramírez | `sofia.ramirez@constructoradelvalle.com` | Nivel 2 |
| `gerencia_financiera` | C.P. Fernando Castro | `fernando.castro@constructoradelvalle.com` | Nivel 3 |
| `gerencia_general` | Ing. Daniel Ortega | `daniel.ortega@constructoradelvalle.com` | Nivel 4 |

---

## 📋 2. Motor de la Matriz de Aprobación de Órdenes de Compra

Al registrarse cualquier orden de compra (`POST /api/ordenes`), el backend evalúa automáticamente el monto total en colones ($\unicode{x20A1}$) y le asigna el rol aprobador requerido:

| Rango de Monto de la Requisición | Rol Mínimo Requerido | Autoridad Competente |
| :--- | :--- | :--- |
| **Hasta ₡250,000.00** | `jefatura_area` | Jefatura de Área |
| **De ₡250,001.00 a ₡2,000,000.00** | `jefatura_compras` | Jefatura de Compras |
| **De ₡2,000,001.00 a ₡10,000,000.00** | `gerencia_financiera` | Gerencia Financiera |
| **Superior a ₡10,000,000.00** | `gerencia_general` | Gerencia General + Comité |

### Reglas de Negocio en la Firma Digital (`PATCH /api/ordenes/:id/aprobar`):
1. **Verificación de Token:** El firmante debe enviar su `Bearer <token>` válido en el header `Authorization`.
2. **Validación Jerárquica:** Si un usuario de menor jerarquía (ej. `jefatura_area`, Nivel 1) intenta autorizar una orden que requiere `gerencia_financiera` (Nivel 3), el sistema rechaza la operación inmediatamente con **`HTTP 403 Forbidden`** e informa el déficit de nivel.
3. **Delegación Ascendente:** Un rol superior (ej. `gerencia_general`) cuenta con facultades para autorizar órdenes de cualquier nivel inferior o igual al suyo.
4. **Rechazo Fundamentado:** Al rechazar una orden (`accion: 'rechazada'`), el sistema exige obligatoriamente consignar el motivo técnico de la objeción.

---

## 🔒 3. Gestión Transaccional ACID en Inventario (`movimientos.service.js`)

Toda operación de salida o traslado se procesa dentro de una transacción estricta utilizando `mysql2/promise`:
1. `await connection.beginTransaction()`
2. Bloqueo pesimista con `SELECT ... FOR UPDATE`.
3. Si $\text{Stock Actual} - \text{Cantidad} < 0$:
   - Se ejecuta `await connection.rollback()`.
   - Se devuelve **`HTTP 400 Bad Request`** con código `'STOCK_INSUFICIENTE'`.
4. Si hay existencias: Inserción en `movimientos`, actualización en `inventario_stock` y `await connection.commit()`.

---

## 🧮 4. Motor Matemático de Reorden Riguroso (`reorden.service.js`)

Fórmulas matemáticas exactas con redondeo hacia arriba (`Math.ceil`):
- **Stock de Seguridad ($SS$):** $\lceil (D_{max} - D_{prom}) \times \text{Lead Time} \rceil$
- **Punto de Reorden ($PR$):** $\lceil D_{prom} \times \text{Lead Time} \rceil + SS$
- **Estados:** `CRITICO` ($\text{Stock} \le PR$), `ADVERTENCIA` ($PR < \text{Stock} \le \lceil PR \times 1.25 \rceil$), `ESTABLE` ($> \lceil PR \times 1.25 \rceil$).

---

## 🔍 5. Auditoría de Compras Duplicadas (Parte A) y Sobreprecios

Moneda oficial: **Colones costarricenses ($\unicode{x20A1}$)**.
- **Caso Barry Vega Detectado:** Órdenes **`OC-1041`** y **`OC-1042`** emitidas a **Proveedor A** (500 sacos de cemento y 300 varillas #3, impacto duplicado de **$\unicode{x20A1}130,250.00$**).

---

## 🧪 Pruebas Automatizadas (14 Tests Nativos)

Ejecuta el conjunto completo de pruebas con:
```bash
npm test
```
Resultados:
- ✔ 6 pruebas de la Matriz de Aprobación y Jerarquías.
- ✔ 2 pruebas de Cifrado Bcrypt y Emisión de JWT.
- ✔ 4 pruebas de Fórmulas Matemáticas de Reorden (`Math.ceil`).
- ✔ 2 pruebas de Validación Transaccional de Saldo Negativo.
- **Total:** 14 pruebas pasando al 100% sin dependencias externas usando `node:test`.
