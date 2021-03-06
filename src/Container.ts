import { isInstantiable } from './utils/isInstantiable'
import { ContextualBindingBuilder } from './ContextualBindingBuilder'
import { end } from './utils/end'

export default class Container {
  /**
   * The current globally available container (if any).
   *
   * @var static
   */
  protected static instance: Container;

  /**
   * An array of the types that have been resolved.
   *
   * @var array
   */
  protected _resolved: Array<any> = [];

  /**
   * The container's bindings.
   *
   * @var array
   */
  protected bindings: Array<any> = [];

  /**
   * The container's shared instances.
   *
   * @var array
   */
  protected instances: Array<any> = [];

  /**
   * The registered type aliases.
   *
   * @var array
   */
  protected aliases: Array<any> = [];

  /**
   * The stack of concretions currently being built.
   *
   * @var array
   */
  protected buildStack: Array<any> = [];

  /**
   * The registered aliases keyed by the abstract name.
   *
   * @var array
   */
  protected abstractAliases: Array<any> = [];

  /**
   * The contextual binding map.
   *
   * @var array
   */
  protected contextual: Array<any> = [];

  /**
   * The parameter override stack.
   *
   * @var array
   */
  protected with: Array<any> = [];

  /**
   * All of the registered tags.
   *
   * @var array
   */
  protected tags: Array<any> = [];

  /**
   * Determine if the given concrete is buildable.
   *
   * @param  mixed   concrete
   * @param  string  abstract
   * @return bool
   */
  protected isBuildable(concrete, abstract ?: any) {
    return concrete === abstract || typeof concrete === 'function'
  }

  /**
   * Resolve all of the dependencies from the ReflectionParameters.
   *
   * @param  array  $dependencies
   * @return array
   */
  protected resolveDependencies(dependencies: Array<any>) {
    let results = [ ...this.with[this.with.length - 1] ]

    dependencies.forEach((dependency, index) => {
      if (!results[index]) {
        results[index] = dependency
      }
    })

    return results.map(result => {
      if (isInstantiable(result)) {
        return this.resolveClass(result)
      }

      return result
    })
  }

  /**
   * iterate through each methods and inject dependencies via proxy
   * @param instance instantiated class
   * @return fully dependency injected instantiated class
   */
  injectMethodsDependecies(instance) {
    const protos = Object.getPrototypeOf(instance)

    this.iterateThroughMethods(protos, ([key, value]) => {
      if (typeof value !== 'function') {
        return
      }

      const dependencies = this.prepareDependenciesResolution(instance, key)
      
      instance[key] = this.injectDependency(instance[key], dependencies)
    })

    return instance
  }

  iterateThroughMethods(prototype, callback) {
    return Object
      .entries(prototype)
      .forEach(callback)
  }

  prepareDependenciesResolution(target, key) {
    const paramKey = `inject__${key}_params`

    const params = this.sortAndGetArguments(
      target[paramKey]
    )

    return this.resolveDependencies(params)
  }

  injectDependency(method: Function, dependencies = []) {
    return new Proxy(method, {
      apply: (target, args, argsList) => {
        return Reflect.apply(target, args, [...dependencies, ...argsList])
      }
    })
  }

  /**
   * sorts and returns value created by Inject decorator
   * @param args arguments from Inject decorator
   * @return array
   */
  sortAndGetArguments(args: Array<any>) {
    return Array.isArray(args)
      ? args.sort(arg => arg.index)
          .map(element => element.value)
      : []
  }

  /**
   * Get the alias for an abstract if available.
   *
   * @param  string  abstract
   * @return string
   *
   * @throws \Error
   */
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
      throw new Error(`[${parameter}] is not instantiable`)
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
      return this.notInstantiable(concrete)
    }

    this.buildStack.push(concrete)

    let dependencies = this.getDependecies(concrete, 'inject__constructor_params')

    dependencies = this.resolveDependencies(dependencies)

    let newInstance = Reflect.construct(concrete, dependencies)

    newInstance = this.injectMethodsDependecies(newInstance)

    this.buildStack.pop()

    return newInstance
  }

  /**
   * Resolve the given type from the container.
   *
   * @param  string  abstract
   * @param  array  parameters
   * @return mixed
   */
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

  /**
   * Get the concrete type for a given abstract.
   *
   * @param  string  abstract
   * @return mixed   concrete
   */
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
    if (
      this.contextual[end(this.buildStack)] && 
      this.contextual[end(this.buildStack)][abstract]
    ) {
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

  /**
   * Resolve the given type from the container.
   *
   * @param  string  abstract
   * @param  array  parameters
   * @return mixed
   */
  make(abstract, params = []) {
    return this.resolve(abstract, params)
  }

  /**
   * Determine if the given dependency has a parameter override.
   *
   * @param  \ReflectionParameter  $dependency
   * @return bool
   */
  protected hasParamterOverride(dependency) {
    return
  }

  /**
   * Assign a set of tags to a given bindings.
   * @param abstracts 
   * @param tags 
   * @return void
   */
  tag(abstracts, tags) {
    let args : Array<any> = [ ...arguments ]

    tags = Array.isArray(tags) ? tags : args.splice(1)

    tags.forEach(tag => {
      if (!this.tags[tag]) {
        this.tags[tag] = []
      }
      
      this.tags[tag] = [
        ...this.tags[tag],
        ...abstracts
      ]
    })
  }

  /**
   * Resolve all of the bindings for a given tag.
   *
   * @param  string  $tag
   * @return array
   */
  tagged(tag) {
    let results = []

    if (!!this.tags[tag]) {
      this.tags[tag].forEach(abstract => {
        results.push(this.make(abstract))
      })
    }

    return results
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
    return !!this.instances[abstract] || 
      (
        !!this.bindings[abstract] &&
        !!this.bindings[abstract].shared
      )
  }

  resolved(abstract) {
    if (this.isAlias(abstract)) {
      var abstract = this.getAlias(abstract)  
    }

    return !!this._resolved[abstract] || !!this.instances[abstract]
  }

  get(id) {
    if (this.bound(id)) {
      return this.resolve(id)
    }

    throw new Error('Entry not found')
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

  /**
   * Drop all of the stale instances and aliases.
   *
   * @param  string  abstract
   * @return void
   */
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

  /**
   * Set the globally available instance of the container.
   *
   * @return static
   */
  static getInstance() {
    if (!Container.instance) {
      Container.instance = new Container()
    }

    return Container.instance
  }

  /**
   * Set the shared instance of the container.
   *
   * @param  Container container
   * @return Container
   */
  static setInstance(container: Container) {
    Container.instance = container
  }

  /**
   * Remove a resolved instance from the instance cache.
   *
   * @param  string  $abstract
   * @return void
   */
  forgetInstance(abstract) {
    delete this.instances[abstract]
  }

  /**
   * Clear all of the instances from the container.
   *
   * @return void
   */
  forgetInstances() {
    this.instances = []
  }


  flush() {
    this.aliases = []
    this._resolved = []
    this.bindings = []
    this.instances = []
    this.abstractAliases = []
  }

  notInstantiable(concrete) {
    let message = ''

    if (!!this.buildStack) {
      const previous = this.buildStack.join(', ')

      message = `Target [${concrete}] is not instantiable while building [${previous}].`
    } else {
      message = `Target [${concrete}] is not instantiable.`
    }

    throw new Error(message)
  }

  protected getDependecies(concrete, key) {
    return this.sortAndGetArguments(concrete[key])
  }
}

/**
 * Allows us to Inject Dependency as parameter in form of decorator.
 * @param abstract dependency to be injected
 * @returns callback
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
