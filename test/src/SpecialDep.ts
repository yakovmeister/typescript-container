import { app } from './App'

const { Inject } = app

export default class SpecialDep {
  constructor() { }

  callMe(param ?: string) {
    return `${ param ? param + ' is ' : '' }called`
  }
}
