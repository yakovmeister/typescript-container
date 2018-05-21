import { app } from './App'
import SampleClass3 from './SampleClass3'

const { Inject } = app


export default class SampleClass {
  sc3: any;

  constructor(@Inject(SampleClass3) sc3) {
    this.sc3 = sc3
  }

  getSC3() {
    return this.sc3
  }

  callMe() {
    return 'called'
  }

}
