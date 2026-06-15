import { Howl } from 'howler'

class AudioController {
  private enabled = false
  private sounds: Record<string, Howl> = {}

  setEnabled(enabled: boolean) {
    this.enabled = enabled
    if (!enabled) {
      this.stopAll()
    }
  }

  toggle() {
    this.setEnabled(!this.enabled)
  }

  stopAll() {
    Object.values(this.sounds).forEach((s) => s.stop())
  }

  load(key: string, src: string) {
    this.sounds[key] = new Howl({ src: [src] })
  }

  play(key: string) {
    if (this.enabled && this.sounds[key]) {
      this.sounds[key].play()
    }
  }
}

export const audioController = new AudioController()
