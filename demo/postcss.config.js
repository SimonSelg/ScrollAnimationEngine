module.exports = {
    // parser: 'sugarss',
    plugins: {
        'postcss-preset-env': {
            browsers: ['> 0.5%', 'last 2 versions', 'Firefox ESR', 'not dead', 'iOS > 7']
        },
        'postcss-nesting': {},
    }
}
