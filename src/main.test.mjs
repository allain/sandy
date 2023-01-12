import { expect } from '@esm-bundle/chai'

import * as exported from './main.mjs'

describe('main', () => {
  it('exports main function', () => {
    expect(exported.main).to.be.a('function')
  })
})
