"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Inject = exports.default = void 0;

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

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
  if (_typeof(Class.prototype) !== 'object') {
    return false;
  }

  return typeof Reflect.get(Class.prototype, 'constructor') === 'function';
};

var ContextualBindingBuilder =
/** @class */
function () {
  function ContextualBindingBuilder(container, concrete) {
    this.container = container;
    this.concrete = concrete;
  }

  ContextualBindingBuilder.prototype.needs = function (abstract) {
    this.abstract = abstract;
    return this;
  };

  ContextualBindingBuilder.prototype.provide = function (implementation) {
    this.container.addContextualBinding(this.concrete, this.abstract, implementation);
  };

  return ContextualBindingBuilder;
}();

var end = function end(array) {
  return array[array.length - 1];
};

var Container =
/** @class */
function () {
  function Container() {
    var _this = this;

    this._resolved = [];
    this.bindings = [];
    this.instances = [];
    this.aliases = [];
    this.buildStack = [];
    this.abstractAliases = [];
    this.contextual = [];
    this["with"] = [];

    this.resolveClass = function (parameter) {
      if (!isInstantiable(parameter)) {
        throw new Error("Unable to instantiate [" + parameter + "]");
      }

      return _this.make(parameter);
    };
  }

  Container.prototype.isBuildable = function (concrete, abstract) {
    return concrete === abstract || typeof concrete === 'function';
  };

  Container.prototype.getDependecies = function (concrete, key) {
    return this.sortAndGetArguments(concrete[key]);
  };

  Container.prototype.resolveDependencies = function (dependencies) {
    return dependencies.map(this.resolveClass);
  };
  /**
   * iterate through each methods and inject dependencies via proxy
   * @param instance instantiated class
   * @returns fully dependency injected instantiated class
   */


  Container.prototype.injectMethodsDependecies = function (instance) {
    var _this = this;

    var protos = Object.getPrototypeOf(instance);
    Object.entries(protos).forEach(function (_a) {
      var key = _a[0],
          value = _a[1];

      if (typeof value !== 'function') {
        return;
      }

      var params = _this.sortAndGetArguments(instance["inject__" + key + "_params"]);

      params = _this.resolveDependencies(params);
      instance[key] = new Proxy(instance[key], {
        apply: function apply(target, args, argsList) {
          return Reflect.apply(target, args, params.concat(argsList));
        }
      });
    });
    return instance;
  };
  /**
   * sorts and returns value created by Inject decorator
   * @param args arguments from Inject decorator
   * @returns array
   */


  Container.prototype.sortAndGetArguments = function (args) {
    return Array.isArray(args) ? args.sort(function (arg) {
      return arg.index;
    }).map(function (element) {
      return element.value;
    }) : [];
  };

  Container.prototype.getAlias = function (abstract) {
    if (!this.aliases[abstract]) {
      return abstract;
    }

    if (this.aliases[abstract] === abstract) {
      throw new Error("[" + abstract + "] is aliased on it's own.");
    }

    return this.getAlias(this.aliases[abstract]);
  };

  Container.prototype.when = function (abstract) {
    return new ContextualBindingBuilder(this, this.getAlias(abstract));
  };

  Container.prototype.removeAbstractAlias = function (searched) {
    var _this = this;

    if (!this.aliases[searched]) {
      return;
    }

    this.abstractAliases.forEach(function (aliases, abstractIndex) {
      aliases.forEach(function (alias, index) {
        if (alias === searched) {
          delete _this.abstractAliases[abstractIndex][index];
        }
      });
    });
  };

  Container.prototype.instance = function (abstract, instance) {
    this.removeAbstractAlias(abstract);
    var isBound = this.bound(abstract);
    delete this.aliases[abstract];
    this.instances[abstract] = instance;

    if (isBound) {
      this.rebound(abstract);
    }

    return instance;
  };

  Container.prototype.build = function (concrete) {
    if (!isInstantiable(concrete)) {
      return;
    }

    this.buildStack.push(concrete);
    var dependencies = this.getDependecies(concrete, 'inject__constructor_params');
    dependencies = this.resolveDependencies(dependencies);
    var newInstance = Reflect.construct(concrete, dependencies);
    newInstance = this.injectMethodsDependecies(newInstance);
    this.buildStack.pop();
    return newInstance;
  };

  Container.prototype.resolve = function (abstract, params) {
    if (params === void 0) {
      params = [];
    }

    abstract = this.getAlias(abstract);
    var needsContextualBuild = !!params.length || !!this.getContextualConcrete(abstract);

    if (!!this.instances[abstract] && !needsContextualBuild) {
      return this.instances[abstract];
    }

    this["with"].push(params);
    var concrete = this.getConcrete(abstract);
    var obj = this.isBuildable(concrete, abstract) ? this.build(concrete) : this.make(concrete);

    if (this.isShared(abstract) && !needsContextualBuild) {
      this.instances[abstract] = obj;
    }

    this._resolved[abstract] = true;
    this["with"].pop();
    return obj;
  };

  Container.prototype.getConcrete = function (abstract) {
    var concrete = this.getContextualConcrete(abstract);

    if (!!concrete) {
      return concrete;
    }

    if (!!this.bindings[abstract]) {
      return this.bindings[abstract]['concrete'];
    }

    return abstract;
  };

  Container.prototype.getContextualConcrete = function (abstract) {
    var _this = this;

    var binding = this.findInContextualBindings(abstract);

    if (!!binding) {
      return binding;
    }

    if (!this.abstractAliases[abstract]) {
      return;
    }

    return this.abstractAliases[abstract].forEach(function (alias) {
      var binding = _this.findInContextualBindings(alias);

      if (!!binding) {
        return binding;
      }
    });
  };

  Container.prototype.findInContextualBindings = function (abstract) {
    if (this.contextual[end(this.buildStack)] && this.contextual[end(this.buildStack)][abstract]) {
      return this.contextual[end(this.buildStack)][abstract];
    }
  };

  Container.prototype.isAlias = function (alias) {
    return !!this.aliases[alias];
  };

  Container.prototype.alias = function (abstract, alias) {
    this.aliases[alias] = abstract;

    if (!Array.isArray(this.abstractAliases[abstract])) {
      this.abstractAliases[abstract] = [];
    }

    this.abstractAliases[abstract].push(alias);
  };

  Container.prototype.make = function (abstract, params) {
    if (params === void 0) {
      params = [];
    }

    return this.resolve(abstract);
  };

  Container.prototype.singleton = function (abstract, concrete) {
    if (concrete === void 0) {
      concrete = null;
    }

    this.attach(abstract, concrete, true);
  };

  Container.prototype.attach = function (abstract, concrete, shared) {
    if (concrete === void 0) {
      concrete = null;
    }

    if (shared === void 0) {
      shared = false;
    }

    this.dropStaleInstances(abstract);

    if (!concrete) {
      concrete = abstract;
    }

    this.bindings[abstract] = {
      concrete: concrete,
      shared: shared
    };

    if (this.resolved(abstract)) {
      this.rebound(abstract);
    }
  };

  Container.prototype.rebound = function (abstract) {
    this.make(abstract);
  };

  Container.prototype.bound = function (abstract) {
    return !!this.bindings[abstract] || !!this.instances[abstract] || this.isAlias(abstract);
  };

  Container.prototype.isShared = function (abstract) {
    return !!this.instances[abstract] || !!this.bindings[abstract] && !!this.bindings[abstract].shared;
  };

  Container.prototype.resolved = function (abstract) {
    if (this.isAlias(abstract)) {
      var abstract = this.getAlias(abstract);
    }

    return !!this._resolved[abstract] || !!this.instances[abstract];
  };

  Container.prototype.dropStaleInstances = function (abstract) {
    this.instances[abstract] = undefined;
    this.aliases[abstract] = undefined;
  };

  Container.prototype.factory = function (abstract) {
    return function (abstract) {
      return this.make(abstract);
    }.bind(this, abstract);
  };

  Container.prototype.addContextualBinding = function (concrete, abstract, implementation) {
    if (!this.contextual[concrete]) {
      this.contextual[concrete] = {};
    }

    this.contextual[concrete][this.getAlias(abstract)] = implementation;
  };

  Container.getInstance = function () {
    if (!Container.instance) {
      Container.instance = new Container();
    }

    return Container.instance;
  };

  Container.setInstance = function (container) {
    Container.instance = container;
  };

  return Container;
}();
/**
 * Inject dependency.
 * @param service
 * @returns decorator
 */


var Inject = function Inject(service) {
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

exports.Inject = Inject;
var _default = Container;
exports.default = _default;