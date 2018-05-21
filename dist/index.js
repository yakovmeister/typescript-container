"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
function __decorate(decorators, target, key, desc) {
  var c = arguments.length,
      r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
      d;
  if ((typeof Reflect === "undefined" ? "undefined" : _typeof(Reflect)) === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) {
    if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  }
  return c > 3 && r && Object.defineProperty(target, key, r), r;
}

function __param(paramIndex, decorator) {
  return function (target, key) {
    decorator(target, key, paramIndex);
  };
}

require("core-js/shim");

require("regenerator-runtime/runtime");

if (global._babelPolyfill && typeof console !== "undefined" && console.warn) {
  console.warn("@babel/polyfill is loaded more than once on this page. This is probably not desirable/intended " + "and may have consequences if different versions of the polyfills are applied sequentially. " + "If you do need to load the polyfill more than once, use @babel/polyfill/noConflict " + "instead to bypass the warning.");
}

global._babelPolyfill = true;
/**
 * Check whether the given Object is instantiable.
 * @param Class Object.
 * @returns boolean
 */

var isInstantiable = function isInstantiable(Class) {
  if (_typeof(Class) !== 'object') {
    return false;
  }

  return typeof Reflect.get(Class, 'constructor')() === 'function';
};

var Container =
/** @class */
function () {
  function Container() {
    this.Inject = function (service) {
      return function (target, name, idx) {
        var mdKey = "inject__" + (name ? name : 'constructor') + "_params";

        if (Array.isArray(target[mdKey])) {
          target[mdKey].push({
            index: idx,
            value: service
          });
        } else {
          target[mdKey] = [{
            index: idx,
            value: service
          }];
        }
      };
    };

    this.Injectable = function (Class) {
      return function () {
        var args = [];

        for (var _i = 0; _i < arguments.length; _i++) {
          args[_i] = arguments[_i];
        }

        var key = "inject__constructor_params";
        var arg = Class[key].sort(function (e) {
          return e.index;
        }).map(function (e) {
          return e.value;
        });
        var constructed = Reflect.construct(Class, arg);
        var prototypes = Object.getPrototypeOf(constructed);
        Object.entries(prototypes).map(function (_a) {
          var key = _a[0],
              value = _a[1];

          if (typeof value !== 'function') {
            return;
          }

          var params = constructed["inject__" + key + "_params"].sort(function (e) {
            return e.index;
          }).map(function (e) {
            return e.value;
          });
          constructed[key] = new Proxy(constructed[key], {
            apply: function apply(target, args, argsList) {
              return target.apply(void 0, params.concat(argsList));
            }
          });
          delete constructed["inject__" + key + "_params"];
          console.log('@c', constructed["inject__" + key + "_params"]);
        }).filter(function (c) {
          return c;
        });
        console.log(Object.getPrototypeOf(constructed));
        return constructed;
      };
    };
  }

  Container.prototype.resolve = function (service, params) {
    if (params === void 0) {
      params = [];
    }

    if (!isInstantiable(service)) ;
    var constructed = Reflect.construct(service, []);
    return constructed;
  };

  Container.prototype.make = function (service, params) {
    if (params === void 0) {
      params = [];
    }

    return this.resolve(service, params);
  };

  Container.getInstance = function () {
    return Container.instance ? Container.instance : Container.instance = new Container();
  };

  return Container;
}();

var app = Container.getInstance();
var Injectable = app.Injectable,
    Inject = app.Inject;

var Sample =
/** @class */
function () {
  function Sample(x, y) {
    console.log('@params', x, y);
  }

  Sample.prototype.anotherone = function (x, y, z) {
    console.log(x, y, z);
  };

  Sample.prototype.secondMethod = function (x) {};

  __decorate([__param(0, Inject('fff'))], Sample.prototype, "anotherone");

  __decorate([__param(0, Inject('a'))], Sample.prototype, "secondMethod");

  Sample = __decorate([Injectable, __param(0, Inject('aww')), __param(1, Inject('world'))], Sample);
  return Sample;
}();

var x = app.make(Sample);
x.anotherone('supplied_param1', 'supplied_param2');
console.log(Object.getPrototypeOf(x));
