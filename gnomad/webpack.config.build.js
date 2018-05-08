/* eslint-disable  */
var path = require('path')
var webpack = require('webpack')

var config = {
  entry: [
    './src/services/index',
  ],
  module: {
    loaders: [{
      test: /\.js$/,
      loaders: ['babel-loader'],
      exclude: /node_modules/
    }]
  },
  output: {
    path: path.resolve(__dirname, '../static'),
    publicPath: '/',
    filename: 'gnomad.js',
    library: 'gnomad'
  },
  resolve: {
    root: path.resolve(__dirname),
    extensions: ['', '.js', '.jsx', '.json'],
    alias: {
      services: 'src/services'
    }
  },
}

module.exports = config
