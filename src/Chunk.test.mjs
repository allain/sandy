import { expect } from '@esm-bundle/chai'
import { Chunk } from './Chunk.mjs'
import * as random from './lib/random.mjs'
import { sand } from './elements/sand.mjs'

describe('Chunk', () => {
  it('can be created', () => {
    const chunk = new Chunk()
    expect(chunk).to.be.instanceof(Chunk)
  })

  it('can set voxel', () => {
    const chunk = new Chunk()
    chunk.setVoxel(0, 0, 0, 1)
    expect(chunk.getVoxel(0, 0, 0)).to.equal(1)
  })

  const outsideCoords = [
    [-1, 0, 0],
    [0, -1, 0],
    [0, 0, -1],
    [32, 0, 0],
    [0, 32, 0],
    [0, 0, 32]
  ]

  it('returns -1 outside bounds when no context given', () => {
    const chunk = new Chunk()
    for (const coord of outsideCoords) {
      expect(chunk.getVoxel(...coord)).to.equal(-1)
    }
  })

  it('can query outside bounds when context given', () => {
    const chunk = new Chunk({
      get(x, y, z) {
        return 3
      }
    })
    for (const coord of outsideCoords) {
      expect(chunk.getVoxel(...coord)).to.equal(3)
    }
  })

  it('ignores set when outside and no context', () => {
    const chunk = new Chunk({})
    for (const coord of outsideCoords) {
      chunk.setVoxel(...coord, 3)
      expect(chunk.getVoxel(...coord)).to.equal(-1)
    }
  })

  it('supports outside set when context given', () => {
    for (const coord of outsideCoords) {
      let vSet
      const chunk = new Chunk({
        get(x, y, z) {
          expect([x, y, z]).to.deep.equal(coord)
          return vSet
        },
        set(x, y, z, v) {
          expect([x, y, z]).to.deep.equal(coord)
          vSet = v
        }
      })

      const randInt = random.int(10)

      chunk.setVoxel(...coord, randInt)
      expect(chunk.getVoxel(...coord)).to.equal(randInt)
    }
  })

  it('supports performing a tick', () => {
    const chunk = new Chunk({}, [sand])
    chunk.setVoxel(0, 1, 0, 1)
    chunk.tick()
    expect(chunk.getVoxel(0, 1, 0)).to.equal(0, 'should not be in this pos')
    expect(chunk.getVoxel(0, 0, 0)).to.equal(1, 'should be in this pos')
  })

  it('stops falling when reaches world boundary', () => {
    const chunk = new Chunk({}, [sand])
    chunk.setVoxel(0, 0, 0, 1)
    chunk.tick()
    expect(chunk.getVoxel(0, 0, 0)).to.equal(1, 'should still be on floor')
  })
})
