const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const cleanWebpackPlugin = require('clean-webpack-plugin')

const babelRestSpreadPlugin = require('@babel/plugin-proposal-object-rest-spread')
const babelClassPropertiesPlugin = require('@babel/plugin-proposal-class-properties')

module.exports = {
    resolve: {
        alias: {
            'scroll-animation-engine': path.resolve(__dirname, '../')
        }
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [ 'style-loader', 'postcss-loader' ]
            },
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
      new HtmlWebpackPlugin({
          template: 'src/index.html'
      }),
      new cleanWebpackPlugin()
    ],
    devServer: {
        disableHostCheck: true,
        // public: true,
        host: '0.0.0.0'
    }
}

