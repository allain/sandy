import * as THREE from 'three'
import { shuffle } from './lib/random.mjs'

let logCount = 0
function log9(...msg) {
  if (logCount++ > 8) return
  console.log(...msg)
}

// Comes from: https://r105.threejsfundamentals.org/threejs/lessons/threejs-voxel-geometry.html
export class Chunk {
  constructor(ctx = {}, elements = []) {
    this.atoms = new Uint8Array(32 ** 3)
    this._get = ctx.get || (() => -1)
    this._set = ctx.set || (() => {})
    this._elements = elements
    this._size = 0
  }

  get size() {
    return this._size
  }

  setVoxel(x, y, z, v) {
    // const voxelOffset = y * 32 * 32 + z * 32 + x
    if (x < 0 || y < 0 || z < 0 || x > 31 || y > 31 || z > 31) {
      this._set(x, y, z, v)
      return
    }
    const voxelOffset = (((y << 5) + z) << 5) + x
    this.atoms[voxelOffset] = v
  }

  getVoxel(x, y, z) {
    if (x < 0 || y < 0 || z < 0 || x > 31 || y > 31 || z > 31) {
      return this._get(x, y, z)
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

  tick() {
    let x, y, z
    let voxel
    let n
    let changed = false

    const size = 32 ** 2
    const processors = this._elements.map((e) => e.processEvent.bind(e))

    const get = (dx, dy, dz) => this.getVoxel(dx + x, dy + y, dz + z)
    const set = (dx, dy, dz, v) => this.setVoxel(dx + x, dy + y, dz + z, v)

    let count = 0
    for (y = 0; y < 32; y++) {
      for (let i = 0; i < size; i++) {
        n = order[i] + (y << 10)
        voxel = this.atoms[n]
        if (!voxel) continue

        count++

        x = n % 32
        z = (n >> 5) % 32

        changed = processors[voxel - 1]?.(get, set) || changed
      }
    }

    this._size = count

    return changed
  }
}

const order = shuffle(1024)

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
