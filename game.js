class Game {
  constructor(scene, camera) {
    this.initializeScene(scene, camera)

    //bind callbacks
    document.addEventListener('keydown', this._keydown.bind(this))
    document.addEventListener('keyup', this._keyup.bind(this))
  }
  update() {
    this.cube.rotation.x += 0.01
    this.cube.rotation.y += 0.01

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
    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    this.cube = new THREE.Mesh(geometry, material)
    scene.add(this.cube)
  }
}
