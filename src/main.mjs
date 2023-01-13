import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import Stats from 'three/addons/libs/stats.module.js'
import { Chunk } from './Chunk.mjs'

function randInt(n) {
  return Math.floor(Math.random() * n)
}

export function main() {
  const renderer = new THREE.WebGLRenderer()

  const stats = new Stats()
  document.body.append(stats.domElement)
  document.body.append(renderer.domElement)
  const cellSize = 64

  const fov = 75
  const aspect = 2 // the canvas default
  const near = 0.1
  const far = 1000
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far)
  camera.position.set(-cellSize * 0.3, cellSize * 0.8, -cellSize * 0.3)
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.target.set(cellSize / 2, cellSize / 3, cellSize / 2)
  controls.update()

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0xcecece)

  function addLight(x, y, z) {
    const color = 0xffffff
    const intensity = 1
    const light = new THREE.DirectionalLight(color, intensity)
    light.position.set(x, y, z)
    scene.add(light)
  }
  addLight(-1, 2, 4)
  addLight(1, -1, -2)

  const loader = new THREE.TextureLoader()
  const texture = loader.load('/tiles.png', render)
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestFilter

  const tileSize = 16
  const tileTextureWidth = 256
  const tileTextureHeight = 64
  const chunk = new Chunk({
    cellSize,
    tileSize,
    tileTextureWidth,
    tileTextureHeight
  })

  let insertX = randInt(cellSize)
  let insertZ = randInt(cellSize)
  chunk.setVoxel(insertX, cellSize - 1, insertZ, 1)
  let needMeshUpdate = true

  let count = 0
  setInterval(() => {
    if (count < 25_000) {
      for (let n = 0; n < 100; n++) {
        count++
        chunk.setVoxel(
          cellSize / 4 + randInt(cellSize / 2),
          cellSize - 1,
          cellSize / 4 + randInt(cellSize / 2),
          Math.random() > 0.5 ? 2 : 1
        )
      }
      // console.log(count)
    }
    chunk.tick()
    needMeshUpdate = true
  }, 1000 / 60)

  const material = new THREE.MeshLambertMaterial({ color: 'green' })

  let mesh
  function updateMeshes() {
    if (!needMeshUpdate) return

    needMeshUpdate = false
    if (mesh) {
      // otherwise this explodes the memory use
      mesh.geometry.dispose()
      mesh.material.dispose()
      scene.remove(mesh)
    }

    const { positions, normals, uvs, indices } =
      chunk.generateGeometryDataForCell(0, 0, 0)
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
    mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)
  }

  function render() {
    requestAnimationFrame(render)
    controls.update()
    updateMeshes()
    renderer.render(scene, camera)
    stats.update()
  }
  render()

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight)
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
  })

  renderer.setSize(window.innerWidth, window.innerHeight)
}
