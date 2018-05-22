import { SampleClass } from './ISampleClass'
import { app, Inject } from '../App'


export class SampleClass2 {
  private dependency;

  constructor(@Inject(SampleClass) dependency) {
    this.dependency = dependency
  }
  
  getDependency() {
    return this.dependency
  }

  callMe() {
    return 'called'
  }
}