# Typescript Container (IOC)
> Laravel (illuminate/container) inspired/based IoC container.

[![NPM Version][npm-image]][npm-url]
<!--[![Build Status][travis-image]][travis-url] -->
[![Downloads Stats][npm-downloads]][npm-url] 

Nub Inversion of Control container highly based on illuminate/container from Laravel. You can think of it as a port of illuminate/container to typescript, however, there's no guarantee that everything would work as it should. This module was designed for typescript and thus I cannot guarantee compatibility with ES6 alone.

## Installation

```sh
npm i --save typescript-container
```

## Known issues

* Contextual Bindings doesn't work just yet.
* Every other stuffs aside from basic functionality.

## Basic Usage  

You can start by requiring the ioc container then do your thing.

```javascript
const Container = require('typescript-container')
const WithDependencies = require('./src/WithDependencies')
const Dependency = require('./src/Dependency')

const app = Container.getInstance()

app.alias(Dependency, 'dependency')

const withDependencies = app.make(WithDependencies)

withDependencies.doStuff()

/********************************************/
// ./src/WithDependencies
const { Inject } = app

class WithDependencies {
  dep;

  constructor(@Inject('dependency') dep) {
    this.dep = dep
  }

  doStuff() {
    return this.dep.doSomething()
  }
}

/********************************************/
// ./src/Dependency
class Dependency {
  doSomething() {
    return 'hello'
  }
}


```  

injecting dependencies to any other method also works.


## Release History

* 0.0.0-alpha.2
  * basic contextual binding added
* 0.0.0-alpha.1
  * basic functionality

## Meta

Jacob Baring – [@yakovmeister](https://twitter.com/yakovmeister) – so@tfwno.gf

Distributed under the MIT license. See ``LICENSE`` for more information.

[https://github.com/yakovmeister/](https://github.com/yakovmeister/)

## Contributing

1. Fork it (<https://github.com/yakovmeister/typescript-container/fork>)
2. Create your feature branch (`git checkout -b feature/fooBar`)
3. Commit your changes (`git commit -am 'Add some fooBar'`)
4. Push to the branch (`git push origin feature/fooBar`)
5. Create a new Pull Request

<!-- Markdown link & img dfn's -->
[npm-image]: https://img.shields.io/npm/v/typescript-container.svg?style=flat-square
[npm-url]: https://npmjs.org/package/typescript-container
[npm-downloads]: https://img.shields.io/npm/dm/typescript-container.svg?style=flat-square
[travis-image]: https://img.shields.io/travis/dbader/node-datadog-metrics/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/dbader/node-datadog-metrics
[wiki]: https://github.com/yourname/yourproject/wiki