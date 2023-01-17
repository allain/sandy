// from fast-random
let seed = 0
if ((seed = (seed | 0) % 2147483647) <= 0) {
  seed += 2147483646
}
// seed = _seed(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER))

// function _seed(s) {
//   if ((seed = (s | 0) % 2147483647) <= 0) {
//     seed += 2147483646
//   }
//   return seed
// }

export function int(n) {
  seed = (seed * 48271) % 2147483647
  return seed % n
}

export function shuffle(n) {
  const shuffle = Array(n)
    .fill(0)
    .map((_, i) => i)
  // .map((n, i, array) => {
  //   let j = Math.floor(Math.random() * array.length)
  //   array[i] = array[j]
  //   array[j] = n
  //   return array[i]
  // })
  shuffleArray(shuffle)

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      let j = int(i + 1)
      const temp = array[i]
      array[i] = array[j]
      array[j] = temp
    }
  }
  return shuffle
}
