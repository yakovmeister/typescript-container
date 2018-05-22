import { app, Inject } from './App'
import SampleClass from './SampleClass'

export default class SampleClass2 {
  private sampleClass1: SampleClass;

  constructor(@Inject(SampleClass) sampleClass1) {
    this.sampleClass1 = sampleClass1
  }
  
  
  getClass1() {
    return this.sampleClass1
  }
}
