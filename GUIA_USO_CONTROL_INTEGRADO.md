# 📋 GUÍA DE USO - CONTROL_INTEGRADO.HTML

## 🎯 **DESCRIPCIÓN**

`control_integrado.html` es una herramienta web que permite extraer datos de productos desde bases de datos PostgreSQL (Manizales y La Dorada) y generar análisis de redistribución de inventario en tiempo real.

## 🚀 **CÓMO USAR LA HERRAMIENTA**

### **Paso 1: Acceder a la Herramienta**
1. Abrir `control_integrado.html` en un navegador web moderno
2. Verificar que tienes conexión a internet (necesario para los endpoints de Vercel)

### **Paso 2: Seleccionar Sede**
- **🏪 Manizales**: Base de datos de productos de Manizales
- **🏬 La Dorada**: Base de datos de productos de La Dorada

### **Paso 3: Elegir Opción de Actualización**

#### **✅ Sí, Actualizar (Recomendado)**
- **¿Qué hace?**: Ejecuta una extracción fresca desde la base de datos
- **Tiempo estimado**: 30-60 segundos
- **Ventajas**: Datos completamente actualizados
- **Cuándo usar**: Cuando necesitas información en tiempo real

#### **⏭️ No, Usar Datos Existentes**
- **¿Qué hace?**: Descarga el último archivo Excel generado
- **Tiempo estimado**: 5-15 segundos
- **Ventajas**: Más rápido, menos carga en el servidor
- **Cuándo usar**: Para análisis rápidos o cuando los datos recientes son suficientes

### **Paso 4: Esperar el Procesamiento**
- La herramienta mostrará una barra de progreso
- Los mensajes indicarán el estado actual del proceso
- **No cerrar la pestaña** durante el procesamiento

### **Paso 5: Revisar Resultados**
- **Estadísticas generales**: Total productos, faltantes, eficiencia
- **Rutas de traslado**: Productos que necesitan moverse entre bodegas
- **Productos sin stock**: Productos que requieren ajuste manual

## ⚠️ **LIMITACIONES IMPORTANTES**

### **1. Limitaciones de Tiempo**
- **Extracción completa**: Máximo 60 segundos
- **Descarga de archivos**: Máximo 30 segundos
- **Timeout automático**: Si excede estos límites, se mostrará un error

### **2. Limitaciones de Datos**
- **Máximo productos**: 10,000 por sede (para evitar timeouts)
- **Archivos temporales**: Los archivos se generan en el servidor y pueden ser eliminados
- **Conexión de base de datos**: Limitada a 1 conexión simultánea por sede

### **3. Limitaciones de Red**
- **Requiere internet**: Para acceder a los endpoints de Vercel
- **CORS**: Solo funciona desde dominios autorizados
- **Firewall**: Algunas redes corporativas pueden bloquear las conexiones

### **4. Limitaciones del Navegador**
- **Navegador moderno**: Requiere soporte para ES6+ y Fetch API
- **Memoria**: Procesamiento de archivos grandes puede consumir memoria
- **JavaScript**: Debe estar habilitado

## 🔧 **SOLUCIÓN DE PROBLEMAS**

### **Error: "Timeout: La extracción tardó más de 60 segundos"**
**Causa**: La base de datos está lenta o hay muchos productos
**Solución**:
1. Intentar nuevamente en unos minutos
2. Usar "Datos Existentes" en lugar de "Actualizar"
3. Contactar al administrador si persiste

### **Error: "Error en extracción (500)"**
**Causa**: Problema en el servidor de Vercel
**Solución**:
1. Verificar que el servidor esté funcionando
2. Revisar los logs en el dashboard de Vercel
3. Intentar más tarde

### **Error: "Error descargando archivo (404)"**
**Causa**: El archivo no existe o fue eliminado
**Solución**:
1. Ejecutar "Actualizar" para generar un nuevo archivo
2. Verificar que la sede seleccionada sea correcta

### **Error: "No se encontraron las columnas requeridas"**
**Causa**: El formato del archivo Excel cambió
**Solución**:
1. Contactar al administrador
2. Verificar que el script de extracción esté actualizado

### **La página se congela o no responde**
**Causa**: Procesamiento de archivo muy grande
**Solución**:
1. Esperar más tiempo (hasta 60 segundos)
2. Recargar la página si no responde
3. Usar un navegador más potente

## 📊 **CASOS DE USO TÍPICOS**

### **1. Análisis Diario de Inventario**
1. Seleccionar sede
2. Elegir "Sí, Actualizar"
3. Revisar productos con faltantes
4. Planificar traslados

### **2. Verificación Rápida**
1. Seleccionar sede
2. Elegir "Datos Existentes"
3. Revisar estadísticas generales
4. Identificar problemas urgentes

### **3. Comparación Entre Sedes**
1. Procesar Manizales
2. Anotar estadísticas
3. Procesar La Dorada
4. Comparar resultados

## 🎯 **MEJORES PRÁCTICAS**

### **1. Cuándo Actualizar**
- **Actualizar**: Al inicio del día, antes de tomar decisiones importantes
- **Datos existentes**: Para verificaciones rápidas, durante el día

### **2. Optimización de Tiempo**
- Usar "Datos Existentes" para análisis frecuentes
- Programar actualizaciones completas en horarios de baja actividad
- Mantener la pestaña abierta durante el procesamiento

### **3. Interpretación de Resultados**
- **Eficiencia alta (>80%)**: Sistema funcionando bien
- **Eficiencia media (50-80%)**: Requiere atención
- **Eficiencia baja (<50%)**: Problemas significativos

## 🔒 **CONSIDERACIONES DE SEGURIDAD**

### **1. Datos Sensibles**
- Los archivos Excel contienen información de productos
- No compartir archivos descargados
- Usar en redes seguras

### **2. Acceso**
- La herramienta está conectada a bases de datos de producción
- Usar solo desde dispositivos autorizados
- Cerrar sesión cuando no se use

### **3. Backup**
- Los archivos se generan automáticamente
- No es necesario guardar archivos localmente
- Los datos se pueden regenerar en cualquier momento

## 📞 **SOPORTE TÉCNICO**

### **Problemas Comunes**
1. **Timeout**: Esperar y reintentar
2. **Error de red**: Verificar conexión a internet
3. **Archivo no encontrado**: Ejecutar actualización

### **Contacto**
- Para problemas técnicos: Revisar logs de Vercel
- Para cambios en la herramienta: Contactar al equipo de desarrollo
- Para acceso a bases de datos: Contactar al administrador de sistemas

## 🎉 **RESULTADO ESPERADO**

Después de un uso exitoso, deberías ver:
- ✅ Estadísticas completas de productos
- ✅ Lista de traslados recomendados
- ✅ Productos que requieren atención
- ✅ Métricas de eficiencia del inventario

---

**📅 Última actualización**: 25 de Agosto, 2025  
**🔄 Versión**: 2.0 (Optimizada para Vercel)  
**👥 Desarrollado por**: Equipo de Desarrollo Average
