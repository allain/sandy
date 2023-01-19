export const stone = {
  name: 'stone',
  material: 4,
  color: 0x333333,
  density: 10,
  processEvent(get, set) {
    const under = get(0, -1, 0)
    if (under === -1) {
      return
    }

    if (under < 4) {
      set(0, 0, 0, under)
      set(0, -1, 0, 4)
      return true
    }

    return false
  }
}
