import { int } from '../lib/random.mjs'

export const ice = {
  name: 'ice',
  material: 5,
  color: 0xffffff,
  density: 5,
  processEvent(get, set) {
    const under = get(0, -1, 0)

    // if empty below, just move into it
    if (under === 0) {
      set(0, 0, 0, 0)
      set(0, -1, 0, 5)
      return true
    }

    if (int(10_000) === 0) {
      // turn ice into water
      set(0, 0, 0, 2)
      return
    }

    // have ice stop moving when it touches the ground
    if (under === -1) {
      return
    }

    if (int(10) !== 0) return

    let path = paths[int(4)]

    let deltaIndex
    let d

    let targetVoxel
    for (deltaIndex = 0; deltaIndex < path.length; deltaIndex++) {
      d = path[deltaIndex]
      targetVoxel = get(...d)

      if (
        targetVoxel === 1 ||
        targetVoxel === -1 ||
        targetVoxel === 4 ||
        targetVoxel === 5
      ) {
        break
      }
    }

    if (deltaIndex === path.length) {
      set(0, 0, 0, targetVoxel)
      set(d[0], d[1], d[2], 5)
      return true
    }

    return false
  }
}

const paths = [
  [
    [-1, 0, 0],
    [-1, -1, 0]
  ],
  [
    [1, 0, 0],
    [1, -1, 0]
  ],
  [
    [0, 0, -1],
    [0, -1, -1]
  ],
  [
    [0, 0, 1],
    [0, -1, 1]
  ]
]
