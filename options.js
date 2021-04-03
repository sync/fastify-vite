const { assign } = Object
const { existsSync, readFileSync } = require('fs')
const { resolve } = require('path')
const { resolveConfig } = require('vite')
const vuePlugin = require('@vitejs/plugin-vue')
const vueJsx = require('@vitejs/plugin-vue-jsx')
const reactRefresh = require('@vitejs/plugin-react-refresh')

// Used to determine whether to use Vite's dev server or not
const dev = process.env.NODE_ENV !== 'production'

const defaults = {
  dev,
  // Used to determine the keys to be injected in the application's boot
  // For Vue 3, that means adding them to globalProperties
  hydration: {
    global: '$global',
    data: '$data'
  },
  // Vite root app directory, whatever you set here
  // is also set under `vite.root` so Vite picks it up
  root: process.cwd(),
  // App's entry points for generating client and server builds
  entry: {
    // This differs from Vite's choice for its playground examples,
    // which is having entry-client.js and entry-server.js files on
    // the same top-level folder. For better organization fastify-vite
    // expects them to be grouped under /entry
    client: '/entry/client.js',
    server: '/entry/server.js'
  },
  // Any Vite configuration option set here
  // takes precedence over <root>/vite.config.js
  lib: 'vue',
  vite: {
    vue: {
      // Vite's logging level
      logLevel: dev ? 'error' : 'info',
      // Vite plugins needed for Vue 3 SSR to fully work
      plugins: [
        vuePlugin(),
        vueJsx()
      ],
      // Base build settings, default values
      // for assetsDir and outDir match Vite's defaults
      build: {
        assetsDir: 'assets',
        outDir: 'dist',
        minify: !dev
      }
    },
    react: {
      esbuild: {
        jsxInject: `import React from 'react';`
      },
      plugins: [
        reactRefresh()
      ],
      // Base build settings, default values
      // for assetsDir and outDir match Vite's defaults
      build: {
        assetsDir: 'assets',
        outDir: 'dist',
        minify: !dev
      }
    }
  }
}

function getOptions(options) {
  options = assign({}, defaults, options)
  if (typeof options.root === 'function') {
    options.root = options.root(resolve)
  }
  return options
}

async function patchOptions(options) {
  const viteOptions = await getViteOptions(options)

  options.vite[options.lib].build.assetsDir = viteOptions.build.assetsDir

  if (!options.dev) {
    options.distDir = resolve(options.root, viteOptions.build.outDir)
    const distIndex = resolve(options.distDir, 'client/index.html')
    if (!existsSync(distIndex)) {
      throw new Error('Missing production client/index.html — did you build first?')
    }
    options.distIndex = readFileSync(distIndex, 'utf8')
    options.distManifest = require(resolve(options.distDir, 'client/ssr-manifest.json'))
  } else {
    options.distManifest = []
  }
  return options
}

module.exports = { defaults, getOptions, patchOptions }

function getViteOptions(options) {
  const mergedOptions = { root: options.root, ...defaults.vite, ...options.vite }
  // If vite.config.js is present, resolveConfig() ensures it's taken into consideration
  // Note however that vite options set via fastify-vite take precedence over vite.config.js
  return resolveConfig(mergedOptions, 'build')
}