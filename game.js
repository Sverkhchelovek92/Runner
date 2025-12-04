class Game {
  constructor(scene, camera) {
    this.initializeScene(scene, camera)

    //bind callbacks
    document.addEventListener('keydown', this._keydown.bind(this))
    document.addEventListener('keyup', this._keyup.bind(this))
  }
  update() {
    // this.cube.rotation.x += 0.01
    // this.cube.rotation.y += 0.01

    this.updateGrid()
    this.checkCollision()
    this.updateInfo()
  }

  _keydown(event) {}

  _keyup() {}

  updateGrid() {}

  checkCollision() {}

  updateInfo() {}

  gameOver() {}

  initializeScene() {
    // const geometry = new THREE.BoxGeometry(1, 1, 1)
    // const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    // this.cube = new THREE.Mesh(geometry, material)
    // scene.add(this.cube)

    const shipBody = new THREE.Mesh(
      new THREE.TetrahedronBufferGeometry(0.4),
      new THREE.MeshBasicMaterial({ color: 0xcf0e3e })
    )

    shipBody.rotateX((45 * Math.PI) / 180)
    shipBody.rotateY((45 * Math.PI) / 180)

    this.ship = new THREE.Group()
    this.ship.add(shipBody)

    scene.add(this.ship)

    camera.position.z = 5
    camera.rotateX((-20 * Math.PI) / 180)
    camera.position.set(0, 1.5, 2)
  }
}
