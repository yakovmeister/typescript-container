import { ContextualBindingBuilder } from './ContextualBindingBuilder';
export default class Container {
    /**
     * The current globally available container (if any).
     *
     * @var static
     */
    private static instance;
    /**
     * An array of the types that have been resolved.
     *
     * @var array
     */
    private _resolved;
    /**
     * The container's bindings.
     *
     * @var array
     */
    private bindings;
    /**
     * The container's shared instances.
     *
     * @var array
     */
    private instances;
    /**
     * The registered type aliases.
     *
     * @var array
     */
    private aliases;
    /**
     * The stack of concretions currently being built.
     *
     * @var array
     */
    private buildStack;
    /**
     * The registered aliases keyed by the abstract name.
     *
     * @var array
     */
    private abstractAliases;
    /**
     * The contextual binding map.
     *
     * @var array
     */
    private contextual;
    /**
     * The parameter override stack.
     *
     * @var array
     */
    private with;
    /**
     * Determine if the given concrete is buildable.
     *
     * @param  mixed   concrete
     * @param  string  abstract
     * @return bool
     */
    protected isBuildable(concrete: any, abstract?: any): boolean;
    getDependecies(concrete: any, key: any): any[];
    resolveDependencies(dependencies: Array<any>): any[];
    /**
     * iterate through each methods and inject dependencies via proxy
     * @param instance instantiated class
     * @return fully dependency injected instantiated class
     */
    injectMethodsDependecies(instance: any): any;
    iterateThroughMethods(prototype: any, callback: any): void;
    prepareDependenciesResolution(target: any, key: any): any[];
    injectDependency(method: Function, dependencies?: any[]): Function;
    /**
     * sorts and returns value created by Inject decorator
     * @param args arguments from Inject decorator
     * @return array
     */
    sortAndGetArguments(args: Array<any>): any[];
    getAlias(abstract: string): any;
    /**
     * Define a contextual binding.
     *
     * @param  string  concrete
     * @return ContextualBindingBuilder
     */
    when(abstract: any): ContextualBindingBuilder;
    resolveClass: (parameter: any) => any;
    removeAbstractAlias(searched: any): void;
    instance(abstract: any, instance: any): any;
    build(concrete: any): any;
    /**
     * Resolve the given type from the container.
     *
     * @param  string  abstract
     * @param  array  parameters
     * @return mixed
     */
    resolve(abstract: any, params?: any[]): any;
    /**
     * Get the concrete type for a given abstract.
     *
     * @param  string  abstract
     * @return mixed   concrete
     */
    getConcrete(abstract: any): any;
    getContextualConcrete(abstract: any): any;
    protected findInContextualBindings(abstract: any): any;
    isAlias(alias: any): boolean;
    alias(abstract: any, alias: any): void;
    /**
     * Resolve the given type from the container.
     *
     * @param  string  abstract
     * @param  array  parameters
     * @return mixed
     */
    make(abstract: any, params?: any[]): any;
    singleton(abstract: any, concrete?: any): void;
    attach(abstract: any, concrete?: any, shared?: boolean): void;
    rebound(abstract: any): void;
    bound(abstract: any): boolean;
    isShared(abstract: any): boolean;
    resolved(abstract: any): boolean;
    get(id: any): any;
    /**
     * Register a binding if it hasn't already been registered.
     *
     * @param  string  abstract
     * @param  \Closure|string|null  concrete
     * @param  bool  shared
     * @return void
     */
    attachIf(abstract: any, concrete?: any, shared?: boolean): void;
    dropStaleInstances(abstract: any): void;
    factory(abstract: any): any;
    addContextualBinding(concrete: any, abstract: any, implementation: any): void;
    static getInstance(): Container;
    static setInstance(container: Container): void;
    forgetInstance(abstract: any): void;
    forgetInstances(): void;
    flush(): void;
    notInstantiable(concrete: any): void;
}
/**
 * Allows us to Inject Dependency as parameter in form of decorator.
 * @param abstract dependency to be injected
 * @returns callback
 */
export declare const Inject: (abstract: any) => any;
