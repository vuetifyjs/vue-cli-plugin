require('./overrides.sass')

const preset = {
  theme: {
    themes: {
      light: {
        primary: '#5D1049',
        secondary: '#E30425',
        accent: '#720D5D',
        error: '#F57C00',
      },
    },
  },
}

module.exports = { preset }