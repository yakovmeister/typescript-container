import { SampleClass } from './ISampleClass'
import { app } from '../App'

const { Inject } = app

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