import * as THREE from 'three'
import { RGBA_ASTC_10x10_Format } from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import Stats from 'three/addons/libs/stats.module.js'

function randInt(n) {
  return Math.floor(Math.random() * n)
}

const SIZE = 64

export function main(rootEl = document.body) {
  const scene = new THREE.Scene()

  scene.background = new THREE.Color(0x333333) // Gray background
  const space = 2

  const stats = new Stats()
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )

  const renderer = new THREE.WebGLRenderer()

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight)
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
  })
  renderer.setSize(window.innerWidth, window.innerHeight)

  const controls = new OrbitControls(camera, renderer.domElement)
  camera.position.y = SIZE
  camera.position.z = space * SIZE

  const pointLight = new THREE.PointLight(0xaa8899, 0.75)
  pointLight.position.set(50, -25, 75)
  camera.add(pointLight)

  const ambientLight = new THREE.AmbientLight(0xffffff, 3)
  scene.add(ambientLight)

  rootEl.append(renderer.domElement)
  rootEl.append(stats.domElement)

  const world = new World({
    scene,
    elements: {
      sand: {
        color: '#ff9900'
      },
      water: {
        color: '#0000ff',
        opacity: 0.25
      }
    },
    size: SIZE
  })

  for (let n = 0; n < SIZE; n++) {
    world.set(0, 0, n, 'sand')
  }

  let insertX = randInt(SIZE)
  let insertY = randInt(SIZE)

  setInterval(() => {
    world.set(
      insertX,
      insertY,
      SIZE - 1,
      Math.random() > 0.5 ? 'sand' : 'water'
    )
    world.tick()
  }, 1000 / 120)

  setInterval(() => {
    insertX = randInt(SIZE)
    insertY = randInt(SIZE)
  }, 5000)

  setInterval(() => {}, 100)

  let lastFrame = Date.now()
  function animate(time) {
    lastFrame = Date.now()
    requestAnimationFrame(animate)
    world.update()
    stats.update()
    renderer.render(scene, camera)
  }
  animate()
}

class World {
  constructor({ scene, elements = {}, size = 32 }) {
    this._size = size
    this._cubes = [null]
    this._elements = elements
    this._elementNames = [null, ...Object.keys(elements)]

    this._atoms = new Uint8ClampedArray(size ** 3)

    for (const [name, element] of Object.entries(elements)) {
      const cube = buildCube(element, size ** 3)
      cube.position.set(-SIZE / 2, 0, -SIZE / 2)
      cube.updateMatrix()
      scene.add(cube)
      this._cubes.push(cube)
    }
  }

  set(x, y, z, type) {
    if (type === null) {
      this._set(x, y, z, 0)
    } else {
      const typeIndex = this._elementNames.indexOf(type)
      this._set(x, y, z, typeIndex)
    }
  }

  get(x, y, z) {
    const index = this._get(x, y, z)
    return this._elementNames[index]
  }

  _set(x, y, z, type) {
    const size = this._size
    const index = size * (x * size + y) + z
    this._atoms[index] = type
  }

  _get(x, y, z) {
    const size = this._size
    const index = size * (x * size + y) + z
    return this._atoms[index]
  }

  tick() {
    const size = this._size
    const sizeSq = size * size

    const atoms = this._atoms

    function swapAtoms(n1, n2) {
      const t = atoms[n1]
      atoms[n1] = atoms[n2]
      atoms[n2] = t
    }

    function isFillable(n1) {
      return atoms[n1] == 0 || atoms[n1] === 2
    }

    for (let n = 0; n < atoms.length; n++) {
      const self = atoms[n]
      if (!self) continue
      const z = n % size
      if (z === 0) continue

      const y = Math.floor(n / size) % size
      const x = Math.floor(n / sizeSq)

      const under = atoms[n - 1]

      if (under) {
        // sand above water, swap them
        if (self === 1 && isFillable(n - 1)) {
          swapAtoms(n, n - 1)
          continue
        }
        let dir = randInt(4)
        // sand behavior
        if (self === 1) {
          switch (dir) {
            case 0:
              if (x > 0 && z > 1) {
                if (isFillable(n - sizeSq) && isFillable(n - sizeSq - 1)) {
                  swapAtoms(n - sizeSq - 1, n)
                }
              }
              break
            case 1:
              if (x < size - 1 && z > 1) {
                if (isFillable(n + sizeSq) && isFillable(n + sizeSq - 1)) {
                  swapAtoms(n + sizeSq - 1, n)
                }
              }
              break
            case 2:
              if (y > 0 && z > 1) {
                if (isFillable(n - size) && isFillable(n - size - 1)) {
                  swapAtoms(n - size - 1, n)
                }
              }
              break
            case 3:
              if (y < size - 1 && z > 1) {
                if (isFillable(n + size) && isFillable(n + size - 1)) {
                  swapAtoms(n + size - 1, n)
                }
              }
              break
          }
        } else if (self === 2) {
          switch (dir) {
            case 0:
              if (x > 0) {
                if (isFillable(n - sizeSq)) {
                  swapAtoms(n - sizeSq, n)
                }
              }
              break
            case 1:
              if (x < size - 1) {
                if (isFillable(n + sizeSq)) {
                  swapAtoms(n + sizeSq, n)
                }
              }
              break
            case 2:
              if (y > 0) {
                if (isFillable(n - size)) {
                  swapAtoms(n - size, n)
                }
              }
              break
            case 3:
              if (y < size - 1) {
                if (isFillable(n + size)) {
                  swapAtoms(n + size, n)
                }
              }
              break
          }
        }
      } else {
        swapAtoms(n, n - 1)
      }
      // }
    }
  }

  update() {
    const dummy = new THREE.Object3D()
    const size = this._size
    const sizeSq = size * size
    const atoms = this._atoms
    const cubes = this._cubes

    let cubeCounts = cubes.map(() => 0)
    for (let n = 0; n < atoms.length; n++) {
      const self = atoms[n]
      if (!self) continue
      const cube = cubes[self]
      const z = n % size
      const y = Math.floor(n / size) % size
      const x = Math.floor(n / sizeSq)
      dummy.position.set(x, z, y)
      dummy.updateMatrix()
      cube.setMatrixAt(cubeCounts[self]++, dummy.matrix)
    }
    cubes.forEach((cube) => {
      if (cube) {
        cube.instanceMatrix.needsUpdate = true
      }
    })
  }
}

function buildCube(element, maxInstances) {
  const geometry = new THREE.BoxGeometry(1, 1, 1)
  geometry.computeVertexNormals()
  const cube = new THREE.InstancedMesh(
    geometry,
    new THREE.MeshBasicMaterial({
      color: element.color,
      opacity: element.opacity ?? 1
    }),
    maxInstances
  )
  return cube
}
