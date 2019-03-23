const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';

const plugins = [
  new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify(nodeEnv)
    }
  }),
  new HtmlWebpackPlugin({
    title: 'Typescript Webpack Starter',
    template: '!!ejs-loader!src/index.html'
  }),
  new webpack.LoaderOptionsPlugin({
    options: {
      tslint: {
        emitErrors: false,
        failOnHint: false,
      }
    }
  })
];

var config = {
  devtool: isProd ? 'hidden-source-map' : 'source-map',
  context: path.resolve('./src'),
  entry: {
    app: './index.ts'
  },
  output: {
    path: path.resolve('./dist'),
    filename: '[name].bundle.js',
    library: 'l2js',
    libraryTarget: 'var'
  },
  externals:[  
    // "web3"
    // {
    //   "lodash": {
    //         commonjs: "lodash",//如果我们的库运行在Node.js环境中，import _ from 'lodash'等价于const _ = require('lodash')
    //         commonjs2: "lodash",//同上
    //         amd: "lodash",//如果我们的库使用require.js等加载,等价于 define(["lodash"], factory);
    //         root: "_"//如果我们的库在浏览器中使用，需要提供一个全局的变量‘_’，等价于 var _ = (window._) or (_);
    //   }
    // },
    // "@cryptape/cita-sdk",
    // "@babel",
    // "_",
    // /^[a-z\-0-9]+$/,
    // function(context, request, callback) { // ③ function形式
    //   // Every module prefixed with "global-" becomes external
    //   // "global-abc" -> abc
    //   if(/^global-/.test(request))
    //       return callback(null, "var " + request.substr(7));
    //   callback();
    // },
 ],
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.tsx?$/,
        exclude: [/\/node_modules\//],
        use: ['awesome-typescript-loader', 'source-map-loader']
      },
      !isProd
        ? {
            test: /\.(js|ts)$/,
            loader: 'istanbul-instrumenter-loader',
            exclude: [/\/node_modules\//],
            query: {
              esModules: true
            }
          }
        : null,
      { test: /\.html$/, loader: 'html-loader' },
      { test: /\.css$/, loaders: ['style-loader', 'css-loader'] }
    ].filter(Boolean)
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  plugins: plugins,
  devServer: {
    contentBase: path.join(__dirname, 'dist/'),
    compress: true,
    port: 3000,
    hot: true
  },
  node: {
    fs: 'empty',
    child_process: 'empty'
  }
};

module.exports = config;
