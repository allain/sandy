import { int } from '../lib/random.mjs'

export const water = {
  name: 'water',
  material: 2,
  processEvent(get, set) {
    const under = get(0, -1, 0)
    if (under === -1) {
      return
    }

    if (under === 0) {
      set(0, 0, 0, 0)
      set(0, -1, 0, 2)
      return true
    }

    const dir = int(4)
    const d = [[-1, 1, 0, 0][dir], 0, [0, 0, -1, 1][dir]]
    const targetVoxel = get(d[0], d[1], d[2])

    if (targetVoxel === 0) {
      set(0, 0, 0, targetVoxel)
      set(...d, 2)
      return true
    }

    return false
  }
}

const paths = [
  [-1, 0, 0],
  [1, 0, 0],
  [0, 0, -1],
  [0, 0, 1]
]
