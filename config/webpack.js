module.exports = {
  entry: './app/index.js',
  output: {
    path: './app/generated',
    filename: 'index.js'
  },
  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel-loader'
    }]
  }
}
