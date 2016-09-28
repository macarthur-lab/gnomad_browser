/* eslint-disable  */
var path = require('path')
var webpack = require('webpack')

var config = {
  entry: [
    './index',
  ],
  module: {
    loaders: [{
      test: /\.js$/,
      loaders: ['babel-loader'],
      exclude: /node_modules/
    }]
  },
  output: {
    path: __dirname + '/dist',
    publicPath: 'http://localhost:8000/dist/',
    filename: 'bundle.js',
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
