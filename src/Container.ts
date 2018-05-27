import { isInstantiable } from './utils/isInstantiable'
import { ContextualBindingBuilder } from './ContextualBindingBuilder'
import { end } from './utils/end'

export default class Container {
  /**
   * The current globally available container (if any).
   *
   * @var static
   */
  private static instance: Container;

  /**
   * An array of the types that have been resolved.
   *
   * @var array
   */
  private _resolved: Array<any> = [];

  /**
   * The container's bindings.
   *
   * @var array
   */
  private bindings: Array<any> = [];

  /**
   * The container's shared instances.
   *
   * @var array
   */
  private instances: Array<any> = [];

  /**
   * The registered type aliases.
   *
   * @var array
   */
  private aliases: Array<any> = [];

  /**
   * The stack of concretions currently being built.
   *
   * @var array
   */
  private buildStack: Array<any> = [];

  /**
   * The registered aliases keyed by the abstract name.
   *
   * @var array
   */
  private abstractAliases: Array<any> = [];

  /**
   * The contextual binding map.
   *
   * @var array
   */
  private contextual: Array<any> = [];

  /**
   * The parameter override stack.
   *
   * @var array
   */
  private with: Array<any> = [];

  protected isBuildable(concrete, abstract ?: any) {
    return concrete === abstract || typeof concrete === 'function'
  }

  getDependecies(concrete, key) {
    return this.sortAndGetArguments(concrete[key])
  }

  resolveDependencies(dependencies: Array<any>) {
    return dependencies.map(this.resolveClass)
  }

  /**
   * iterate through each methods and inject dependencies via proxy
   * @param instance instantiated class
   * @returns fully dependency injected instantiated class
   */
  injectMethodsDependecies(instance) {
    const protos = Object.getPrototypeOf(instance)

    Object.entries(protos)
      .forEach(([key, value]) => {
        if (typeof value !== 'function') {
          return
        }

        const paramKey = `inject__${key}_params`

        let params = this.sortAndGetArguments(
          instance[paramKey]
        )

        params = this.resolveDependencies(params)

        instance[key] = new Proxy(instance[key], {
          apply: (target, args, argsList) => {
            return Reflect.apply(target, args, [...params, ...argsList])
          }
        })

        delete instance[paramKey]
      })

      return instance
  }

  /**
   * sorts and returns value created by Inject decorator
   * @param args arguments from Inject decorator
   * @returns array
   */
  sortAndGetArguments(args: Array<any>) {
    return Array.isArray(args)
      ? args.sort(arg => arg.index)
          .map(element => element.value)
      : []
  }

  getAlias(abstract: string) : any {
    if (!this.aliases[abstract]) {
      return abstract
    }

    if (this.aliases[abstract] === abstract) {
      throw new Error(`[${abstract}] is aliased on it's own.`)
    }

    return this.getAlias(this.aliases[abstract])
  }

  /**
   * Define a contextual binding.
   *
   * @param  string  concrete
   * @return ContextualBindingBuilder
   */
  when(abstract) {
    return new ContextualBindingBuilder(this, this.getAlias(abstract))
  }

  resolveClass = (parameter) => {
    if (!isInstantiable(parameter)) {
      throw new Error(`Unable to instantiate [${parameter}]`)
    }

    return this.make(parameter)
  }

  removeAbstractAlias(searched) {
    if (!this.aliases[searched]) {
      return
    }

    this.abstractAliases.forEach((aliases, abstractIndex) => {
      aliases.forEach((alias, index) => {
        if (alias === searched) {
          delete this.abstractAliases[abstractIndex][index]
        }
      })
    })
  }

  instance(abstract, instance) {
    this.removeAbstractAlias(abstract)

    const isBound = this.bound(abstract)

    delete this.aliases[abstract]

    this.instances[abstract] = instance

    if (isBound) {
      this.rebound(abstract)
    }

    return instance
  }

  build(concrete) {
    if (!isInstantiable(concrete)) {
      return
    }

    this.buildStack.push(concrete)

    let dependencies = this.getDependecies(concrete, 'inject__constructor_params')

    dependencies = this.resolveDependencies(dependencies)

    let newInstance = Reflect.construct(concrete, dependencies)

    newInstance = this.injectMethodsDependecies(newInstance)

    this.buildStack.pop()

    return newInstance
  }

  resolve(abstract, params = []) {
    abstract = this.getAlias(abstract)

    const needsContextualBuild = !!params.length || !!this.getContextualConcrete(abstract)

    if (!!this.instances[abstract] && !needsContextualBuild) {
      return this.instances[abstract]
    }

    this.with.push(params)

    const concrete = this.getConcrete(abstract)

    let obj = this.isBuildable(concrete, abstract)
      ? this.build(concrete)
      : this.make(concrete) 

    if (this.isShared(abstract) && !needsContextualBuild) {
      this.instances[abstract] = obj
    }

    this._resolved[abstract] = true

    this.with.pop()

    return obj
  }

  getConcrete(abstract) {
    let concrete = this.getContextualConcrete(abstract)

    if (!!concrete) {
      return concrete
    }

    if (!!this.bindings[abstract]) {
      return this.bindings[abstract]['concrete']
    }

    return abstract
  }

  getContextualConcrete(abstract) {
    let binding = this.findInContextualBindings(abstract)
  
    if (!!binding) {
      return binding
    }

    if (!this.abstractAliases[abstract]) {
      return
    }

    return this.abstractAliases[abstract].forEach(alias => {
      let binding = this.findInContextualBindings(alias)

      if (!!binding) {
        return binding
      }
    })
  }

  protected findInContextualBindings(abstract) {
    if (this.contextual[end(this.buildStack)] 
      && this.contextual[end(this.buildStack)][abstract]) {
      return this.contextual[end(this.buildStack)][abstract]
    }
  }

  isAlias(alias) {
    return !!this.aliases[alias]
  }

  alias(abstract, alias) {
    this.aliases[alias] = abstract

    if (!Array.isArray(this.abstractAliases[abstract])) {
      this.abstractAliases[abstract] = []
    }

    this.abstractAliases[abstract].push(alias)
  }

  make(abstract, params = []) {
    return this.resolve(abstract)
  }

  singleton(abstract, concrete = null) {
    this.attach(abstract, concrete, true)
  }

  attach(abstract, concrete = null, shared = false) {
    this.dropStaleInstances(abstract)

    if (!concrete) {
      concrete = abstract
    }

    this.bindings[abstract] = { concrete, shared }

    if (this.resolved(abstract)) {
      this.rebound(abstract)
    }
  }

  rebound(abstract) {
    this.make(abstract)
  }

  bound(abstract) {
    return !!this.bindings[abstract] ||
           !!this.instances[abstract] ||
           this.isAlias(abstract)
  }

  isShared(abstract) {
    return !!this.instances[abstract] || (
      !!this.bindings[abstract] && !!this.bindings[abstract].shared)
  }

  resolved(abstract) {
    if (this.isAlias(abstract)) {
      var abstract = this.getAlias(abstract)  
    }

    return !!this._resolved[abstract] || !!this.instances[abstract]
  }

  /**
   * Register a binding if it hasn't already been registered.
   *
   * @param  string  abstract
   * @param  \Closure|string|null  concrete
   * @param  bool  shared
   * @return void
   */
  attachIf(abstract, concrete = null, shared = false) {
    if (!this.bound(abstract)) {
      this.attach(abstract, concrete, shared)
    }
  }

  dropStaleInstances(abstract) {
    delete this.instances[abstract]
    delete this.aliases[abstract]
  }

  factory(abstract) {
    return (function(abstract) {
      return this.make(abstract)
    }).bind(this, abstract)
  }

  addContextualBinding(concrete, abstract, implementation) {
    if (!this.contextual[concrete]) {
      this.contextual[concrete] = {}
    }
    
    this.contextual[concrete][this.getAlias(abstract)] = implementation
  }

  static getInstance() {
    if (!Container.instance) {
      Container.instance = new Container()
    }

    return Container.instance
  }

  static setInstance(container: Container) {
    Container.instance = container
  }

  forgetInstance(abstract) {
    delete this.instances[abstract]
  }

  forgetInstances() {
    this.instances= []
  }


  flush() {
    this.aliases = []
    this._resolved = []
    this.bindings = []
    this.instances = []
    this.abstractAliases = []
  }
}

/**
 * Inject dependency.
 * @param service 
 * @returns decorator
 */
export const Inject = (abstract) : any => {
  return (target, name, idx) => {
    const mdKey = `inject__${ name ? name : 'constructor'}_params`

    if (Array.isArray(target[mdKey])) {
      target[mdKey].push({ index: idx, value: abstract })
    } else {
      target[mdKey] = [{ index: idx, value: abstract }]
    }
  }
}
