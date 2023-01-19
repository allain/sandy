import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import Stats from 'three/addons/libs/stats.module.js'
import { World } from './World.mjs'

import { sand } from './elements/sand.mjs'
import { water } from './elements/water.mjs'
import { steam } from './elements/steam.mjs'
import { stone } from './elements/stone.mjs'
import { ice } from './elements/ice.mjs'
import { lava } from './elements/lava.mjs'

export function main() {
  const renderer = new THREE.WebGLRenderer()

  const stats = new Stats()

  stats.domElement.style.cssText =
    'position:fixed;top:0;right:0;cursor:pointer;opacity:0.9;z-index:10000'
  document.body.append(stats.domElement)
  document.body.append(renderer.domElement)

  // fov, aspect, near, far
  const camera = new THREE.PerspectiveCamera(45, 2, 0.1, 1000)
  camera.position.set(0, 10, 64)

  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.mouseButtons = {
    RIGHT: THREE.MOUSE.ROTATE
  }
  controls.touches = {
    TWO: THREE.TOUCH.ROTATE
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
    const intensity = 0.5
    const light = new THREE.DirectionalLight(color, intensity)
    light.position.set(x, y, z)
    scene.add(light)
  }
  addLight(200, 200, 200)
  addLight(200, 200, -200)
  addLight(-200, 200, 200)
  addLight(-200, 200, -200)

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

  const elements = [sand, water, steam, stone, ice, lava]

  const world = new World({
    scene: worldMesh,
    elements
  })

  const cursor = buildCursor(0xffffff, 5)
  scene.add(cursor)

  const raycaster = new THREE.Raycaster()

  function buildCursor(color, size) {
    const geometry = new THREE.BoxGeometry(size * 1.01, 32, size * 1.01)
    const material = new THREE.MeshBasicMaterial({
      color,
      opacity: 0.5,
      transparent: true,
      side: THREE.DoubleSide
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.y = 32
    mesh.updateMatrix()
    return mesh
  }

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

  let cursorPos = {}

  function updateCursorPos(event) {
    const pointer = {}
    if (event.type.startsWith('touch')) {
      pointer.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1
      pointer.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1
    } else {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1
      pointer.y = -(event.clientY / window.innerHeight) * 2 + 1
    }

    raycaster.setFromCamera(pointer, camera)

    // const intersects = raycaster.intersectObject(worldMesh, true)
    const atomIntersect = null // intersects.find((i) => i.object != cursor)
    const planeIntersect = raycaster.intersectObject(plane)[0]
    if (atomIntersect) {
      Alpine.evaluate(document.body, 'showCursor = false')
      cursor.visible = true
      const face = atomIntersect.face
      cursorPos = atomIntersect.point
        .add(face.normal.multiplyScalar(0.5))
        .floor()
    } else if (planeIntersect) {
      Alpine.evaluate(document.body, 'showCursor = false')
      cursor.visible = true
      const face = planeIntersect.face
      cursorPos = planeIntersect.point
        .add(face.normal.multiplyScalar(0.5))
        .floor()
    } else {
      Alpine.evaluate(document.body, 'showCursor = true')
      cursor.visible = false
      return
    }
    cursor.position.x = cursorPos.x + 0.5
    cursor.position.y = 16 + 0.5
    cursor.position.z = cursorPos.z + 0.5
    cursor.updateMatrix()
  }

  let dropping = 0

  Alpine.effect(() => {
    const selectedAtom = Alpine.evaluate(document.body, 'selectedAtom')
    const element = elements[selectedAtom - 1]
    cursor.material.color.setHex(element.color)
  })

  renderer.domElement.addEventListener('mousemove', updateCursorPos)
  renderer.domElement.addEventListener('touchmove', updateCursorPos)

  renderer.domElement.addEventListener('mousedown', (event) => {
    if (event.button === 0) {
      dropping = Alpine.evaluate(document.body, 'selectedAtom')
    }
  })

  renderer.domElement.addEventListener('touchstart', (event) => {
    updateCursorPos(event)
    dropping = Alpine.evaluate(document.body, 'selectedAtom')
  })

  renderer.domElement.addEventListener('touchend', (event) => {
    dropping = 0
  })

  renderer.domElement.addEventListener('mouseup', (event) => {
    // cursor.material.opacity = 1
    dropping = 0
  })

  setInterval(() => {
    if (dropping) {
      for (let x = -2; x < 3; x++) {
        for (let z = -2; z < 3; z++) {
          world.setVoxel(cursorPos.x + x, 31, cursorPos.z + z, dropping)
        }
      }
    }

    Alpine.evaluate(document.body, function () {
      this.atomCounts = Object.entries(world.counts)
    })
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
