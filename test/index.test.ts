import { expect } from 'chai'
import SampleClass from './src/SampleClass'
import SampleClass2 from './src/SampleClass2'
import { app } from './src/App'

describe('prototype', () => {
  it('should define alias', () => {
    app.alias(SampleClass2, 'dummy')

    expect(app.isAlias('dummy')).to.be.true
  })

  it('should be able to call SampleClass', () => {
    let dummy = app.make('dummy')

    expect(dummy.getClass1().callMe()).to.be.eq('called')
  })


  it('should be able to call dependency of dependency', () => {
    let dummy = app.make('dummy')

    expect(dummy.getClass1().getSC3().callMe()).to.be.eq('called')
  })
})
