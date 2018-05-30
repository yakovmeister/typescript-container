"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Inject = exports.default = void 0;

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

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
    /**
     * An array of the types that have been resolved.
     *
     * @var array
     */


    this._resolved = [];
    /**
     * The container's bindings.
     *
     * @var array
     */

    this.bindings = [];
    /**
     * The container's shared instances.
     *
     * @var array
     */

    this.instances = [];
    /**
     * The registered type aliases.
     *
     * @var array
     */

    this.aliases = [];
    /**
     * The stack of concretions currently being built.
     *
     * @var array
     */

    this.buildStack = [];
    /**
     * The registered aliases keyed by the abstract name.
     *
     * @var array
     */

    this.abstractAliases = [];
    /**
     * The contextual binding map.
     *
     * @var array
     */

    this.contextual = [];
    /**
     * The parameter override stack.
     *
     * @var array
     */

    this["with"] = [];

    this.resolveClass = function (parameter) {
      if (!isInstantiable(parameter)) {
        throw new Error("[" + parameter + "] is not instantiable");
      }

      return _this.make(parameter);
    };
  }
  /**
   * Determine if the given concrete is buildable.
   *
   * @param  mixed   concrete
   * @param  string  abstract
   * @return bool
   */


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
   * @return fully dependency injected instantiated class
   */


  Container.prototype.injectMethodsDependecies = function (instance) {
    var _this = this;

    var protos = Object.getPrototypeOf(instance);
    this.iterateThroughMethods(protos, function (_a) {
      var key = _a[0],
          value = _a[1];

      if (typeof value !== 'function') {
        return;
      }

      var dependencies = _this.prepareDependenciesResolution(instance, key);

      instance[key] = _this.injectDependency(instance[key], dependencies);
    });
    return instance;
  };

  Container.prototype.iterateThroughMethods = function (prototype, callback) {
    return Object.entries(prototype).forEach(callback);
  };

  Container.prototype.prepareDependenciesResolution = function (target, key) {
    var paramKey = "inject__" + key + "_params";
    var params = this.sortAndGetArguments(target[paramKey]);
    return this.resolveDependencies(params);
  };

  Container.prototype.injectDependency = function (method, dependencies) {
    if (dependencies === void 0) {
      dependencies = [];
    }

    return new Proxy(method, {
      apply: function apply(target, args, argsList) {
        return Reflect.apply(target, args, dependencies.concat(argsList));
      }
    });
  };
  /**
   * sorts and returns value created by Inject decorator
   * @param args arguments from Inject decorator
   * @return array
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
  /**
   * Define a contextual binding.
   *
   * @param  string  concrete
   * @return ContextualBindingBuilder
   */


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
      return this.notInstantiable(concrete);
    }

    this.buildStack.push(concrete);
    var dependencies = this.getDependecies(concrete, 'inject__constructor_params');
    dependencies = this.resolveDependencies(dependencies);
    var newInstance = Reflect.construct(concrete, dependencies);
    newInstance = this.injectMethodsDependecies(newInstance);
    this.buildStack.pop();
    return newInstance;
  };
  /**
   * Resolve the given type from the container.
   *
   * @param  string  abstract
   * @param  array  parameters
   * @return mixed
   */


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
  /**
   * Get the concrete type for a given abstract.
   *
   * @param  string  abstract
   * @return mixed   concrete
   */


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
  /**
   * Resolve the given type from the container.
   *
   * @param  string  abstract
   * @param  array  parameters
   * @return mixed
   */


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

  Container.prototype.get = function (id) {
    if (this.bound(id)) {
      return this.resolve(id);
    }

    throw new Error('Entry not found');
  };
  /**
   * Register a binding if it hasn't already been registered.
   *
   * @param  string  abstract
   * @param  \Closure|string|null  concrete
   * @param  bool  shared
   * @return void
   */


  Container.prototype.attachIf = function (abstract, concrete, shared) {
    if (concrete === void 0) {
      concrete = null;
    }

    if (shared === void 0) {
      shared = false;
    }

    if (!this.bound(abstract)) {
      this.attach(abstract, concrete, shared);
    }
  };

  Container.prototype.dropStaleInstances = function (abstract) {
    delete this.instances[abstract];
    delete this.aliases[abstract];
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

  Container.prototype.forgetInstance = function (abstract) {
    delete this.instances[abstract];
  };

  Container.prototype.forgetInstances = function () {
    this.instances = [];
  };

  Container.prototype.flush = function () {
    this.aliases = [];
    this._resolved = [];
    this.bindings = [];
    this.instances = [];
    this.abstractAliases = [];
  };

  Container.prototype.notInstantiable = function (concrete) {
    var message = '';

    if (!!this.buildStack) {
      var previous = this.buildStack.join(', ');
      message = "Target [" + concrete + "] is not instantiable while building [" + previous + "].";
    } else {
      message = "Target [" + concrete + "] is not instantiable.";
    }

    throw new Error(message);
  };

  return Container;
}();
/**
 * Allows us to Inject Dependency as parameter in form of decorator.
 * @param abstract dependency to be injected
 * @returns callback
 */


var Inject = function Inject(abstract) {
  return function (target, name, idx) {
    var mdKey = "inject__" + (name ? name : 'constructor') + "_params";

    if (Array.isArray(target[mdKey])) {
      target[mdKey].push({
        index: idx,
        value: abstract
      });
    } else {
      target[mdKey] = [{
        index: idx,
        value: abstract
      }];
    }
  };
};

exports.Inject = Inject;
var _default = Container;
exports.default = _default;
