module.exports = (api, opts, rootOpts) => {
  const helpers = require('./helpers')(api)

  api.extendPackage({
    dependencies: {
      vuetify: "^1.0.16"
    }
  })

  if (opts.useAlaCarte) {
    api.extendPackage({
      devDependencies: api.hasPlugin('typescript')
        ? {
          "stylus": "^0.54.5",
          "stylus-loader": "^3.0.1",
        }
        : {
          "babel-plugin-transform-imports": "^1.4.1",
          "stylus": "^0.54.5",
          "stylus-loader": "^3.0.1",
        }
    })
  }

  // Render vuetify plugin file
  api.render({
    './src/plugins/vuetify.js': './templates/default/src/plugins/vuetify.js'
  }, Object.assign({
    typescript: api.hasPlugin('typescript')
  }, opts))

  // Render files if we're replacing
  const fs = require('fs')
  const routerPath = api.resolve('./src/router.js')
  opts.router = fs.existsSync(routerPath)

  if (opts.replaceComponents) {
    const files = {
      './src/App.vue': './templates/default/src/App.vue',
      './src/assets/logo.png': './templates/default/src/assets/logo.png'
    }

    if (opts.router) {
      files['./src/views/Home.vue'] = './templates/default/src/views/Home.vue'
    } else {
      api.render('./templates/hw')
    }

    api.render(files, opts)
  }

  // adapted from https://github.com/Akryum/vue-cli-plugin-apollo/blob/master/generator/index.js#L68-L91
  api.onCreateComplete(() => {
    // Modify main.js
    helpers.updateMain(src => {
      const vueImportIndex = src.findIndex(line => line.match(/^import Vue/))

      src.splice(vueImportIndex + 1, 0, 'import \'./plugins/vuetify\'')

      return src
    })

    // Add polyfill
    if (opts.usePolyfill) {
      api.hasPlugin('typescript') || helpers.updateBabelConfig(cfg => {
        if (!cfg.presets) return

        const vuePresetIndex = cfg.presets.findIndex(p => Array.isArray(p) ? p[0] === '@vue/app' : p === '@vue/app')
        const isArray = Array.isArray(cfg.presets[vuePresetIndex])

        if (vuePresetIndex < 0) return

        if (isArray) {
          cfg.presets[vuePresetIndex][1]['useBuiltIns'] = 'entry'
        } else {
          cfg.presets[vuePresetIndex] = [
            '@vue/app',
            {
              useBuiltIns: 'entry'
            }
          ]
        }

        return cfg
      })

      helpers.updateMain(src => {
        if (!src.find(l => l.match(/^(import|require).*@babel\/polyfill.*$/))) {
          src.unshift('import \'@babel/polyfill\'')
        }

        return src
      })
    }

    // If a-la-carte, update babel
    if (opts.useAlaCarte && !api.hasPlugin('typescript')) {
      helpers.updateBabelConfig(cfg => {
        if (cfg.plugins === undefined) {
          cfg.plugins = []
        }

        cfg.plugins.push([
          'transform-imports',
          {
            vuetify: {
              transform: 'vuetify/es5/components/${member}',
              preventFullImport: true
            }
          }
        ])

        return cfg
      })
    }

    // Add Material Icons
    {
      const indexPath = api.resolve('./public/index.html')

      let content = fs.readFileSync(indexPath, { encoding: 'utf8' })

      const lines = content.split(/\r?\n/g).reverse()

      const lastLink = lines.findIndex(line => line.match(/^\s*<link/))
      lines[lastLink] += '\n\t\t<link href="https://fonts.googleapis.com/css?family=Roboto:100:300,400,500,700,900|Material+Icons" rel="stylesheet">'

      content = lines.reverse().join('\n')
      fs.writeFileSync(indexPath, content, { encoding: 'utf8' })
    }
  })
}
