import Container from './Container'

export class ContextualBindingBuilder {

  private container: Container;

  private concrete: any;

  private abstract: any;

  constructor(container: Container, concrete) {
    this.container = container

    this.concrete = concrete
  }

  needs(abstract) {
    this.abstract = abstract

    return this
  }

  provide(implementation) {
    this.container.addContextualBinding(
      this.concrete, 
      this.abstract,
      implementation
    )
  }
}
