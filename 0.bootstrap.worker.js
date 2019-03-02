self["webpackChunk"]([0],{

/***/ "./worker.js":
/*!*******************!*\
  !*** ./worker.js ***!
  \*******************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n!(function webpackMissingModule() { var e = new Error(\"Cannot find module 'maas'\"); e.code = 'MODULE_NOT_FOUND'; throw e; }());\n\n\nclass MAASConsoleProxy {\n    log(...args) {\n        self.postMessage({\n            type: 'maas_console',\n            payload: {\n                fn: 'log',\n                args: args,\n            }\n        });\n    }\n}\n\nself.MAASConsole = new MAASConsoleProxy();\n\nself.addEventListener('message', function (evt) {\n    if (evt.data.type === 'generate_markov') {\n        self.postMessage({\n            type: evt.data.type,\n            payload: !(function webpackMissingModule() { var e = new Error(\"Cannot find module 'maas'\"); e.code = 'MODULE_NOT_FOUND'; throw e; }())(evt.data.payload)\n        });\n    } else if (evt.data.type === 'generate_text') {\n        self.postMessage({\n            type: evt.data.type,\n            payload: !(function webpackMissingModule() { var e = new Error(\"Cannot find module 'maas'\"); e.code = 'MODULE_NOT_FOUND'; throw e; }())(evt.data.payload).trim()\n        });\n    } else {\n        self.postMessage(evt.data);\n    }\n});\n\n\n//# sourceURL=webpack:///./worker.js?");

/***/ })

});