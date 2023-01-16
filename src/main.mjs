import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import Stats from 'three/addons/libs/stats.module.js'
import { World } from './World.mjs'

function randInt(n) {
  return Math.floor(Math.random() * n)
}

export function main() {
  const renderer = new THREE.WebGLRenderer()

  const stats = new Stats()

  stats.domElement.style.cssText =
    'position:fixed;top:0;right:0;cursor:pointer;opacity:0.9;z-index:10000'
  document.body.append(stats.domElement)

  document.body.append(renderer.domElement)
  const fov = 75
  const aspect = 2 // the canvas default
  const near = 0.1
  const far = 1000
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far)
  camera.position.set(0, 10, 64)
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.mouseButtons = {
    RIGHT: THREE.MOUSE.ROTATE
  }
  controls.damping = true
  controls.target.set(0, 0, 0)
  controls.maxPolarAngle = Math.PI / 3
  controls.minPolarAngle = Math.PI / 3
  controls.update()

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0xdedeff)

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
  const texture = loader.load('/tiles1.png', render)
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestFilter

  const geometry = new THREE.BoxGeometry(256, 1, 256)
  const material = new THREE.MeshBasicMaterial({
    color: 0x626267,
    side: THREE.DoubleSide
  })
  const plane = new THREE.Mesh(geometry, material)
  plane.position.y = -0.5
  plane.updateMatrix()
  scene.add(plane)

  const worldMesh = new THREE.Mesh()
  scene.add(worldMesh)

  const world = new World({
    texture,
    scene: worldMesh
  })

  const cursor = buildCube(0xffffff, 1)
  scene.add(cursor)

  const raycaster = new THREE.Raycaster()

  function buildCube(color, size) {
    const geometry = new THREE.BoxGeometry(size, size, size)
    const material = new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide
    })
    return new THREE.Mesh(geometry, material)
  }

  const palette = new THREE.Mesh()
  const sandCube = buildCube(0xb2b09b, 2)
  palette.add(sandCube)
  camera.add(palette)

  let cursorPos

  renderer.domElement.addEventListener('mousemove', (event) => {
    if (dropping) return
    const pointer = {}
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1

    raycaster.setFromCamera(pointer, camera)

    const intersects = raycaster.intersectObject(worldMesh, true)

    const atomIntersect = intersects.find((i) => i.object != cursor)
    const planeIntersect = raycaster.intersectObject(plane)[0]
    if (atomIntersect) {
      const face = atomIntersect.face
      cursorPos = atomIntersect.point
        .add(face.normal.multiplyScalar(0.5))
        .floor()
    } else if (planeIntersect) {
      const face = planeIntersect.face
      cursorPos = planeIntersect.point
        .add(face.normal.multiplyScalar(0.5))
        .floor()
    } else {
      return
    }
    cursor.position.x = cursorPos.x + 0.5
    cursor.position.y = cursorPos.y + 0.5
    cursor.position.z = cursorPos.z + 0.5
    cursor.updateMatrix()
  })

  let dropping = 0

  renderer.domElement.addEventListener('mousedown', (event) => {
    cursor.material.opacity = 0.1
    if (event.button === 0) {
      dropping = Alpine.evaluate(document.body, 'selectedAtom')
    }
  })

  renderer.domElement.addEventListener('mouseup', (event) => {
    cursor.material.opacity = 1
    dropping = 0
  })

  setInterval(() => {
    if (dropping) {
      for (let x = -2; x < 3; x++) {
        for (let z = -2; z < 3; z++) {
          world.setVoxel(cursorPos.x + x, 31, cursorPos.z + x, dropping)
        }
      }
    }
    // if (count < 1_000) {
    //   for (let n = 0; n < 32; n++) {
    //     count++
    //     world.setVoxel(randInt(16) - 32, 64 - 1, randInt(16), 1)

    //     world.setVoxel(
    //       randInt(16) + 0,
    //       64 - 1,
    //       randInt(16) - 16,
    //       Math.random() > 0.33 ? 2 : 1
    //     )

    //     world.setVoxel(
    //       randInt(16) + 0,
    //       64 - 1,
    //       randInt(16) + 16,
    //       Math.random() > 0.66 ? 2 : 1
    //     )
    //     world.setVoxel(randInt(16) - 32, 64 - 1, randInt(16), 2)
    //   }
    // }
    world.tick()
  }, 1000 / 60)

  function render() {
    requestAnimationFrame(render)
    controls.update()
    world.updateScene(scene)
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
