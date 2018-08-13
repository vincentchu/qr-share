const gulp = require('gulp')
const path = require('path')
const { readFileSync, writeFileSync } = require('fs')
const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')
const { exec } = require('shelljs')
const Mustache = require('mustache')

const webpackConfig = require('./webpack')

const DevServerConf = {
  publicPath: '/',
  filename: 'bundle.js',
  historyApiFallback: true,
  hot: true,
  contentBase: './public',
  stats: {
    cached: false,
    cachedAssets: false,
    colors: { level: 2, hasBasic: true, has256: true, has16m: false },
  },
  disableHostCheck: true,
  proxy: {
    '/config.js': { target: 'http://localhost:9090', secure: false },
  },
}

const resolve = (file) => path.resolve(__dirname, file)

const tmpl = (src, dest, context) => writeFileSync(
  resolve(dest),
  Mustache.render(readFileSync(resolve(src), { encoding: 'utf8' }), context)
)

// React Client Application Related Tasks
gulp.task('client:runServer', () => {
  const server = new WebpackDevServer(
    webpack({ ...webpackConfig, bail: false, mode: 'development' }),
    DevServerConf
  )

  server.listen(8080, 'localhost', (err) => {
    if (!err) {
      console.log('Listening at localhost:8080')
    } else {
      console.error(`webpack-dev-server failed to start: ${err}`)
    }
  })
})

gulp.task('client:buildjs', (cb) => webpack(webpackConfig, cb))

gulp.task('client:copyRoot', () => {
  const version = process.env['SOURCE_VERSION'] || exec('git rev-parse HEAD', { silent: true }).stdout.trim()
  tmpl('public/version.js.mst', 'public/version.js', { version })
  tmpl('public/index.html.mst', 'public/index.html', { version })
})

gulp.task('client:run', ['client:copyRoot', 'client:runServer'])
gulp.task('client:build', ['client:copyRoot', 'client:buildjs'])
gulp.task('default', [ 'client:build' ])
