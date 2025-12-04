class Game {
  constructor() {
    document.addEventListener('keydown', this._keydown.bind(this))
    document.addEventListener('keyup', this._keyup.bind(this))
  }
  update() {
    this.updateGrid()
  }

  _keydown(event) {}

  _keyup() {}

  updateGrid() {}
}
