import { app } from './App'
import SpecialDep from './SpecialDep'

const { Inject } = app

export default class SampleClass3 {
  constructor() { }

  callMe() {
    return 'called'
  }

  callSpecialDep(@Inject(SpecialDep) dep, param: string) {
    return dep.callMe(param)
  }

}
