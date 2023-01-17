import { int } from '../lib/random.mjs'

export const steam = {
  name: 'steam',
  material: 3,
  processEvent(get, set) {
    const above = get(0, 1, 0)
    if (above !== 3 && above !== -1) {
      if (int(4) === 0) {
        set(0, 0, 0, above)
        set(0, 1, 0, 3)
      }
      return true
    }

    if (above === -1) {
      if (int(100) === 0) {
        set(0, 0, 0, 2) // water
        return true
      }
      if (int(1000) === 0) {
        set(0, 0, 0, 0, 0)
        return true
      }
    }

    // random compas direction
    if (int(100) === 0) {
      const dir = int(4)
      const d = [[-1, 1, 0, 0][dir], 0, [0, 0, -1, 1][dir]]
      const targetVoxel = get(d[0], d[1], d[2])

      if (targetVoxel === 0) {
        set(0, 0, 0, targetVoxel)
        set(...d, 3)
        return true
      }
    }

    return false
  }
}
