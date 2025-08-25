// Usar fetch nativo (disponible en Node.js 18+)

// URL del endpoint (ajustar según el puerto de desarrollo)
const API_URL = 'http://localhost:3000/api/extract-products';

async function testAPI() {
  console.log('🧪 PROBANDO ENDPOINT API');
  console.log('========================\n');
  
  try {
    console.log(`📡 Enviando POST a: ${API_URL}`);
    console.log('⏳ Esperando respuesta...\n');
    
    const startTime = Date.now();
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log(`📊 Respuesta recibida en ${duration.toFixed(2)} segundos`);
    console.log(`📋 Status: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    
    console.log('\n📄 RESPUESTA JSON:');
    console.log('==================');
    console.log(JSON.stringify(data, null, 2));
    
    // Análisis de la respuesta
    console.log('\n📈 ANÁLISIS DE RESPUESTA:');
    console.log('==========================');
    
    if (data.success) {
      console.log(`✅ Estado: ${data.success ? 'Éxito' : 'Error'}`);
      console.log(`📝 Mensaje: ${data.message}`);
      console.log(`⏰ Timestamp: ${data.timestamp}`);
      
      if (data.summary) {
        console.log(`📊 Total productos: ${data.summary.totalProducts}`);
        console.log(`📁 Archivos generados: ${data.summary.filesGenerated.length}`);
        console.log(`❌ Errores: ${data.summary.errors.length}`);
        
        if (data.summary.filesGenerated.length > 0) {
          console.log('\n📋 Archivos generados:');
          data.summary.filesGenerated.forEach(file => {
            console.log(`   - ${file.sede}: ${file.filename} (${file.count} productos)`);
          });
        }
        
        if (data.summary.errors.length > 0) {
          console.log('\n❌ Errores encontrados:');
          data.summary.errors.forEach(error => {
            console.log(`   - ${error.sede}: ${error.error}`);
          });
        }
      }
    } else {
      console.log(`❌ Error: ${data.error}`);
      console.log(`📝 Mensaje: ${data.message}`);
    }
    
    console.log('\n🎯 Prueba completada.');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 SUGERENCIA: Asegúrate de que el servidor esté ejecutándose:');
      console.log('   npm run dev');
    }
  }
}

// Ejecutar prueba si se llama directamente
if (require.main === module) {
  testAPI();
}

module.exports = { testAPI };
