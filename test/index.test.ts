import { expect } from 'chai'
import SampleClass from './src/SampleClass'
import SampleClass2 from './src/SampleClass2'
import { SampleClass2 as SC2 } from './src/AnotherFeat/SampleClass2'
import { SampleClass as ISC } from './src/AnotherFeat/ISampleClass'
import { SampleClass1 as SC1 } from './src/AnotherFeat/SampleClass1'
import { app, App2 } from './src/App'

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

  it('should be able to make unaliased class', () => {
    let class1 = app.make(SampleClass)

    expect(class1.getSC3().callMe()).to.be.eq('called')
  })

  it('should be able to extend Container', () => {
    let app2 = new App2()

    let class1 = app2.make(SampleClass)

    expect(class1.getSC3().callMe()).to.be.eq('called')
  })

  it('should be able to inject dependency', () => {
    let dummy = app.make('dummy')

    expect(dummy.getClass1().getSC3().callSpecialDep()).to.be.eq('called')
  })

  it('should be able to inject dependency 2', () => {
    let dummy = app.make('dummy')
    let param = 'dependency'

    expect(dummy.getClass1().getSC3().callSpecialDep(param)).to.be.eq(`${param} is called`)
  })

  // it('should be able bind context', () => {
  //   app.when(SC2).needs(ISC).provide(SC1)

  //   let superClass = app.make(SC2)

  //   expect(superClass.getDependency().callMe()).to.be.eq('called')
  // })
})
