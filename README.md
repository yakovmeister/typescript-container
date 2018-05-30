# Typescript Container (IOC)
> An attempt to bring illuminate/container familiarity into typescript.

[![Build Status][travis-image]][travis-url]
[![NPM Version][npm-image]][npm-url]
[![Downloads Stats][npm-downloads]][npm-url] 

This is a small attempt to bring/port Laravel's IoC container ([illuminate/container](https://github.com/illuminate/container)) to typescript with the help of decorators.

## Installation

```sh
npm i --save typescript-container
```

## Known issues / Not working

* Primitive types as dependency
* tagging
* overriding constructor parameters
* callback supports

## Basic Usage  

You can start by requiring the ioc container then do your thing.

src/index.ts:
![index](./images/index.png)
src/Pokemon.ts:
![pokemon](./images/pokemon.png)
src/Character.ts:
![character](./images/character.png)
src/Map.ts:
![map](./images/map.png)
src/Monster.ts:
![monster](./images/monster.png)

injecting dependencies to any other method (other than constructor) also works.


## Release History
* 0.0.7
  * arbitrary binding support
  * arbitrary value store support
  * flush() added
  * declaration file (d.ts) added
* 0.0.3
  * added factory() and singleton()
  * basic contextual binding added
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
[travis-image]: https://travis-ci.org/yakovmeister/typescript-container.svg?branch=dev
[travis-url]: https://travis-ci.org/yakovmeister/typescript-container
[wiki]: https://github.com/yourname/yourproject/wiki