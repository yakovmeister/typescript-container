import { expect } from 'chai'
import SampleClass from './src/SampleClass'
import SampleClass2 from './src/SampleClass2'
import SampleClass4 from './src/SampleClass4'
import { SampleClass2 as SC2 } from './src/AnotherFeat/SampleClass2'
import { SampleClass as ISC } from './src/AnotherFeat/ISampleClass'
import { SampleClass1 as SC1 } from './src/AnotherFeat/SampleClass1'
import { app, App2, Inject } from './src/App'

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

  it('should be able bind context', () => {
    app.when(SC2).needs(ISC).provide(SC1)

    let superClass = app.make(SC2)

    expect(superClass.getDependency().callMe()).to.be.eq('called')
  })

  it('should return an anonymous function that calls Container.prototype.make', () => {
    const sampleClass = app.factory(SampleClass)

    expect(sampleClass().callMe()).to.eq('called')
  })

  it('should create a singleton instance.', () => {
    app.singleton(SampleClass)

    const class1 = app.make(SampleClass)
    class1.setChangeMe('hello')
    const class2 = app.make(SampleClass)

    expect(class1.getChangeMe()).to.eq(class2.getChangeMe())
  })

  it('should store arbitrary values', () => {
    app.instance('sample', 'hello')
    const sample = app.make('sample')

    expect(sample).to.eq('hello')
  })

  it('should allow arbitrary bindings', () => {
    app.instance('sample', SampleClass)
    const sample = app.make('sample')

    expect(sample).to.eq(SampleClass)
  })

  it('should throw an Error (not instantiable)', () => {
    const bindSomething = () => {
      return app.make('idk')
    }

    expect(bindSomething).to.throw().and.to.satisfy(error => 
      !!error.message.match(/^Target \[(.*)\] is not instantiable/)
    )
  })

  it('should require two dependencies', () => {
    const app4 = app.make(SampleClass4)

    expect(app4.getInstance(1)).to.eq(app4.getInstance(2))
  })

  it('should not be aliased to self', () => {
    app.alias(SampleClass, SampleClass)
    const make = () => app.make(SampleClass)

    expect(make).to.throw().and.to.satisfy(error =>
      !!error.message.match(/is aliased on it's own.$/)    
    )
  })

  it('should be taggable', () => {
    app.tag(SC2, 'tagtest')
    app.tag(SC1, 'tagtest')

    expect(app.tagged('tagtest').toString()).to.equal([app.make(SC2),app.make(SC1)].toString())
  })
})
