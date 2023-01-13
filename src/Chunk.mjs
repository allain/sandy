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
    return y * this.cellSliceSize + z * this.cellSize + x
  }
  setVoxel(x, y, z, v) {
    const voxelOffset = this.computeVoxelOffset(x, y, z)
    this.cell[voxelOffset] = v
  }
  getVoxel(x, y, z) {
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
              if (!neighbor) {
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
    const cellSliceSize = this.cellSliceSize
    // console.time('tick')

    const swapVoxels = (n1, n2) => {
      const t = this.cell[n1]
      this.cell[n1] = this.cell[n2]
      this.cell[n2] = t
    }

    const delta = (x, y, z) => x + z * cellSize + y * cellSliceSize

    // compass direction paths for sand
    const sand = [
      [delta(-1, 0, 0), delta(-1, -1, 0)],
      [delta(1, 0, 0), delta(-1, -1, 0)],
      [delta(0, 0, -1), delta(0, -1, -1)],
      [delta(0, 0, 1), delta(0, -1, 1)]
    ]

    // compass direction paths for water
    const water = [
      [delta(-1, 0, 0)],
      [delta(1, 0, 0)],
      [delta(0, 0, -1)],
      [delta(0, 0, 1)]
    ]

    for (let y = 0; y < cellSize; ++y) {
      for (let z = 0; z < cellSize; ++z) {
        for (let x = 0; x < cellSize; ++x) {
          const n = this.computeVoxelOffset(x, y, z)
          const voxel = this.cell[n]
          if (!voxel) continue

          if (y === 0) continue

          const under = this.cell[n - cellSliceSize]
          if (under) {
            // sand above water, swap them
            if (voxel === 1 && under !== 1) {
              swapVoxels(n, n - cellSliceSize)
              continue
            }
            let dir = randInt(4)
            // sand behavior
            if (voxel === 1) {
              const path = sand[dir]
              if (
                path.every(
                  (d) =>
                    n + d >= 0 &&
                    n + d < this.cell.length &&
                    this.cell[n + d] !== 1
                )
              ) {
                swapVoxels(n, n + path[path.length - 1])
              }
            } else if (voxel === 2) {
              const path = water[dir]
              if (
                path.every(
                  (d) =>
                    n + d >= 0 &&
                    n + d < this.cell.length &&
                    this.cell[n + d] === 0
                )
              ) {
                swapVoxels(n, n + path[path.length - 1])
              }
            }
          } else {
            this.cell[n] = 0
            this.cell[n - cellSliceSize] = voxel
          }
        }
      }
    }

    // console.timeEnd('tick')
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
