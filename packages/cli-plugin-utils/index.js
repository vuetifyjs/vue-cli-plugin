// Utilities
const semver = require('semver')
const fs = require('fs')

function addHtmlLink (api, font) {
  updateFile(api, './public/index.html', lines => {
    const lastLink = lines.reverse().findIndex(line => line.match(/^\s*<\/head>/))
    const link = `<link rel="stylesheet" href="${font}&display=swap">`

    if (lines.join('').indexOf(link) > -1) {
      return lines.reverse()
    }

    lines.splice(lastLink + 1, 0, `    ${link}`)

    return lines.reverse()
  })
}

function addFontLink (api, font) {
  font = !Array.isArray(font) ? [font] : font

  const url = font.map(str => {
    const {
      family = str,
      weights = '100,300,400,500,700,900',
    } = str.split(':')

    return `${family}:${weights}`
  }).join('|')

  return addHtmlLink(api, `https://fonts.googleapis.com/css?family=${url}`)
}

function addSassVariables (api, file) {
  api.chainWebpack(config => {
    const modules = ['vue-modules', 'vue', 'normal-modules', 'normal']

    modules.forEach(match => {
      for (let i = 0; i < 2; i++) {
        const boolean = Boolean(i)
        const rule = boolean ? 'sass' : 'scss'
        const end = boolean ? "'" : "';"

        config.module
          .rule(rule)
          .oneOf(match)
          .use('sass-loader')
          .tap(opt => setSassVariables(opt, `'${file}${end}`))
      }
    })
  })
}

function bootstrapPreset (api, preset) {
  addSassVariables(api, `~vue-cli-plugin-vuetify-preset-${preset}/preset/variables.scss`)
}

function generatePreset (api, preset, onCreateComplete) {
  if (!api.hasPlugin('vuetify')) {
    console.error('Vuetify presets require the `vue-cli-plugin-vuetify` package.')

    return
  }

  const file = 'src/plugins/vuetify.js'
  const plugin = api.resolve(file)

  if (!fs.existsSync(plugin)) {
    console.warn('Unable to locate `vuetify.js` plugin file.')

    return
  }

  api.injectImports(file, `import { preset } from 'vue-cli-plugin-vuetify-preset-${preset}/preset'`)

  api.onCreateComplete(() => {
    updateVuetifyObject(api, 'preset')

    typeof onCreateComplete === 'function' && onCreateComplete()
  })
}

function genSassVariableImport (file) {
  return `@import ${file}`
}

// Check if file exists in user project
function fileExists (api, file) {
  return fs.existsSync(api.resolve(file))
}

// Create an import statement
// to bootstrap a users variables
function setSassVariables (opt, file) {
  const variables = genSassVariableImport(file)

  let sassLoaderVersion
  try {
    sassLoaderVersion = semver.major(require('sass-loader/package.json').version)
  } catch (e) {}

  // Merge with user-defined loader data config
  if (sassLoaderVersion < 8) opt.data = variables
  else opt.prependData = variables

  return opt
}

function updateFile (api, file, callback) {
  file = api.resolve(file)
  let content = fs.existsSync(file)
    ? fs.readFileSync(file, { encoding: 'utf8' })
    : ''

  content = callback(content.split(/\r?\n/g)).join('\n')

  fs.writeFileSync(file, content, { encoding: 'utf8' })
}

function updateVuetifyObject (api, value) {
  updateFile(api, 'src/plugins/vuetify.js', content => {
    const existingValue = str => (
      str.indexOf(`${value},`) > -1 ||
      str.indexOf(`${value}:`) > -1
    )

    // If content already exists, skip update
    if (content.find(existingValue)) {
      return content
    }

    const index = content.findIndex(str => {
      return str.indexOf('new Vuetify(') > -1
    })
    const vuetify = content[index]

    if (!vuetify) {
      console.warn('Unable to locate Vuetify instantiation in `src/plugins/vuetify.js`.')

      return
    }

    const optionsStartIndex = vuetify.indexOf('({')
    const optionsStopIndex = vuetify.indexOf('})')
    const hasMultilineObject = optionsStartIndex > -1
    const hasInlineObject = (
      hasMultilineObject &&
      optionsStopIndex > -1
    )

    // new Vuetify({ ... })
    if (hasInlineObject) {
      const start = vuetify.slice(0, optionsStartIndex + 2)
      const stop = vuetify.slice(optionsStartIndex + 2)

      content[index] = `${start} ${value} ${stop}`
    // new Vuetify({
    //   ...
    // })
    } else if (hasMultilineObject) {
      content.splice(index + 1, 0, `  ${value},`)
    // new Vuetify()
    } else {
      const vuetifyStartIndex = vuetify.indexOf('(')
      const start = vuetify.slice(0, vuetifyStartIndex + 2)

      content[index] = `${start}{ ${value} })`
    }
    // TODO: Handle new Vuetify(options) - user options being passed

    return content
  })
}

module.exports = {
  addHtmlLink,
  addFontLink,
  addSassVariables,
  bootstrapPreset,
  fileExists,
  generatePreset,
  genSassVariableImport,
  setSassVariables,
  updateFile,
  updateVuetifyObject
}
