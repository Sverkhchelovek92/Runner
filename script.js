const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)

document.body.appendChild(renderer.domElement)

const gameInstance = new Game(scene, camera)

camera.position.z = 5

function animate() {
  gameInstance.update()

  renderer.render(scene, camera)
}
renderer.setAnimationLoop(animate)
