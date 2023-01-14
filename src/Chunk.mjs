import * as THREE from 'three'

function randInt(n) {
  return Math.floor(Math.random() * n)
}

// Comes from: https://r105.threejsfundamentals.org/threejs/lessons/threejs-voxel-geometry.html
export class Chunk {
  constructor(options) {
    this.cellSize = options.cellSize
    this.tileSize = options.tileSize
    this.tileTextureWidth = options.tileTextureWidth
    this.tileTextureHeight = options.tileTextureHeight

    this.cellSliceSize = this.cellSize ** 2
    this.cell = new Uint8Array(this.cellSize ** 3)
  }
  computeVoxelOffset(x, y, z) {
    const cellSize = this.cellSize
    if (
      x < 0 ||
      y < 0 ||
      z < 0 ||
      x >= cellSize ||
      y >= cellSize ||
      z >= cellSize
    )
      return -1
    return y * this.cellSliceSize + z * this.cellSize + x
  }
  setVoxel(x, y, z, v) {
    const voxelOffset = this.computeVoxelOffset(x, y, z)
    this.cell[voxelOffset] = v
  }
  getVoxel(x, y, z) {
    const cellSize = this.cellSize
    if (
      x < 0 ||
      y < 0 ||
      z < 0 ||
      x >= cellSize ||
      y >= cellSize ||
      z >= cellSize
    ) {
      return -1
    }
    const voxelOffset = this.computeVoxelOffset(x, y, z)
    return this.cell[voxelOffset]
  }

  generateGeometryDataForCell() {
    const { cellSize, tileSize, tileTextureHeight, tileTextureWidth } = this
    const positions = []
    const normals = []
    const indices = []
    const uvs = []

    for (let y = 0; y < cellSize; ++y) {
      for (let z = 0; z < cellSize; ++z) {
        for (let x = 0; x < cellSize; ++x) {
          const voxel = this.getVoxel(x, y, z)
          if (voxel) {
            const uvVoxel = voxel - 1
            // There is a voxel here but do we need faces for it?
            for (const { dir, corners, uvRow } of Chunk.faces) {
              const neighbor = this.getVoxel(x + dir[0], y + dir[1], z + dir[2])
              if (neighbor < 1) {
                // this voxel has no neighbor in this direction so we need a face.
                const ndx = positions.length / 3
                for (const { pos, uv } of corners) {
                  positions.push(pos[0] + x, pos[1] + y, pos[2] + z)
                  normals.push(...dir)
                  uvs.push(
                    ((uvVoxel + uv[0]) * tileSize) / tileTextureWidth,
                    1 - ((uvRow + 1 - uv[1]) * tileSize) / tileTextureHeight
                  )
                }
                indices.push(ndx, ndx + 1, ndx + 2, ndx + 2, ndx + 1, ndx + 3)
              }
            }
          }
        }
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
    const cellSize = this.cellSize

    // compass direction paths for sand
    const sand = [
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

    // compass direction paths for water
    const water = [[[-1, 0, 0]], [[1, 0, 0]], [[0, 0, -1]], [[0, 0, 1]]]

    for (let y = 0; y < cellSize; ++y) {
      for (let z = 0; z < cellSize; ++z) {
        for (let x = 0; x < cellSize; ++x) {
          const voxel = this.getVoxel(x, y, z)
          if (!voxel || y === 0) continue

          const under = this.getVoxel(x, y - 1, z)
          if (!under || (voxel === 1 && under !== 1)) {
            this.setVoxel(x, y, z, under)
            this.setVoxel(x, y - 1, z, voxel)
            continue
          }

          let dir = randInt(4)
          let path

          if (voxel === 1) {
            // Sand
            path = sand[dir]
          } else if (voxel === 2) {
            // Water
            path = water[dir]
          }

          let deltaIndex
          let d
          let targetVoxel
          let blocked = false
          for (deltaIndex = 0; deltaIndex < path.length; deltaIndex++) {
            d = path[deltaIndex]
            targetVoxel = this.getVoxel(x + d[0], y + d[1], z + d[2])
            if (targetVoxel === 1 || targetVoxel === -1) {
              blocked = true
              break
            }
          }

          if (blocked === false) {
            this.setVoxel(x, y, z, targetVoxel)
            this.setVoxel(x + d[0], y + d[1], z + d[2], voxel)
          }
        }
      }
    }
  }

  buildMesh(texture) {
    const { positions, normals, uvs, indices } =
      this.generateGeometryDataForCell(0, 0, 0)
    const geometry = new THREE.BufferGeometry()
    const material = new THREE.MeshLambertMaterial({
      map: texture,
      side: THREE.DoubleSide,
      alphaTest: 0.1,
      transparent: true
    })

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
}
Chunk.faces = [
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
