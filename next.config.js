/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración básica para desarrollo
  reactStrictMode: true,
  swcMinify: true,
  // Deshabilitar optimizaciones experimentales que causan problemas
  experimental: {
    optimizeCss: false
  },
  // Configuración de imágenes si se usan
  images: {
    domains: [],
    unoptimized: false
  },
  // Configuración de headers de seguridad
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig
