const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require('path');

module.exports = [{
    entry: "./bootstrap.js",
    target: "web",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "bootstrap.js",
    },
    mode: "development",
    plugins: [
      new CopyWebpackPlugin(['index.html'])
    ],
  },
  {
    entry: "./bootstrap.worker.js",
    target: "webworker",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "bootstrap.worker.js",
    },
    mode: "development",
    plugins: [
      new CopyWebpackPlugin(['index.html'])
    ],
  }
];
