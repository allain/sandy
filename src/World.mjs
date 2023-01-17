import { Chunk } from './Chunk.mjs'
import * as THREE from 'three'
import { euclideanModulo } from 'three/src/math/MathUtils.js'

export class World {
  constructor({ scene, texture, elements }) {
    this._scene = scene
    this._chunkInfos = new Map() // 'x,y' => chunk
    this._chunkMeshes = new Map() // chunk => Mesh
    this._elements = elements
    this.material = new THREE.MeshLambertMaterial({
      map: texture,
      side: THREE.DoubleSide,
      alphaTest: 0.1,
      transparent: true
    })
  }

  getVoxel(x, y, z) {
    // if (x < -64 || x > 64) return -1
    // if (z < -64 || z > 64) return -1
    // if (y < -64 || y > 64) return -1
    const xMod = euclideanModulo(x, 32)
    const yMod = euclideanModulo(y, 32)
    const zMod = euclideanModulo(z, 32)
    const chunkX = x - xMod
    const chunkY = y - yMod
    const chunkZ = z - zMod
    const chunk = this._getChunk(chunkX, chunkY, chunkZ)

    return chunk?.getVoxel(xMod, yMod, zMod) ?? -1
  }

  setVoxel(x, y, z, voxel) {
    const xMod = euclideanModulo(x, 32)
    const yMod = euclideanModulo(y, 32)
    const zMod = euclideanModulo(z, 32)
    const chunkX = x - xMod
    const chunkY = y - yMod
    const chunkZ = z - zMod

    let chunk = this._getChunk(chunkX, chunkY, chunkZ)
    if (!chunk) {
      chunk = this._createChunk(chunkX, chunkY, chunkZ)
    }

    chunk.setVoxel(xMod, yMod, zMod, voxel)
  }

  _getChunk(chunkX, chunkY, chunkZ) {
    const chunkKey = `${chunkX},${chunkY},${chunkZ}`
    let chunkInfo = this._chunkInfos.get(chunkKey)
    return chunkInfo?.chunk
  }

  _createChunk(chunkX, chunkY, chunkZ) {
    const chunkKey = `${chunkX},${chunkY},${chunkZ}`
    const chunk = new Chunk(
      {
        get: (x, y, z) => {
          if (chunkY === 0 && y < 0) {
            return -1
          } else {
            return this.getVoxel(x + chunkX, y + chunkY, z + chunkZ)
          }
        },
        set: (x, y, z, v) => {
          this.setVoxel(x + chunkX, y + chunkY, z + chunkZ, v)
        }
      },
      this._elements
    )

    this._chunkInfos.set(chunkKey, {
      chunkX,
      chunkY,
      chunkZ,
      chunk
    })
    return chunk
  }

  _clearMesh(chunk) {
    const mesh = this._chunkMeshes.get(chunk)
    if (!mesh) return

    this._chunkMeshes.delete(chunk)
    mesh.geometry.dispose()
    this._scene.remove(mesh)
  }

  tick() {
    let size = 0
    for (const chunkInfo of this._chunkInfos.values()) {
      const { chunk } = chunkInfo
      const changed = chunk.tick()
      size += chunk.size
      if (changed) {
        this._clearMesh(chunk)
      }
    }
    this._size = size
  }

  updateScene() {
    const scene = this._scene

    for (const { chunkX, chunkY, chunkZ, chunk } of this._chunkInfos.values()) {
      let mesh = this._chunkMeshes.get(chunk)
      if (!mesh) {
        mesh = chunk.buildMesh(this.material)
        this._chunkMeshes.set(chunk, mesh)
        mesh.position.x = chunkX
        mesh.position.y = chunkY
        mesh.position.z = chunkZ
        scene.add(mesh)
      }
    }
  }
  get size() {
    return this._size
  }
}
