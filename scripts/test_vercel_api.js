// Script de prueba para endpoints de Vercel
const API_BASE = 'https://average.lat/api';

async function testVercelEndpoints() {
  console.log('🧪 Probando endpoints de Vercel...\n');

  try {
    // 1. Probar listado de archivos
    console.log('1️⃣ Probando listado de archivos...');
    const listResponse = await fetch(`${API_BASE}/list-files`);
    const listData = await listResponse.json();
    
    if (listResponse.ok) {
      console.log('✅ Listado de archivos:', listData.files.length, 'archivos encontrados');
      listData.files.forEach(file => {
        console.log(`   📄 ${file.filename} (${file.sizeMB}MB) - ${file.sede}`);
      });
    } else {
      console.log('❌ Error en listado:', listData.error);
    }

    console.log('\n2️⃣ Probando extracción de productos...');
    const extractResponse = await fetch(`${API_BASE}/extract-products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const extractData = await extractResponse.json();
    
    if (extractResponse.ok) {
      console.log('✅ Extracción completada:');
      console.log(`   📊 Total productos: ${extractData.summary.totalProducts}`);
      console.log(`   ⏱️  Tiempo total: ${extractData.summary.totalProcessingTime}ms`);
      console.log(`   📁 Archivos generados: ${extractData.summary.filesGenerated.length}`);
      
      extractData.summary.filesGenerated.forEach(file => {
        console.log(`      📄 ${file.filename} - ${file.count} productos (${file.processingTime}ms)`);
      });
      
      if (extractData.summary.errors.length > 0) {
        console.log('   ⚠️  Errores encontrados:');
        extractData.summary.errors.forEach(error => {
          console.log(`      ❌ ${error.sede}: ${error.error}`);
        });
      }
    } else {
      console.log('❌ Error en extracción:', extractData.error);
    }

    // 3. Probar descarga de archivos
    console.log('\n3️⃣ Probando descarga de archivos...');
    
    for (const sede of ['manizales', 'ladorada']) {
      try {
        const downloadResponse = await fetch(`${API_BASE}/download-excel?sede=${sede}`);
        
        if (downloadResponse.ok) {
          const contentLength = downloadResponse.headers.get('content-length');
          console.log(`✅ Descarga ${sede}: ${contentLength} bytes`);
        } else {
          const errorData = await downloadResponse.json();
          console.log(`❌ Error descargando ${sede}:`, errorData.error);
        }
      } catch (error) {
        console.log(`❌ Error de red descargando ${sede}:`, error.message);
      }
    }

    console.log('\n🎉 Pruebas completadas!');

  } catch (error) {
    console.error('❌ Error general en pruebas:', error.message);
  }
}

// Ejecutar pruebas
testVercelEndpoints();
