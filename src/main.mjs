import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
function randInt(n) {
  return Math.floor(Math.random() * n)
}

const SIZE = 50

export function main(rootEl = document.body) {
  const scene = new THREE.Scene()

  scene.background = new THREE.Color(0x333333) // Gray background
  const space = 2

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

  const directionalLight = new THREE.DirectionalLight(0xff0000, 5)
  directionalLight.position.x = 0
  directionalLight.position.y = 5
  directionalLight.position.z = 5
  scene.add(directionalLight)

  const ambientLight = new THREE.AmbientLight(0xffffff, 3)
  scene.add(ambientLight)

  rootEl.appendChild(renderer.domElement)

  const world = new World(scene, {
    sand: {
      color: '#ff9900'
    },
    water: {
      color: '#0000ff'
    }
  })

  for (let n = 0; n < SIZE * SIZE * 10; n++) {
    world.set(randInt(SIZE), randInt(SIZE), randInt(SIZE), 'sand')
  }

  setInterval(() => {
    let count = 0
    for (const c of world._columns) {
      c.atoms.forEach((a) => a && count++)
    }
    console.log('atoms', count)
  }, 1000)
  setInterval(() => {
    if (Date.now() - lastFrame > 100) return
    for (let n = 0; n < 100; n++) {
      world.set(randInt(SIZE), randInt(SIZE), SIZE * 3, 'water')
    }
    world.tick()
  }, 1000 / 30)

  let lastFrame = Date.now()
  function animate(time) {
    lastFrame = Date.now()
    requestAnimationFrame(animate)
    world.update()
    renderer.render(scene, camera)
  }
  animate()
}

class World {
  constructor(scene, elements = {}) {
    const size = (this._size = SIZE)
    const height = (this._height = SIZE)
    this._atoms = []
    this._columns = []

    this._elementTypes = Object.fromEntries(
      Object.entries(elements).map(([name, { color }]) => {
        const cube = buildCube(color, size * size * height)
        scene.add(cube)
        return [name, cube]
      })
    )
  }

  set(x, y, z, type) {
    let column = this._columns.find((c) => c.x === x && c.y === y)
    if (column) {
      column.atoms[z] = type
    } else {
      const atoms = []
      atoms[z] = type
      this._columns.push({ x, y, atoms })
    }
  }

  get(x, y, z) {
    const column = this._columns.find((c) => c.x === x && c.y === y)
    return column?.atoms[z]
  }

  tick() {
    console.time('tick')
    this._columns.forEach((c) => {
      c.atoms.forEach((type, z, atoms) => {
        if (!type || !z) return
        const under = atoms[z - 1]
        if (under) {
          const siblings = [
            this.get(c.x - 1, c.y, z),
            this.get(c.x + 1, c.y, z),
            this.get(c.x, c.y - 1, z),
            this.get(c.x, c.y + 1, z)
          ]
          const emptyIndexes = siblings
            .map((s, index) => (s ? null : index))
            .filter((x) => x)
          if (emptyIndexes.length === 0) return
          const nextIndex = emptyIndexes[randInt(emptyIndexes.length)]
          switch (nextIndex) {
            case 0:
              atoms[z] = null
              this.set(c.x - 1, c.y, z, type)
              break
            case 1:
              atoms[z] = null
              this.set(c.x + 1, c.y, z, type)
              break
            case 2:
              atoms[z] = null
              this.set(c.x, c.y - 1, z, type)
              break
            case 3:
              atoms[z] = null
              this.set(c.x, c.y + 1, z, type)
              break
          }
        } else {
          atoms[z] = null
          atoms[z - 1] = type
        }
      })
    })
    console.timeEnd('tick')
  }

  update() {
    const dummy = new THREE.Object3D()
    const typeCounts = Object.fromEntries(
      Object.keys(this._elementTypes).map((typeName) => [typeName, 0])
    )

    for (const c of this._columns) {
      c.atoms.forEach((type, z) => {
        if (!type) return
        dummy.position.set(c.x - SIZE / 2, z, c.y - SIZE / 2)
        dummy.updateMatrix()
        this._elementTypes[type].setMatrixAt(typeCounts[type]++, dummy.matrix)
      })
    }

    for (const type of Object.values(this._elementTypes)) {
      type.instanceMatrix.needsUpdate = true
    }
  }
}

function buildCube(color, maxInstances) {
  const geometry = new THREE.BoxGeometry(1, 1, 1)
  // const material = new THREE.MeshLambertMaterial({
  //   color: color,
  //   specular: 0x222222,
  //   shininess: 1
  // })
  geometry.computeVertexNormals()
  const cube = new THREE.InstancedMesh(
    geometry,
    // [
    // material
    // [
    // new THREE.MeshBasicMaterial({ color: 0xfec1ea }),
    new THREE.MeshPhongMaterial({
      color
    }),
    // new THREE.MeshBasicMaterial({
    //   color: 0x999999,
    //   wireframe: true,
    //   transparent: true,
    //   opacity: 0.85
    // }),
    // ]
    maxInstances
  )
  return cube
}
