'use strict'

const T20 = {
  d20: null,
  api: null,
  utils: null,
  books: [],
  modules: {}
}

console.log('T20 - Bootstraping T20...')

setInterceptor('d20ext', val => {
  console.log('T20 - D20 API ENV SET TO DEVELOPMENT')
  return { ...val, environment: 'development' }
})

setInterceptor('d20', val => {
  console.log('T20 - D20 API FULLY INITIALIZED')
  val.environment = 'production'
  return T20.d20 = val
})

checkTimeout(() => window.$ && T20.d20, bootstrap_t20)

//
// implementations below...
//

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function checkTimeout (checkFunction, callbackFunction, resolve) {
  if (checkFunction()) {
    callbackFunction && callbackFunction()
    return resolve && resolve()
  }
  if (resolve) {
    return setTimeout(() => checkTimeout(checkFunction, callbackFunction, resolve), 10)
  }
  return new Promise(resolve => {
    return setTimeout(() => checkTimeout(checkFunction, callbackFunction, resolve), 10)
  })
}

function setInterceptor (prop, callback) {
  Object.defineProperty(window, prop, {
    enumerable: true,
    configurable: true,
    set: newValue => {
      delete window[prop]
      const intercept = callback && callback(newValue)
      window[prop] = intercept || newValue
    }
  })
}

function bootstrap_t20 () {

  $(window).on('message', ({ originalEvent: { data } }) => {

    if (data.type === 't20-scripts-loaded') {
      setTimeout(() => Object.entries(T20.modules).forEach(([key, module]) => {
        module.onLoad($('body'))
        console.log(`T20 - ${key} loaded...`)
      }), 1000)
    }

    if (data.type === 't20-book-loaded') {
      T20.books[data.book] = data.json
    }

    if (data.type === 'loaded') {
      const characterId = data.characterId
      const iframe = $(`iframe[name="iframe_${characterId}"]`).contents()
      Object.values(T20.modules).forEach(module => module.onSheet(iframe, characterId))
      console.log('T20 - SHEET READY!')
    }
  })
}