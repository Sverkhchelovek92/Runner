class Game {
  OBSTACLE_PREFAB = new THREE.BoxBufferGeometry(1, 1, 1)
  OBSTACLE_MATERIAL = new THREE.MeshBasicMaterial({ color: 0xf252ad })
  BONUS_PREFAB = new THREE.SphereBufferGeometry(1, 12, 12)

  constructor(scene, camera) {
    this.speedZ = 15

    this.initializeScene(scene, camera)

    //bind callbacks
    document.addEventListener('keydown', this._keydown.bind(this))
    document.addEventListener('keyup', this._keyup.bind(this))
  }
  update() {
    this.time += this.clock.getDelta()

    this.updateGrid()
    this.checkCollision()
    this.updateInfo()
  }

  _keydown(event) {}

  _keyup() {}

  updateGrid() {
    this.grid.material.uniforms.time.value = this.time
    this.objectsParent.position.z = this.speedZ * this.time

    this.objectsParent.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const childZPos = child.position.z + this.objectsParent.position.z
        if (childZPos > 0) {
          const params = [
            child,
            this.ship.position.x,
            -this.objectsParent.position.z,
          ]
          if (child.userData.type === 'obstacle') {
            this.setupObstacle(...params)
          } else {
            this.setupBonus(...params)
          }
        }
      }
    })
  }

  checkCollision() {}

  updateInfo() {}

  gameOver() {}

  createGrid(scene) {
    let division = 100
    let limit = 200
    this.grid = new THREE.GridHelper(limit * 2, division, 'blue', 'blue')

    const moveableZ = []
    for (let i = 0; i <= division; i++) {
      moveableZ.push(1, 1, 0, 0) // move horizontal lines only (1 - point is moveable)
    }
    this.grid.geometry.setAttribute(
      'moveableZ',
      new THREE.BufferAttribute(new Uint8Array(moveableZ), 1)
    )
    this.grid.material = new THREE.ShaderMaterial({
      uniforms: {
        speedZ: {
          value: this.speedZ,
        },
        time: {
          value: 0,
        },
        limits: {
          value: new THREE.Vector2(-limit, limit),
        },
      },
      vertexShader: `
    uniform float time;
    uniform vec2 limits;
    uniform float speedZ;
    
    attribute float moveableZ;
    
    varying vec3 vColor;
  
    void main() {
      vColor = color;
      float limLen = limits.y - limits.x;
      vec3 pos = position;
      if (floor(moveableZ + 0.5) > 0.5){ // if a point has "moveable" attribute = 1 
        float zDist = speedZ * time;
        float currZPos = mod((pos.z + zDist) - limits.x, limLen) + limits.x;
        pos.z = currZPos;
      } 
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos,1.0);
    }
  `,
      fragmentShader: `
    varying vec3 vColor;
  
    void main() {
      gl_FragColor = vec4(vColor, 1.);
    }
  `,
      vertexColors: THREE.VertexColors,
    })

    scene.add(this.grid)

    this.time = 0
    this.clock = new THREE.Clock()
  }

  createShip(scene) {
    const shipBody = new THREE.Mesh(
      new THREE.TetrahedronBufferGeometry(0.4),
      new THREE.MeshBasicMaterial({ color: 0xcf0e3e })
    )

    shipBody.rotateX((45 * Math.PI) / 180)
    shipBody.rotateY((45 * Math.PI) / 180)

    this.ship = new THREE.Group()
    this.ship.add(shipBody)

    scene.add(this.ship)

    const reactorSocketGeometry = new THREE.CylinderBufferGeometry(
      0.08,
      0.08,
      0.1,
      16
    )
    const reactorSocketMaterial = new THREE.MeshBasicMaterial({
      color: 0x1a1918,
    })

    const reactorSocket1 = new THREE.Mesh(
      reactorSocketGeometry,
      reactorSocketMaterial
    )
    const reactorSocket2 = new THREE.Mesh(
      reactorSocketGeometry,
      reactorSocketMaterial
    )

    this.ship.add(reactorSocket1)
    this.ship.add(reactorSocket2)

    reactorSocket1.rotateX((90 * Math.PI) / 180)
    reactorSocket1.position.set(-0.15, 0, 0.1)
    reactorSocket2.rotateX((90 * Math.PI) / 180)
    reactorSocket2.position.set(0.15, 0, 0.1)

    const reactorLightGeometry = new THREE.CylinderBufferGeometry(
      0.055,
      0.055,
      0.1,
      16
    )
    const reactorLightMaterial = new THREE.MeshBasicMaterial({
      color: 0xf7f399,
    })

    const reactorLight1 = new THREE.Mesh(
      reactorLightGeometry,
      reactorLightMaterial
    )
    const reactorLight2 = new THREE.Mesh(
      reactorLightGeometry,
      reactorLightMaterial
    )

    this.ship.add(reactorLight1)
    this.ship.add(reactorLight2)

    reactorLight1.rotateX((90 * Math.PI) / 180)
    reactorLight1.position.set(-0.15, 0, 0.11)
    reactorLight2.rotateX((90 * Math.PI) / 180)
    reactorLight2.position.set(0.15, 0, 0.11)
  }

  initializeScene() {
    this.createShip(scene)
    this.createGrid(scene)

    this.objectsParent = new THREE.Group()
    scene.add(this.objectsParent)

    for (let i = 0; i < 10; i++) {
      this.spawnObstacle()
    }
    for (let i = 0; i < 10; i++) {
      this.spawnBonus()
    }

    camera.position.z = 5
    camera.rotateX((-20 * Math.PI) / 180)
    camera.position.set(0, 1.5, 2)
  }

  spawnObstacle() {
    const obj = new THREE.Mesh(this.OBSTACLE_PREFAB, this.OBSTACLE_MATERIAL)

    this.setupObstacle(obj)
    obj.userData = { type: 'obstacle' }

    this.objectsParent.add(obj)
  }

  setupObstacle(obj, refXPos = 0, refZPos = 0) {
    obj.scale.set(
      this.randomFloat(0.5, 2),
      this.randomFloat(0.5, 2),
      this.randomFloat(0.5, 2)
    )

    obj.position.set(
      refXPos + this.randomFloat(-30, 30),
      obj.scale.y * 0.5,
      refZPos - 100 - this.randomFloat(0, 100)
    )
  }

  spawnBonus() {
    const obj = new THREE.Mesh(
      this.BONUS_PREFAB,
      new THREE.MeshBasicMaterial({ color: 0x000000 })
    )
    this.setupBonus(obj)
    obj.userData = { type: 'bonus' }

    this.objectsParent.add(obj)
  }

  setupBonus(obj, refXPos = 0, refZPos = 0) {
    const price = this.randomInt(5, 20)
    const ratio = price / 20

    const size = ratio * 0.5
    obj.scale.set(size, size, size)

    const hue = 0.5 + 0.5 * ratio
    obj.material.color.setHSL(hue, 1, 0.5)

    obj.position.set(
      refXPos + this.randomFloat(-30, 30),
      obj.scale.y * 0.5,
      refZPos - 100 - this.randomFloat(0, 100)
    )
  }

  randomFloat(min, max) {
    return Math.random() * (max - min) + min
  }

  randomInt(min, max) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.random() * (max - min) + min
  }
}
