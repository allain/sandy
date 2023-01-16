import * as THREE from 'three'

// from fast-random
let seed = _seed(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER))
function _seed(s) {
  if ((seed = (s | 0) % 2147483647) <= 0) {
    seed += 2147483646
  }
  return seed
}

function _nextInt() {
  return (seed = (seed * 48271) % 2147483647)
}

function randInt(n) {
  return _nextInt() % n
}

// Comes from: https://r105.threejsfundamentals.org/threejs/lessons/threejs-voxel-geometry.html
export class Chunk {
  constructor() {
    this.atoms = new Uint8Array(32 ** 3)
  }

  setVoxel(x, y, z, v) {
    // const voxelOffset = y * 32 * 32 + z * 32 + x
    const voxelOffset = (((y << 5) + z) << 5) + x
    this.atoms[voxelOffset] = v
  }

  getVoxel(x, y, z) {
    if (x < 0 || y < 0 || z < 0 || x > 31 || y > 31 || z > 31) {
      return -1
    }
    // const voxelOffset = y * 32 * 32 + z * 32 + x
    const voxelOffset = (((y << 5) + z) << 5) + x
    return this.atoms[voxelOffset]
  }

  buildMesh(material) {
    const { positions, normals, uvs, indices } =
      this.generateGeometryDataForCell(0, 0, 0)
    const geometry = new THREE.BufferGeometry()

    const positionNumComponents = 3
    const normalNumComponents = 3
    const uvNumComponents = 2
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(
        new Float32Array(positions),
        positionNumComponents
      )
    )
    geometry.setAttribute(
      'normal',
      new THREE.BufferAttribute(new Float32Array(normals), normalNumComponents)
    )
    geometry.setAttribute(
      'uv',
      new THREE.BufferAttribute(new Float32Array(uvs), uvNumComponents)
    )
    geometry.setIndex(indices)

    return new THREE.Mesh(geometry, material)
  }

  generateGeometryDataForCell() {
    const positions = []
    const normals = []
    const indices = []
    const uvs = []

    let ndx = 0

    let x, y, z, voxel

    for (let n = 0; n < 32 ** 3; n++) {
      voxel = this.atoms[n]
      if (!voxel) continue
      x = n % 32
      y = n >> 10
      z = (n >> 5) % 32

      if (!voxel) continue

      const material = voxel - 1

      // There is a voxel here but do we need faces for it?
      for (let { dir, corners, uvRow } of faces) {
        const neighbor = this.getVoxel(x + dir[0], y + dir[1], z + dir[2])
        if (neighbor > 0) continue

        // this voxel has no neighbor in this direction so we need this face.
        for (let { pos, uv } of corners) {
          positions.push(pos[0] + x, pos[1] + y, pos[2] + z)
          normals.push(dir[0], dir[1], dir[2])
          uvs.push((material + uv[0]) / 16, 1 - (uvRow + 1 - uv[1]) / 3)
        }
        indices.push(ndx, ndx + 1, ndx + 2, ndx + 2, ndx + 1, ndx + 3)
        ndx += 4
      }
    }

    return {
      positions,
      normals,
      indices,
      uvs
    }
  }

  tick(getOutside, setOutside) {
    let x, y, z
    let voxel
    let under
    let n
    let changed = false

    const size = 32 ** 2

    // if (!firstActive) return

    for (let y = 0; y < 32; y++) {
      let n = 0

      // try to skip empty slices
      // let end = y << (10 + size)
      // let empty = true
      // for (let n = y << 10; n < end; n++) {
      //   if (this.atoms[n]) {
      //     empty = false
      //     break
      //   }
      // }
      // if (empty) continue

      for (let i = 0; i < size; i++) {
        n = randOrder[i] + (y << 10)
        // randInt(size) + (y << 10)
        voxel = this.atoms[n]
        if (!voxel) continue

        x = n % 32
        // y = n >> 10
        z = (n >> 5) % 32

        under = this.getVoxel(x, y - 1, z)
        if (under === -1) {
          under = getOutside(x, -1, z)
          if (under === -1) continue
        }

        if (under === 0 || (voxel === 1 && under !== 1)) {
          // swap atom under if empty or not sand
          // TODO: should be if fillable
          this.setVoxel(x, y, z, under)
          if (y === 0) {
            setOutside(x, -1, z, voxel)
          } else {
            this.setVoxel(x, y - 1, z, voxel)
          }
          changed = true
          continue
        }

        let path = rules[voxel - 1][randInt(4)]

        let deltaIndex
        let d

        let targetVoxel
        let wentOut = false
        for (deltaIndex = 0; deltaIndex < path.length; deltaIndex++) {
          d = path[deltaIndex]
          targetVoxel = this.getVoxel(x + d[0], y + d[1], z + d[2])
          if (targetVoxel === -1) {
            wentOut = true
            targetVoxel = getOutside(x + d[0], y + d[1], z + d[2])
          }

          if (targetVoxel === 1 || targetVoxel === -1) {
            break
          }
        }

        if (deltaIndex === path.length) {
          changed = true

          this.setVoxel(x, y, z, targetVoxel)
          if (wentOut) {
            setOutside(x + d[0], y + d[1], z + d[2], voxel)
          } else {
            this.setVoxel(x + d[0], y + d[1], z + d[2], voxel)
          }
        }
      }
    }

    return changed
  }
}
const randOrder = Array(1024)
  .fill(0)
  .map((_, i) => i)
// .map((n, i, array) => {
//   let j = Math.floor(Math.random() * array.length)
//   array[i] = array[j]
//   array[j] = n
//   return array[i]
// })
shuffleArray(randOrder)

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1))
    const temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }
}

const faces = [
  {
    // left
    uvRow: 0,
    dir: [-1, 0, 0],
    corners: [
      { pos: [0, 1, 0], uv: [0, 1] },
      { pos: [0, 0, 0], uv: [0, 0] },
      { pos: [0, 1, 1], uv: [1, 1] },
      { pos: [0, 0, 1], uv: [1, 0] }
    ]
  },
  {
    // right
    uvRow: 0,
    dir: [1, 0, 0],
    corners: [
      { pos: [1, 1, 1], uv: [0, 1] },
      { pos: [1, 0, 1], uv: [0, 0] },
      { pos: [1, 1, 0], uv: [1, 1] },
      { pos: [1, 0, 0], uv: [1, 0] }
    ]
  },
  {
    // bottom
    uvRow: 1,
    dir: [0, -1, 0],
    corners: [
      { pos: [1, 0, 1], uv: [1, 0] },
      { pos: [0, 0, 1], uv: [0, 0] },
      { pos: [1, 0, 0], uv: [1, 1] },
      { pos: [0, 0, 0], uv: [0, 1] }
    ]
  },
  {
    // top
    uvRow: 2,
    dir: [0, 1, 0],
    corners: [
      { pos: [0, 1, 1], uv: [1, 1] },
      { pos: [1, 1, 1], uv: [0, 1] },
      { pos: [0, 1, 0], uv: [1, 0] },
      { pos: [1, 1, 0], uv: [0, 0] }
    ]
  },
  {
    // back
    uvRow: 0,
    dir: [0, 0, -1],
    corners: [
      { pos: [1, 0, 0], uv: [0, 0] },
      { pos: [0, 0, 0], uv: [1, 0] },
      { pos: [1, 1, 0], uv: [0, 1] },
      { pos: [0, 1, 0], uv: [1, 1] }
    ]
  },
  {
    // front
    uvRow: 0,
    dir: [0, 0, 1],
    corners: [
      { pos: [0, 0, 1], uv: [0, 0] },
      { pos: [1, 0, 1], uv: [1, 0] },
      { pos: [0, 1, 1], uv: [0, 1] },
      { pos: [1, 1, 1], uv: [1, 1] }
    ]
  }
]

const rules = [
  // sand
  [
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
  ],

  // compass direction paths for water
  [[[-1, 0, 0]], [[1, 0, 0]], [[0, 0, -1]], [[0, 0, 1]]]
]
