# 🚀 DESPLIEGUE EN VERCEL - GUÍA COMPLETA

## 🎯 **OBJETIVO**

Desplegar la herramienta de extracción de productos en Vercel con endpoints optimizados para funcionar completamente en el entorno serverless.

## 📋 **ARCHIVOS OPTIMIZADOS PARA VERCEL**

### **1. Script Principal: `scripts/extract_products_vercel.js`**
- ✅ **Timeouts optimizados** (30s para queries, 5s para conexiones)
- ✅ **Pool de conexiones limitado** (máximo 1 conexión por sede)
- ✅ **Límite de productos** (10,000 para evitar timeouts)
- ✅ **Manejo de errores mejorado**
- ✅ **Logging optimizado para Vercel**

### **2. Endpoint API: `pages/api/extract-products.js`**
- ✅ **Usa script optimizado para Vercel**
- ✅ **Timeout de 60 segundos** configurado
- ✅ **Respuestas detalladas** con tiempos de procesamiento

### **3. Configuración: `vercel.json`**
- ✅ **Timeouts específicos** para cada endpoint
- ✅ **Variables de entorno** configuradas
- ✅ **Optimizaciones de build**

## 🔧 **CONFIGURACIÓN DE VERCEL**

### **Variables de Entorno Requeridas**

En el dashboard de Vercel, configurar las siguientes variables:

```bash
DB_HOST=5.161.103.230
DB_PORT=7717
DB_USER=vercel_user
DB_PASSWORD=non@ver@ge
DB_NAME_MANIZALES=crsitaleriamanizales_complete
DB_NAME_LADORADA=cristaleriaprod_complete
```

### **Configuración de Funciones**

El archivo `vercel.json` ya incluye:
- **extract-products**: 60 segundos máximo
- **download-excel**: 30 segundos máximo  
- **list-files**: 10 segundos máximo

## 🚀 **PASOS PARA DESPLEGAR**

### **Paso 1: Preparar el Repositorio**

```bash
# Asegurar que todos los archivos estén commitados
git add .
git commit -m "Optimización para Vercel"
git push origin main
```

### **Paso 2: Conectar con Vercel**

1. **Ir a [vercel.com](https://vercel.com)**
2. **Importar el repositorio de GitHub**
3. **Configurar variables de entorno** en el dashboard
4. **Desplegar automáticamente**

### **Paso 3: Verificar el Despliegue**

```bash
# Probar endpoints localmente (después del despliegue)
npm run test:vercel
```

## 🔍 **ENDPOINTS DISPONIBLES**

### **1. Extracción de Productos**
```
POST https://average.lat/api/extract-products
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Extracción completada exitosamente",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "summary": {
    "totalProducts": 1500,
    "filesGenerated": [
      {
        "sede": "manizales",
        "filename": "productos_manizales_2024-01-15.xlsx",
        "count": 750,
        "processingTime": 25000
      }
    ],
    "totalProcessingTime": 25000
  }
}
```

### **2. Listado de Archivos**
```
GET https://average.lat/api/list-files
```

### **3. Descarga de Archivos**
```
GET https://average.lat/api/download-excel?sede=manizales
GET https://average.lat/api/download-excel?sede=ladorada
```

## 🧪 **PRUEBAS Y VERIFICACIÓN**

### **Script de Prueba Automatizado**

```bash
# Ejecutar pruebas completas
npm run test:vercel
```

### **Pruebas Manuales**

1. **Probar extracción:**
   ```bash
   curl -X POST https://average.lat/api/extract-products \
     -H "Content-Type: application/json" \
     -d "{}"
   ```

2. **Probar listado:**
   ```bash
   curl https://average.lat/api/list-files
   ```

3. **Probar descarga:**
   ```bash
   curl -I https://average.lat/api/download-excel?sede=manizales
   ```

## ⚡ **OPTIMIZACIONES IMPLEMENTADAS**

### **1. Base de Datos**
- ✅ **Pool limitado** (1 conexión por sede)
- ✅ **Timeouts de conexión** (5 segundos)
- ✅ **Timeouts de query** (30 segundos)
- ✅ **Límite de productos** (10,000)

### **2. Archivos**
- ✅ **Directorio temporal** (`/tmp` en Vercel)
- ✅ **Validación de archivos** antes de retornar
- ✅ **Manejo de errores** robusto

### **3. Performance**
- ✅ **Logging optimizado** (solo console.log)
- ✅ **Procesamiento eficiente** de datos
- ✅ **Timeouts configurables** por endpoint

## 🔧 **SOLUCIÓN DE PROBLEMAS**

### **Error: Timeout de Función**
- **Causa**: Query muy lento o muchos productos
- **Solución**: El script ya incluye límites y timeouts

### **Error: Conexión de Base de Datos**
- **Causa**: Credenciales incorrectas o red
- **Solución**: Verificar variables de entorno en Vercel

### **Error: Archivo No Encontrado**
- **Causa**: Archivo no generado o eliminado
- **Solución**: Ejecutar extracción primero

## 📊 **MONITOREO Y LOGS**

### **Logs en Vercel**
- Ir a **Functions** en el dashboard de Vercel
- Seleccionar la función específica
- Ver logs en tiempo real

### **Métricas Importantes**
- **Tiempo de ejecución** (debe ser < 60s)
- **Uso de memoria** (debe ser < 1024MB)
- **Errores de conexión** a base de datos

## 🎉 **RESULTADO FINAL**

Después del despliegue exitoso:

- ✅ **Endpoints funcionando** en `https://average.lat/api/`
- ✅ **Extracción automática** desde bases de datos
- ✅ **Archivos Excel** disponibles para descarga
- ✅ **Integración completa** con `control_integrado.html`
- ✅ **Performance optimizada** para Vercel

---

**Estado**: ✅ LISTO PARA DESPLIEGUE  
**Dominio**: `https://average.lat`  
**Tiempo estimado**: 2-3 minutos para despliegue completo
