import Container from './Container';
export declare class ContextualBindingBuilder {
    private container;
    private concrete;
    private abstract;
    constructor(container: Container, concrete: any);
    needs(abstract: any): this;
    provide(implementation: any): void;
}
