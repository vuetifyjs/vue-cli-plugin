const fs = require('fs')

module.exports = api => {
  api.render('./template')

  api.extendPackage({
    scripts: {
      'serve:storybook': 'start-storybook -p 6006',
      "build:storybook": "build-storybook",
    },
    devDependencies: {
      '@babel/preset-react': '^7.6.3',
      '@mdi/font': '^4.5.95',
      '@storybook/addon-a11y': '^5.2',
      '@storybook/addon-actions': '^5.2',
      '@storybook/addon-knobs': '^5.2',
      '@storybook/addon-notes': '^5.2',
      '@storybook/addon-viewport': '^5.2',
      '@storybook/addons': '^5.2',
      '@storybook/vue': '^5.2',
      'babel-preset-vue': '^2.0.2',
      'prism-react-renderer': '^0.1.7',
      'js-beautify': '^1.11.0',
      'prismjs': '^1.17.1',
      'vue-storybook': '^1.1.0',
    },
  })

  api.onCreateComplete(() => {
    const path = api.resolve('./babel.config.js')
    const config = fs.existsSync(path) ? require(path) : {}

    config.presets = config.presets || []

    // Add presets to config
    for (let preset of ['env', 'react']) {
      preset = `@babel/preset-${preset}`

      if (config.presets.includes(preset)) continue

      config.presets.push(preset)
    }

    fs.writeFileSync(path, api.genJSConfig(config))
  })
}
