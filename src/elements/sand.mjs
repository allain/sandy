import { int } from '../lib/random.mjs'

export const sand = {
  name: 'sand',
  material: 1,
  color: 0xb2b09b,
  density: 5,
  processEvent(get, set) {
    const under = get(0, -1, 0)
    if (under === -1) {
      return
    }

    if (under === 0) {
      set(0, 0, 0, under)
      set(0, -1, 0, 1)
      return true
    } else if (under === 2) {
      // This is less dense so move it sideways if possible
      const sidewayDirs = paths.map((p) => p[1])
      const sideways = sidewayDirs.map((d) => get(...d))
      if (sideways.some((d) => d)) {
        let dir
        do {
          dir = int(4)
        } while (!sideways[dir])
        set(...sidewayDirs[dir], 2)
        set(0, -1, 0, 1)
      } else {
        set(0, 0, 0, under)
        set(0, -1, 0, 1)
      }
      return
    }

    let path = paths[int(4)]

    let deltaIndex
    let d

    let targetVoxel
    for (deltaIndex = 0; deltaIndex < path.length; deltaIndex++) {
      d = path[deltaIndex]
      targetVoxel = get(...d)

      // use density here instead of this
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
      set(d[0], d[1], d[2], 1)
    }
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
