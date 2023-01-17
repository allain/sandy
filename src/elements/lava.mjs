import { int } from '../lib/random.mjs'

export const water = {
  name: 'water',
  material: 5,
  processEvent(get, set) {
    const under = get(0, -1, 0)

    if (under === 0) {
      set(0, 0, 0, 0)
      set(0, -1, 0, 5)
      return true
    }

    // if (under === -1) {
    //   if (int(100_000) === 0) {
    //     // turn water into steam
    //     set(0, 0, 0, 3)
    //   }
    //   return
    // }

    const dir = int(4)
    const d = [[-1, 1, 0, 0][dir], 0, [0, 0, -1, 1][dir]]
    const targetVoxel = get(d[0], d[1], d[2])

    if (targetVoxel === 0) {
      set(0, 0, 0, targetVoxel)
      set(...d, 5)
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
