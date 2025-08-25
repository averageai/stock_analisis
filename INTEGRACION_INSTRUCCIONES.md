# 🔗 INSTRUCCIONES DE INTEGRACIÓN - CONTROL.HTML

## 🎯 **OBJETIVO**

Integrar nuestra herramienta de extracción de productos con el archivo `control.html` existente, reemplazando las URLs de GitHub Raw por nuestros endpoints API y agregando un botón de actualización.

## 📋 **CAMBIOS REALIZADOS**

### **1. Archivo Creado: `control_integrado.html`**

Este archivo contiene todas las modificaciones necesarias para la integración:

#### **🔧 Cambios en la Configuración de Sedes**
```javascript
// ANTES (GitHub Raw)
const sedesConfig = {
    manizales: {
        archivo: 'https://raw.githubusercontent.com/averageai/files-source/main/productos_manizales.xlsx'
    },
    dorada: {
        archivo: 'https://raw.githubusercontent.com/averageai/files-source/main/productos_dorada.xlsx'
    }
};

// DESPUÉS (Nuestros Endpoints API)
const sedesConfig = {
    manizales: {
        archivo: 'https://average.lat/api/download-excel?sede=manizales'
    },
    ladorada: {
        archivo: 'https://average.lat/api/download-excel?sede=ladorada'
    }
};
```

#### **🆕 Nuevo Prompt de Actualización**
```html
<div class="update-prompt" id="updatePrompt">
    <h3>🔄 ¿Actualizar datos de la base de datos?</h3>
    <p>Los datos pueden estar desactualizados. ¿Deseas ejecutar una extracción fresca desde la base de datos?</p>
    <div class="update-buttons">
        <button class="btn-update" onclick="actualizarDatos()">✅ Sí, Actualizar</button>
        <button class="btn-skip" onclick="cargarDatosExistentes()">⏭️ No, Usar Datos Existentes</button>
    </div>
</div>
```

#### **🔄 Nuevas Funciones de Actualización**
```javascript
// Función para actualizar datos desde la base de datos
async function actualizarDatos() {
    // 1. Ejecutar extracción
    const extractResponse = await fetch('https://average.lat/api/extract-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    });
    
    // 2. Descargar archivo actualizado
    const response = await fetch(config.archivo);
    
    // 3. Procesar datos...
}

// Función para cargar datos existentes sin actualizar
async function cargarDatosExistentes() {
    // Descargar archivo existente directamente
    const response = await fetch(config.archivo);
    
    // Procesar datos...
}
```

## 🚀 **PASOS PARA IMPLEMENTAR**

### **Opción 1: Usar el archivo integrado (Recomendado)**

1. **Reemplazar el archivo original:**
   ```bash
   # Hacer backup del archivo original
   cp control.html control_original.html
   
   # Reemplazar con la versión integrada
   cp control_integrado.html control.html
   ```

2. **Verificar que el servidor esté ejecutándose:**
   ```bash
   npm run dev
   ```

3. **Probar la integración:**
   - Abrir `control.html` en el navegador
   - Seleccionar una sede
   - Verificar que aparezca el prompt de actualización
   - Probar ambas opciones (actualizar y usar existentes)

### **Opción 2: Modificar manualmente el archivo original**

Si prefieres modificar el archivo original `control.html`, sigue estos pasos:

#### **Paso 1: Actualizar la configuración de sedes**
Busca la sección `sedesConfig` y reemplaza las URLs:

```javascript
const sedesConfig = {
    manizales: {
        nombre: 'Manizales',
        archivo: 'https://average.lat/api/download-excel?sede=manizales',
        icon: '🏪',
        color: '#28a745'
    },
    ladorada: {
        nombre: 'La Dorada',
        archivo: 'https://average.lat/api/download-excel?sede=ladorada',
        icon: '🏬',
        color: '#3498db'
    }
};
```

#### **Paso 2: Agregar el prompt de actualización**
Después del `<div class="sede-selector">`, agrega:

```html
<div class="update-prompt" id="updatePrompt">
    <h3>🔄 ¿Actualizar datos de la base de datos?</h3>
    <p>Los datos pueden estar desactualizados. ¿Deseas ejecutar una extracción fresca desde la base de datos?</p>
    <div class="update-buttons">
        <button class="btn-update" onclick="actualizarDatos()">✅ Sí, Actualizar</button>
        <button class="btn-skip" onclick="cargarDatosExistentes()">⏭️ No, Usar Datos Existentes</button>
    </div>
</div>
```

#### **Paso 3: Agregar los estilos CSS**
En la sección `<style>`, agrega:

```css
.update-prompt {
    background: #1e3a2e;
    border: 1px solid #4ade80;
    border-radius: 8px;
    padding: 15px;
    margin: 15px 0;
    text-align: center;
    display: none;
}

.update-prompt h3 {
    color: #4ade80;
    margin-bottom: 10px;
    font-size: 16px;
}

.update-prompt p {
    color: #a0a0a0;
    margin-bottom: 15px;
    font-size: 12px;
}

.update-buttons {
    display: flex;
    gap: 10px;
    justify-content: center;
}

.btn-update {
    background: #4ade80;
    color: #1e3a2e;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: bold;
    transition: all 0.3s;
}

.btn-update:hover {
    background: #22c55e;
    transform: translateY(-1px);
}

.btn-skip {
    background: #6b7280;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s;
}

.btn-skip:hover {
    background: #4b5563;
}
```

#### **Paso 4: Modificar la función `seleccionarSede`**
Reemplaza la función existente:

```javascript
function seleccionarSede(sede) {
    sedeSeleccionada = sede;
    const config = sedesConfig[sede];
    
    // Actualizar UI de botones
    document.querySelectorAll('.sede-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('.sede-btn').classList.add('active');
    
    // Mostrar prompt de actualización
    document.getElementById('updatePrompt').style.display = 'block';
}
```

#### **Paso 5: Agregar las nuevas funciones**
Al final del `<script>`, agrega las funciones `actualizarDatos()` y `cargarDatosExistentes()` del archivo integrado.

## 🔍 **VERIFICACIÓN DE LA INTEGRACIÓN**

### **1. Verificar que el servidor esté funcionando:**
```bash
# En el directorio stock_analisis
npm run dev
```

### **2. Verificar que los endpoints estén disponibles:**
```bash
# Probar listado de archivos
curl https://average.lat/api/list-files

# Probar extracción
curl -X POST https://average.lat/api/extract-products \
  -H "Content-Type: application/json" \
  -d "{}"
```

### **3. Probar la herramienta integrada:**
1. Abrir `control.html` en el navegador
2. Seleccionar una sede (Manizales o La Dorada)
3. Verificar que aparezca el prompt de actualización
4. Probar "Sí, Actualizar" - debe ejecutar la extracción
5. Probar "No, Usar Datos Existentes" - debe cargar archivos existentes

## ⚠️ **CONSIDERACIONES IMPORTANTES**

### **1. Servidor Requerido**
- El servidor Next.js debe estar ejecutándose en `https://average.lat`
- Las URLs están configuradas para el dominio de producción

### **2. CORS (Cross-Origin Resource Sharing)**
- Si hay problemas de CORS, asegúrate de que el servidor permita requests desde el dominio donde está `control.html`

### **3. Manejo de Errores**
- La herramienta incluye manejo de errores para conexiones fallidas
- Si el servidor no está disponible, mostrará un error descriptivo

### **4. Performance**
- La actualización puede tomar 10-15 segundos
- Los datos existentes se cargan más rápido

## 🎉 **RESULTADO FINAL**

Después de la integración, la herramienta tendrá:

- ✅ **Conexión directa a bases de datos** en tiempo real
- ✅ **Botón de actualización** que ejecuta nuestra API
- ✅ **Opción de usar datos existentes** para mayor velocidad
- ✅ **Misma funcionalidad** que la herramienta original
- ✅ **Mejor experiencia de usuario** con opciones claras

---

**Estado**: ✅ INTEGRACIÓN COMPLETADA  
**Archivo**: `control_integrado.html`  
**Servidor requerido**: `https://average.lat`
