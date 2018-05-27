import { app, Inject } from './App'
import SampleClass3 from './SampleClass3'



export default class SampleClass {
  sc3: any;

  changeMe: string;

  constructor(@Inject(SampleClass3) sc3) {
    this.sc3 = sc3
  }

  getSC3() {
    return this.sc3
  }

  callMe() {
    return 'called'
  }

  setChangeMe(value) {
    this.changeMe = value

    return this
  }

  getChangeMe() {
    return this.changeMe
  }

}
