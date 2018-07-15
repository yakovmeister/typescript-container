import Container from './Container'

export class ContextualBindingBuilder {
  /**
   * The underlying container instance.
   *
   * @var Container
   */
  private container: Container;

  /**
   * The concrete instance.
   *
   * @var string
   */
  private concrete: any;

  /**
   * The abstract target.
   *
   * @var string
   */
  private abstract: any;

  /**
   * Create a new contextual binding builder.
   *
   * @param  Container  container
   * @param  string  concrete
   * @return void
   */
  constructor(container: Container, concrete) {
    this.container = container

    this.concrete = concrete
  }

  /**
   * Define the abstract target that depends on the context.
   *
   * @param  string  abstract
   * @return this
   */
  needs(abstract) {
    this.abstract = abstract

    return this
  }

  /**
   * Define the implementation for the contextual binding.
   *
   * @param  string  implementation
   * @return void
   */
  provide(implementation) {
    this.container.addContextualBinding(
      this.concrete, 
      this.abstract,
      implementation
    )
  }
}
