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
      if (above === -1) {
        // random compass direction

        const dirs = [
          [-1, 0, 0],
          [1, 0, 0],
          [0, 0, -1],
          [0, 0, 1]
        ]

        // if next to steam do nothing
        for (const d of dirs) {
          const nextVoxel = get(d[0], 0, d[2])

          if (nextVoxel === 3) {
            // steam next, do nothing
            return
          }
        }

        // if steam is 2 away, move towards it
        for (const d of dirs) {
          const nextVoxel = get(d[0] * 2, 0, d[2] * 2)

          if (nextVoxel === 3) {
            set(0, 0, 0, nextVoxel)
            set(...d, 3)
            // steam 2 away move towards it
            return
          }
        }
      } else {
        // if not at top, then jiggle
        const d = [
          [-1, 0, 0],
          [1, 0, 0],
          [0, 0, -1],
          [0, 0, 1]
        ][int(4)]
        const nextVoxel = get(d[0], 0, d[2])

        if (nextVoxel === 0) {
          set(0, 0, 0, nextVoxel)
          set(...d, 3)
          return
        }
      }
    }
  }
}
