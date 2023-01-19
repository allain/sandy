import { int } from '../lib/random.mjs'

export const water = {
  name: 'water',
  material: 2,
  color: 0x59a5d8,
  density: 2,
  processEvent(get, set) {
    const under = get(0, -1, 0)

    // if empty below, just move into it
    switch (under) {
      case 0:
        set(0, 0, 0, 0)
        set(0, -1, 0, 2)
        return true
      case 6: // lava
        set(0, 0, 0, 3) // steam
        return
    }

    // turn water into steam if above is empty
    if (int(100_000) === 0 && get(0, 1, 0) === 0) {
      set(0, 0, 0, 3)
      return
    }

    // have water stop moving when it touches the ground
    if (under === -1) {
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

    if (targetVoxel === 0) {
      set(0, 0, 0, targetVoxel)
      set(...dir, 2)
      return true
    }

    return false
  }
}
