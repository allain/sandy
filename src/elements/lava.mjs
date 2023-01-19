import { int } from '../lib/random.mjs'

export const lava = {
  name: 'lava',
  material: 6,
  color: 0xff0000,
  density: 3,
  processEvent(get, set) {
    const under = get(0, -1, 0)

    // if empty below, just move into it
    switch (under) {
      case 0:
        set(0, 0, 0, 0)
        set(0, -1, 0, 6)
        return
      case 2:
        set(0, -1, 0, 3) // steam
        return
    }

    // have water stop moving when it touches the ground
    if (under === -1) {
      return
    }

    if (int(25) !== 0) return

    if (int(10_000) === 0) {
      // turn to stone every once in a while
      set(0, 0, 0, 5)
      return
    }

    // pick a cardinal direction
    const dir = [
      [-1, 0, 0],
      [1, 0, 0],
      [0, 0, -1],
      [0, 0, 1]
    ][int(4)]

    const targetVoxel = get(dir[0], dir[1], dir[2])

    switch (targetVoxel) {
      case 0:
        set(0, 0, 0, targetVoxel)
        set(...dir, 6)
        break
      case 2:
        // convert water to steam
        set(...dir, 3)
        if (int(100) === 0) {
          // turn to stone
          set(0, 0, 0, 5)
        }
        break
    }

    return false
  }
}
