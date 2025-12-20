class Game {
  OBSTACLE_PREFAB = new THREE.BoxBufferGeometry(1, 1, 1)
  OBSTACLE_MATERIAL = new THREE.MeshBasicMaterial({ color: 0xf252ad })
  BONUS_PREFAB = new THREE.SphereBufferGeometry(1, 12, 12)
  COLLISION_THRESHOLD = 0.2

  constructor(scene, camera) {
    this.running = false

    this.speedZ = 15
    this.speedX = 0
    this.translateX = 0

    this.health = 100
    this.score = 0

    this.rotationLerp = null

    this.uiHealth = document.getElementById('health')
    this.uiScore = document.getElementById('score')
    this.uiDistance = document.getElementById('distance')

    // initial values
    this.uiScore.innerText = this.score
    this.uiDistance.innerText = 0
    this.uiHealth.value = this.health
    this.uiHealth.style.setProperty('--health', `${this.health}%`)

    document.getElementById('start-btn').onclick = () => {
      this.running = true
      document.getElementById('intro-block').style.display = 'none'
    }

    this.initializeScene(scene, camera)

    //bind callbacks
    document.addEventListener('keydown', this._keydown.bind(this))
    document.addEventListener('keyup', this._keyup.bind(this))
  }

  update() {
    if (!this.running) return

    const timeDelta = this.clock.getDelta()

    this.time += timeDelta

    if (this.rotationLerp !== null) {
      this.rotationLerp.update(timeDelta)
    }

    this.translateX += this.speedX * -0.05

    this.updateGrid()
    this.checkCollision()
    this.updateInfo()
  }

  _keydown(event) {
    let newSpeedX
    switch (event.key) {
      case 'ArrowLeft':
        newSpeedX = -1.0
        break
      case 'ArrowRight':
        newSpeedX = 1
        break
      default:
        return
    }

    if (this.speedX !== newSpeedX) {
      this.speedX = newSpeedX
      this.rotateShip((-this.speedX * 20 * Math.PI) / 180, 0.8)
    }
  }

  _keyup() {
    this.speedX = 0
    this.rotateShip(0, 0.5)
  }

  rotateShip(targetRotation, delay) {
    const $this = this
    this.rotationLerp = new Lerp(this.ship.rotation.z, targetRotation, delay)
      .onUpdate((value) => {
        $this.ship.rotation.z = value
      })
      .onFinish(() => {
        $this.rotationLerp = null
      })
  }

  updateGrid() {
    this.grid.material.uniforms.time.value = this.time
    this.objectsParent.position.z = this.speedZ * this.time

    this.grid.material.uniforms.translateX.value = this.translateX
    this.objectsParent.position.x = this.translateX

    this.objectsParent.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const childZPos = child.position.z + this.objectsParent.position.z
        if (childZPos > 0) {
          const params = [
            child,
            -this.translateX,
            -this.objectsParent.position.z,
          ]
          if (child.userData.type === 'obstacle') {
            this.setupObstacle(...params)
          } else {
            const price = this.setupBonus(...params)
            child.userData.price = price
          }
        }
      }
    })
  }

  checkCollision() {
    this.objectsParent.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const childZPos = child.position.z + this.objectsParent.position.z

        // threshold distance
        const thresholdX = this.COLLISION_THRESHOLD + child.scale.x / 2
        const thresholdZ = this.COLLISION_THRESHOLD + child.scale.z / 2

        if (
          childZPos > -thresholdZ &&
          Math.abs(child.position.x + this.translateX) < thresholdX
        ) {
          const params = [
            child,
            -this.translateX,
            -this.objectsParent.position.z,
          ]
          if (child.userData.type === 'obstacle') {
            this.health -= 10
            console.log('HEALTH: ', this.health)
            this.uiHealth.value = this.health
            this.setupObstacle(...params)
            if (this.health <= 0) this.gameOver()
          } else {
            this.score += child.userData.price
            this.score = Math.round(this.score)
            console.log('SCORE: ', this.score)
            this.uiScore.innerText = this.score
            child.userData.price = this.setupBonus(...params)
          }
        }
      }
    })
  }

  updateInfo() {
    this.uiDistance.innerText = Math.round(this.objectsParent.position.z)
    this.uiHealth.value = this.health
    this.uiHealth.style.setProperty('--health', `${this.health}%`)
  }

  gameOver() {
    this.running = false
  }

  createGrid(scene) {
    let division = 100
    let limit = 200
    this.grid = new THREE.GridHelper(limit * 2, division, 'blue', 'blue')

    const moveableX = []
    const moveableZ = []
    for (let i = 0; i <= division; i++) {
      moveableX.push(0, 0, 1, 1) // move vertical lines only (1 - point is moveable)
      moveableZ.push(1, 1, 0, 0) // move horizontal lines only (1 - point is moveable)
    }
    this.grid.geometry.setAttribute(
      'moveableX',
      new THREE.BufferAttribute(new Uint8Array(moveableX), 1)
    )
    this.grid.geometry.setAttribute(
      'moveableZ',
      new THREE.BufferAttribute(new Uint8Array(moveableZ), 1)
    )
    this.grid.material = new THREE.ShaderMaterial({
      uniforms: {
        speedZ: {
          value: this.speedZ,
        },
        translateX: {
          value: this.translateX,
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
    uniform float translateX;
    
    attribute float moveableZ;
    attribute float moveableX;
    
    varying vec3 vColor;
  
    void main() {
      vColor = color;
      float limLen = limits.y - limits.x;
      vec3 pos = position;
      if (floor(moveableX + 0.5) > 0.5){ // if a point has "moveableX" attribute = 1 
        float xDist = translateX * time;
        float currXPos = mod((pos.x + xDist) - limits.x, limLen) + limits.x;
        pos.x = currXPos;
      } 
      if (floor(moveableZ + 0.5) > 0.5){ // if a point has "moveableZ" attribute = 1 
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
    const price = this.setupBonus(obj)
    obj.userData = { type: 'bonus', price: price }

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

    return price
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
