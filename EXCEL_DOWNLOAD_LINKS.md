# 📊 LINKS PARA DESCARGAR ARCHIVOS EXCEL

## 🚀 **ENDPOINTS DISPONIBLES**

### **1. Extracción de Productos**
```
POST http://localhost:3000/api/extract-products
```
**Descripción**: Ejecuta la extracción completa y genera los archivos Excel.

### **2. Listar Archivos Disponibles**
```
GET http://localhost:3000/api/list-files
```
**Descripción**: Muestra todos los archivos Excel disponibles con sus links de descarga.

### **3. Descargar Archivo por Sede**
```
GET http://localhost:3000/api/download-excel?sede=ladorada
GET http://localhost:3000/api/download-excel?sede=manizales
```
**Descripción**: Descarga directa del archivo Excel de la sede especificada.

## 📁 **LINKS DIRECTOS DE ARCHIVOS**

### **Archivos Actuales (25/08/2025)**

#### **La Dorada**
- **Archivo**: `productos_ladorada_2025-08-25.xlsx`
- **Tamaño**: 4.9MB
- **Productos**: 5,482
- **Link de descarga**: `http://localhost:3000/api/download-excel?sede=ladorada`
- **Link directo**: `http://localhost:3000/exports/productos_ladorada_2025-08-25.xlsx`

#### **Manizales**
- **Archivo**: `productos_manizales_2025-08-25.xlsx`
- **Tamaño**: 8.2MB
- **Productos**: 10,400
- **Link de descarga**: `http://localhost:3000/api/download-excel?sede=manizales`
- **Link directo**: `http://localhost:3000/exports/productos_manizales_2025-08-25.xlsx`

## 🔧 **INTEGRACIÓN CON HERRAMIENTAS**

### **JavaScript (fetch)**
```javascript
// 1. Ejecutar extracción
const extractResponse = await fetch('http://localhost:3000/api/extract-products', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
});

// 2. Listar archivos disponibles
const listResponse = await fetch('http://localhost:3000/api/list-files');
const files = await listResponse.json();

// 3. Descargar archivo específico
const downloadResponse = await fetch('http://localhost:3000/api/download-excel?sede=ladorada');
const blob = await downloadResponse.blob();
```

### **Python (requests)**
```python
import requests

# 1. Ejecutar extracción
extract_response = requests.post('http://localhost:3000/api/extract-products', 
                               headers={'Content-Type': 'application/json'})

# 2. Listar archivos
list_response = requests.get('http://localhost:3000/api/list-files')
files = list_response.json()

# 3. Descargar archivo
download_response = requests.get('http://localhost:3000/api/download-excel?sede=ladorada')
with open('productos_ladorada.xlsx', 'wb') as f:
    f.write(download_response.content)
```

### **cURL**
```bash
# 1. Ejecutar extracción
curl -X POST http://localhost:3000/api/extract-products \
  -H "Content-Type: application/json" \
  -d "{}"

# 2. Listar archivos
curl http://localhost:3000/api/list-files

# 3. Descargar archivo
curl -O http://localhost:3000/api/download-excel?sede=ladorada
```

## 📋 **FORMATO DE RESPUESTA - LISTAR ARCHIVOS**

```json
{
  "success": true,
  "message": "Archivos disponibles",
  "files": [
    {
      "filename": "productos_ladorada_2025-08-25.xlsx",
      "sede": "ladorada",
      "size": 5143040,
      "sizeMB": "4.90",
      "modified": "2025-08-25T07:45:27.665Z",
      "downloadUrl": "http://localhost:3000/api/download-excel?sede=ladorada",
      "directUrl": "http://localhost:3000/exports/productos_ladorada_2025-08-25.xlsx"
    },
    {
      "filename": "productos_manizales_2025-08-25.xlsx",
      "sede": "manizales",
      "size": 8639738,
      "sizeMB": "8.24",
      "modified": "2025-08-25T07:45:27.665Z",
      "downloadUrl": "http://localhost:3000/api/download-excel?sede=manizales",
      "directUrl": "http://localhost:3000/exports/productos_manizales_2025-08-25.xlsx"
    }
  ],
  "totalFiles": 2,
  "serverInfo": {
    "host": "localhost:3000",
    "timestamp": "2025-08-25T07:45:28.319Z"
  }
}
```

## 🎯 **FLUJO DE TRABAJO RECOMENDADO**

### **1. Ejecutar Extracción**
```bash
curl -X POST http://localhost:3000/api/extract-products \
  -H "Content-Type: application/json" \
  -d "{}"
```

### **2. Verificar Archivos Generados**
```bash
curl http://localhost:3000/api/list-files
```

### **3. Descargar Archivos**
```bash
# La Dorada
curl -O http://localhost:3000/api/download-excel?sede=ladorada

# Manizales
curl -O http://localhost:3000/api/download-excel?sede=manizales
```

## ⚠️ **NOTAS IMPORTANTES**

1. **Servidor**: Asegúrate de que el servidor esté ejecutándose (`npm run dev`)
2. **Puerto**: Los links usan el puerto 3000 por defecto
3. **Fecha**: Los archivos se generan con la fecha actual
4. **Sin Git**: Los archivos ya no se hacen commit automáticamente
5. **Persistencia**: Los archivos se mantienen en la carpeta `exports/`

## 🔍 **VERIFICACIÓN DE ARCHIVOS**

Para verificar que los archivos están disponibles:

```bash
# Listar archivos
curl http://localhost:3000/api/list-files | jq

# Verificar archivo específico
curl -I http://localhost:3000/api/download-excel?sede=ladorada
```

---

**Estado**: ✅ ARCHIVOS DISPONIBLES  
**Servidor**: `http://localhost:3000`  
**Última actualización**: 25/08/2025
