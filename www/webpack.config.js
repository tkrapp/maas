const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require('path');

module.exports = [{
    entry: "./bootstrap.js",
    target: "web",
    output: {
      path: path.resolve(__dirname, "..", "docs"),
      filename: "bootstrap.js",
    },
    mode: "development",
    plugins: [
      new CopyWebpackPlugin(['index.html']),
      new CopyWebpackPlugin(['maas.css']),
      new CopyWebpackPlugin(['nostradamus.txt']),
      new CopyWebpackPlugin(['shakespeare.txt']),
    ],
  },
  {
    entry: "./bootstrap.worker.js",
    target: "webworker",
    output: {
      path: path.resolve(__dirname, "..", "docs"),
      filename: "bootstrap.worker.js",
    },
    mode: "development",
  },
];
