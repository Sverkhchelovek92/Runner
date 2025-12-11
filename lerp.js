class Lerp {
  constructor(from, to, delay) {
    this.from = from
    this.to = to
    this.delay = delay

    this.time = 0
    this.value = from

    this.lerpSpeed = 1 / this.delay

    return this
  }

  update(timeDelta) {
    const t = this.time / this.delay
    this.value = this.from * (1 - t) + this.to * t

    this.time += timeDelta * this.lerpSpeed

    if (this.onUpdateCallback) this.onUpdateCallback(this.value)

    if (this.time >= this.delay) {
      if (this.onFinishCallback) this.onFinishCallback()
      delete this
    }
  }

  onUpdate(callback) {
    this.onUpdateCallback = callback

    return this
  }

  onFinish(callback) {
    this.onFinishCallback = callback

    return this
  }
}
