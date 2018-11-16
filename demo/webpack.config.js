const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const cleanWebpackPlugin = require('clean-webpack-plugin')

const babelOptions = require('../.babelrc')

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
                    options: babelOptions,
                }
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
          template: 'src/index.html',
          title: 'Scroll Animation Engine Demo'
        }),
        new cleanWebpackPlugin(),
        new webpack.DefinePlugin({
            __PRODUCTION__: JSON.stringify(process.env.NODE_ENV === 'production')
        }),
    ],
    devServer: {
        disableHostCheck: true,
        // public: true,
        host: '0.0.0.0'
    }
}

