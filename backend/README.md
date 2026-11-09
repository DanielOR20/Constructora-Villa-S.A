# Sistema de Gestión de Inventarios & Auditoría de Compras (Nivel Empresarial)
## Constructora Del Valle S.A. — Parte B (Caso de Estudio: Quiz Barry Vega)

Infraestructura de Backend robusta, desacoplada y de nivel industrial desarrollada con **Node.js**, **Express** y **MySQL** (`mysql2/promise`).

---

## 🏛️ Arquitectura y Patrones de Software Empresarial

```text
backend/
├── src/
│   ├── config/
│   │   └── db.js                         # Pool MySQL2 con reintentos y lectura .env
│   ├── database/
│   │   ├── schema.sql                    # DDL normalizado con claves foráneas CASCADE
│   │   ├── seed.sql                      # DML con insumos de Barry Vega y órdenes de octubre
│   │   └── seed.js                       # Runner ejecutable (npm run seed)
│   ├── middlewares/
│   │   └── error.middleware.js           # Manejo global de excepciones MySQL/Express (400, 404, 409, 500)
│   ├── services/
│   │   ├── materiales.service.js         # CRUD SQL y cálculo dinámico de stock (entradas - salidas)
│   │   ├── movimientos.service.js        # Transacciones ACID estrictas (beginTransaction, commit, rollback)
│   │   ├── reorden.service.js            # Motor matemático con Math.ceil y estados CRÍTICO, ADVERTENCIA, ESTABLE
│   │   ├── duplicados.service.js         # Auditoría de compras duplicadas y fugas de valor en colones (₡)
│   │   ├── alertas.service.js            # Consulta centralizada de insumos bajo punto de reorden
│   │   └── ordenes.service.js            # Consultas de compras y proveedores
│   ├── controllers/
│   │   ├── materiales.controller.js      # Validaciones numéricas y códigos HTTP limpios
│   │   ├── movimientos.controller.js     # Validaciones de enums y captura de stock insuficiente (HTTP 400)
│   │   ├── alertas.controller.js         # Respuestas JSON estructuradas de reorden
│   │   └── ordenes.controller.js         # Controlador de auditoría de adquisiciones
│   ├── routes/
│   │   ├── materiales.routes.js          # /api/materiales
│   │   ├── movimientos.routes.js         # /api/movimientos
│   │   ├── alertas.routes.js             # /api/alertas
│   │   ├── ordenes.routes.js             # /api/ordenes
│   │   └── inventario.routes.js          # /api/inventario
│   └── index.js                          # Servidor Express, CORS, puerto 4000
├── test/
│   ├── reorden.test.js                   # Pruebas unitarias de reorden riguroso (Math.ceil)
│   └── transaccion-stock.test.js         # Pruebas unitarias de rechazo de saldo negativo
├── .env.example
├── .env
├── package.json
└── README.md
```

---

## 🔒 1. Gestión Transaccional ACID en Inventario (`movimientos.service.js`)

Toda operación de salida o traslado se procesa dentro de una transacción estricta utilizando `mysql2/promise`:
1. **Inicio de Transacción:** `await connection.beginTransaction()`
2. **Bloqueo y Consulta en Tiempo Real:** Bloquea las filas del material con `FOR UPDATE` y suma entradas contra salidas:
   $$\text{Stock Actual} = \sum \text{Entradas} - \sum \text{Salidas} + \sum \text{Ajustes}$$
3. **Validación Antisalida Negativa:** Si $\text{Stock Actual} - \text{Cantidad Solicitada} < 0$:
   - Se ejecuta inmediatamente `await connection.rollback()`.
   - Se libera la conexión: `connection.release()`.
   - Se lanza un error con código HTTP **`400 Bad Request`** y código `'STOCK_INSUFICIENTE'`, detallando el saldo actual y la cantidad excedida.
4. **Inserción y Actualización:** Inserta en `movimientos` y actualiza `inventario_stock`.
5. **Confirmación:** `await connection.commit()`.

---

## 🧮 2. Motor Matemático de Reorden Riguroso (`reorden.service.js`)

Implementa las fórmulas del quiz aplicando redondeo hacia arriba mediante **`Math.ceil`**:

1. **Stock de Seguridad ($SS$):**
   $$SS = \lceil (D_{max} - D_{prom}) \times \text{Lead Time} \rceil$$

2. **Punto de Reorden ($PR$):**
   $$PR = \lceil D_{prom} \times \text{Lead Time} \rceil + SS$$

3. **Métricas Analíticas Devueltas por Material:**
   - `stockActual`: Saldo real disponible (entradas - salidas).
   - `stockSeguridad`: Valor de $SS$.
   - `puntoReorden`: Valor de $PR$.
   - `deficit`: $\max(0, PR - \text{stockActual})$ (unidades requeridas para alcanzar el umbral).
   - `margenNeto`: $\text{stockActual} - PR$.
   - `estadoReposicion`:
     - **`CRITICO`**: Si $\text{stockActual} \le PR$.
     - **`ADVERTENCIA`**: Si $PR < \text{stockActual} \le \lceil PR \times 1.25 \rceil$.
     - **`ESTABLE`**: Si $\text{stockActual} > \lceil PR \times 1.25 \rceil$.
   - `cantidadSugeridaCompra`: Unidades sugeridas para alcanzar una cobertura óptima ($PR \times 1.5$).

---

## 🔍 3. Motor de Auditoría de Compras Duplicadas y Fugas de Valor (`duplicados.service.js`)

Moneda oficial del informe: **Colones costarricenses (₡)**.

El motor evalúa dos dimensiones de fuga de valor:
1. **Compras Duplicadas:**
   - Mismo proveedor (`oc1.id_proveedor = oc2.id_proveedor`).
   - Mismo material (`d1.id_material = d2.id_material`).
   - Cantidades con variación menor al 10% ($\le 10\%$).
   - Ventana temporal de hasta 3 días entre órdenes ($\Delta \text{días} \le 3$).
   - *Caso Barry Vega Detectado:* Órdenes **`OC-1041`** y **`OC-1042`** emitidas a **Proveedor A** (500 sacos de cemento y 300 varillas #3, fuga de **`₡130,250.00`**).
2. **Sobreprecios y Compras Fuera de Contrato:**
   - Compara el precio unitario pagado en la orden frente al precio contractual de lista en catálogo (`materiales.precio_unitario`).
   - Si $\text{Precio Pagado} > \text{Precio Contrato}$:
     $$\text{Fuga por Sobreprecio} = (\text{Precio Pagado} - \text{Precio Contrato}) \times \text{Cantidad}$$
3. **Cuantificación Consolidada:** Reporta la fuga de valor total formateada con el símbolo **`₡`** (ej: `₡130,250.00`).

---

## 🛡️ 4. Validaciones de Entrada en Controladores

- **Validación de Tipos y Rangos:** Cantidades $> 0$, precios $\ge 0$, identificadores numéricos enteros positivos.
- **Tipos de Movimientos:** Enums aceptados: `'ENTRADA'`, `'SALIDA'`, `'TRANSFERENCIA'`, `'TRASLADO'`, `'AJUSTE'` (case-insensitive).
- **Respuestas HTTP Estandarizadas:**
  - `200 OK`: Consultas y actualizaciones exitosas.
  - `201 Created`: Registros nuevos creados.
  - `400 Bad Request`: Datos de entrada inválidos o stock insuficiente para salidas.
  - `404 Not Found`: Recurso no encontrado.
  - `409 Conflict`: Claves duplicadas o violación de unicidad.
  - `500 Internal Server Error`: Errores no controlados procesados por el middleware.

---

## 🚨 5. Middleware Global de Manejo de Errores (`src/middlewares/error.middleware.js`)

Captura excepciones de MySQL (`ER_DUP_ENTRY`, `ER_NO_REFERENCED_ROW`, `ECONNREFUSED`) y errores de Express, respondiendo con un JSON limpio que garantiza la estabilidad ininterrumpida del servidor:
```json
{
  "success": false,
  "error": {
    "codigo": "STOCK_INSUFICIENTE",
    "mensaje": "Operación rechazada por falta de existencias...",
    "statusCode": 400,
    "timestamp": "2026-11-09T17:35:00.000Z",
    "ruta": "/api/movimientos"
  }
}
```

---

## 🚀 Puesta en Marcha y Pruebas

```bash
# 1. Instalar dependencias
cd backend
npm install

# 2. Migrar y sembrar base de datos
npm run seed

# 3. Ejecutar pruebas unitarias automatizadas
npm test

# 4. Iniciar servidor en modo desarrollo
npm run dev
```

El servidor estará escuchando en **`http://localhost:4000`**.
