import { app, Inject } from './App'

export default class SpecialDep {
  constructor() { }

  callMe(param ?: string) {
    return `${ param ? param + ' is ' : '' }called`
  }
}
