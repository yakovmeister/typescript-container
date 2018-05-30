import { app, Inject } from './App'
import SampleClass from './SampleClass'

export default class SampleClass4 {
  private instance1: SampleClass;

  private instance2: SampleClass;

  constructor(@Inject(SampleClass) instance1, @Inject(SampleClass) instance2) {
    this.instance1 = instance1
    this.instance2 = instance2
  }

  getInstance(num) {
    return this[`instance${num}`]
  }
}
