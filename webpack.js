const path = require('path')

const resolve = (glob) => path.resolve(__dirname, glob)

module.exports = {
  mode: 'production',
  target: 'web',
  bail: true,
  entry: { main: resolve('./src/index.tsx') },
  output: {
    path: resolve('./public'),
    publicPath: '/',
    filename: 'bundle.js',
    libraryTarget: 'umd',
  },
  devtool: 'source-map',
  resolve: {
    extensions: [ '.ts', '.tsx', '.js', '.json' ]
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'awesome-typescript-loader',
        options: { configFileName: resolve('./tsconfig.json') }
      },
      {
        test: /\.js$/,
        enforce: 'pre',
        loader: 'source-map-loader',
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'postcss-loader']
      },
      {
        test: /\.scss$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' },
          {
            loader: 'postcss-loader',
            options: {
              plugins: () => [ require('precss'), require('autoprefixer') ]
            }
          },
          { loader: 'sass-loader' },
        ]
      },
      {
        test: /\.svg$/,
        loader: 'svg-url-loader',
        options: {
          // Images larger than 5 KB won’t be inlined
          limit: 5 * 1024,
          // Remove quotes around the encoded URL –
          // they’re rarely useful
          noquotes: true,
          outputPath: 'images/',
        }
      },
      {
        test: /\.(woff(2)?|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
        use: [{
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
            outputPath: 'fonts/'
          }
        }]
      },
    ],
  },
}
