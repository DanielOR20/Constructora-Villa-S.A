# Frontend - Constructora Del Valle S.A.

Aplicación web interactiva desarrollada con **React 18**, **Vite** y **Tailwind CSS** para la gestión de inventarios, cálculo en tiempo real de puntos de reorden y auditoría de compras duplicadas para **Constructora Del Valle S.A.**

---

## 🚀 Características Principales

1. **Dashboard General:**
   - Tarjetas de resumen ejecutivo (Total Materiales, Stock Crítico, Compras Duplicadas, Movimientos).
   - Monitoreo visual de niveles de existencias vs. Punto de Reorden ($PR$).
   - Desglose de existencias por ubicación (Bodega Central, Obra Torre Norte, Obra Residencial Las Palmas).
2. **Tabla de Materiales & Punto de Reorden:**
   - Cálculo en tiempo real de Stock de Seguridad ($SS$) y Punto de Reorden ($PR$).
   - Fórmulas:
     $$SS = (D_{max} - D_{prom}) \times L$$
     $$PR = (D_{prom} \times L) + SS$$
   - Clasificación de estados: `CRITICO` o `ESTABLE`.
   - **Simulador Interactivo:** Permite ajustar en vivo la demanda y el lead time para predecir el impacto en el inventario.
3. **Formulario de Registro de Movimientos:**
   - Registro de `ENTRADA` (recepción/compra), `SALIDA` (consumo en obra) y `TRANSFERENCIA` (traslado entre almacenes).
   - Validaciones en tiempo real (cantidades $> 0$, validación de bodega origen/destino).
   - Lista de movimientos recientes con actualización instantánea.
4. **Panel de Alertas & Auditoría de Compras (Parte A):**
   - Comparación cara a cara de órdenes duplicadas detectadas por el algoritmo (órdenes `OC-1041` vs `OC-1042` emitidas al `Proveedor A`).
   - Alertas preventivas de desabasto para materiales en estado crítico.
5. **Cliente HTTP Axios (`src/services/api.js`):**
   - Conexión preconfigurada al servidor backend en `http://localhost:4000/api`.

---

## 🛠️ Instalación y Ejecución

### 1. Ingresar a la carpeta frontend
```bash
cd frontend
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Iniciar el servidor de desarrollo
```bash
npm run dev
```

La aplicación abrirá por defecto en:
👉 `http://localhost:5173`

> **Importante:** Asegúrate de tener el backend corriendo en `http://localhost:4000` (mediante `cd backend && npm run dev` o `npm start`) para que el frontend pueda consultar y registrar datos en la base de datos MySQL.

### 4. Compilar para Producción
```bash
npm run build
```
Generará los archivos optimizados en la carpeta `dist/`.

