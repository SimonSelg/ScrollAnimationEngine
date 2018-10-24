const cleanWebpackPlugin = require('clean-webpack-plugin')
const babelRestSpreadPlugin = require('@babel/plugin-proposal-object-rest-spread')
const babelClassPropertiesPlugin = require('@babel/plugin-proposal-class-properties')

const libraryName = 'scroll-animation-engine'

module.exports = {
    //entry: 'src/index.js',
    output: {
        path: __dirname + '/lib',
        filename: libraryName + '.js',
        library: libraryName,
        libraryTarget: 'umd',
        umdNamedDefine: true
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                        plugins: [babelRestSpreadPlugin, babelClassPropertiesPlugin]
                    }
                }
            }
        ]
    },
    plugins: [
        new cleanWebpackPlugin()
    ]
}