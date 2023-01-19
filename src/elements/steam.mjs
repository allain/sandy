import { int } from '../lib/random.mjs'

export const steam = {
  name: 'steam',
  material: 3,
  color: 0xccccff,
  density: 1,
  processEvent(get, set) {
    const above = get(0, 1, 0)
    if (above !== 3 && above !== -1) {
      if (int(4) === 0) {
        set(0, 0, 0, above)
        set(0, 1, 0, 3)
      }
      return
    }

    if (above === -1) {
      if (int(100) === 0) {
        set(0, 0, 0, 2) // water
        return
      }

      if (int(1000) === 0) {
        set(0, 0, 0, 0, 0)
        return
      }
    }

    // every 10th tick move a little bit
    if (int(10) === 0) {
      // random compass direction
      const dir = [
        [-1, 0, 0],
        [1, 0, 0],
        [0, 0, -1],
        [0, 0, 1]
      ][int(4)]
      const targetVoxel = get(dir[0], dir[1], dir[2])

      if (targetVoxel === 0) {
        set(0, 0, 0, targetVoxel)
        set(...dir, 3)
        return
      }
    }
  }
}
