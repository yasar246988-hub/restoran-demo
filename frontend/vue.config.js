const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,

  devServer: {
    port: 8080,
    host: 'localhost',
    proxy: {
      '/api': {
        target: process.env.VUE_APP_API_URL
          ? process.env.VUE_APP_API_URL.replace('/api', '')
          : 'http://localhost:3000',
        changeOrigin: true,
        ws: true
      }
    },
    historyApiFallback: true
  },

  productionSourceMap: false,

  css: {
    loaderOptions: {
      sass: {
        // scss variables — only if file exists
      }
    }
  },

  configureWebpack: {
    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all'
          }
        }
      }
    }
  },

  // PWA — Çalışan uygulaması için
  pwa: {
    name: 'Kafe Sipariş',
    short_name: 'Kafe POS',
    themeColor: '#0f2d5c',
    msTileColor: '#0f2d5c',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'black-translucent',
    manifestPath: 'manifest.json',
    manifestOptions: {
      background_color: '#ffffff',
      display: 'standalone',
      scope: '/',
      start_url: '/'
    },
    workboxPluginMode: 'GenerateSW',
    workboxOptions: {
      // Sadece statik dosyaları cache'le — API çağrılarını değil
      skipWaiting: true,
      clientsClaim: true,
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
          options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } }
        },
        {
          urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
          handler: 'CacheFirst',
          options: { cacheName: 'menu-images-cache', expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 } }
        }
      ]
    },
    iconPaths: {
      faviconSVG: null,
      favicon32: 'img/icons/icon-96x96.png',
      favicon16: 'img/icons/icon-72x72.png',
      appleTouchIcon: 'img/icons/icon-192x192.png',
      maskIcon: null,
      msTileImage: 'img/icons/icon-144x144.png'
    }
  }
})
