# Sistema de Análisis de Inventario Multi-sede

Aplicación Next.js para analizar inventario de 2 sedes con bases de datos PostgreSQL espejo.

## 🚀 Características

- **Conexión Dual**: Conecta simultáneamente a bases de datos de La Dorada y Manizales
- **Análisis Multi-sede**: Compara inventarios entre ambas sedes
- **Dashboard Interactivo**: Visualización de datos en tiempo real
- **Filtros Avanzados**: Sistema de filtrado por sede, categoría, fechas y stock
- **Responsive Design**: Interfaz adaptada para diferentes dispositivos

## 📋 Requisitos Previos

- Node.js 16.x o superior
- npm o yarn
- Acceso a las bases de datos PostgreSQL:
  - La Dorada: `cristaleria_db_done`
  - Manizales: `cristaleriamanzales_complete`

## 🛠️ Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd stock_analisis
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno** (opcional)
   ```bash
   # Crear archivo .env.local si es necesario
   NODE_ENV=development
   ```

## 🚀 Ejecución

### Desarrollo
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:3000`

### Producción
```bash
npm run build
npm start
```

## 📊 Estructura del Proyecto

```
src/
├── pages/                    # Páginas de la aplicación
│   ├── index.js             # Dashboard principal
│   ├── proyeccion-compras.js # Proyección de compras
│   ├── productos-sin-movimiento.js # Productos inactivos
│   └── mas-vendidos.js      # Productos más vendidos
├── lib/
│   └── database.js          # Configuración de conexiones BD
├── components/
│   ├── Layout.js            # Layout principal
│   └── FilterPanel.js       # Panel de filtros
└── styles/
    └── globals.css          # Estilos globales
```

## 🔧 Configuración de Bases de Datos

### Desarrollo
```javascript
const dbConfig = {
  ladorada: {
    host: '10.8.0.1',
    port: 7717,
    user: 'analista',
    password: 'analisis123',
    database: 'cristaleria_db_done'
  },
  manizales: {
    host: '10.8.0.1', 
    port: 7717,
    user: 'analista',
    password: 'analisis123',
    database: 'cristaleriamanzales_complete'
  }
}
```

### Producción
```javascript
const dbProdConfig = {
  both: {
    host: '5.161.103.230',
    port: 7717,
    user: 'vercel_user',
    password: 'non@ver@ge'
  }
}
```

## 📱 Páginas Disponibles

1. **Dashboard Principal** (`/`)
   - Vista general del inventario
   - Estado de conectividad de ambas sedes
   - Productos de prueba para verificar conexiones

2. **Proyección de Compras** (`/proyeccion-compras`)
   - Análisis de productos que requieren reposición
   - Proyecciones de demanda

3. **Productos Sin Movimiento** (`/productos-sin-movimiento`)
   - Identificación de productos inactivos
   - Análisis de stock obsoleto

4. **Más Vendidos** (`/mas-vendidos`)
   - Ranking de productos con mayor demanda
   - Análisis de tendencias de venta

## 🎨 Tecnologías Utilizadas

- **Next.js 14**: Framework de React
- **mysql2**: Cliente MySQL para Node.js
- **Chart.js**: Biblioteca para gráficos
- **Tailwind CSS**: Framework de CSS utilitario
- **JavaScript**: Lenguaje de programación

## 🔍 Verificación de Conectividad

La página principal incluye una sección de prueba que muestra:
- Estado de conexión a ambas bases de datos
- Número de productos cargados por sede
- Tabla de productos de prueba (primeros 5 registros)
- Indicadores visuales de estado de stock

## 🚨 Solución de Problemas

### Error de Conexión
1. Verificar que las bases de datos estén accesibles
2. Confirmar credenciales en `src/lib/database.js`
3. Verificar configuración de firewall/red

### Error de Dependencias
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📈 Próximas Funcionalidades

- [ ] Gráficos interactivos con Chart.js
- [ ] Exportación de reportes a PDF/Excel
- [ ] Alertas automáticas de stock bajo
- [ ] Análisis de tendencias temporales
- [ ] Dashboard de métricas avanzadas

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico o preguntas sobre el proyecto, contactar al equipo de desarrollo.
