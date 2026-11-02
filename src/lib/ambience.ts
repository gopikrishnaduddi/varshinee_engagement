/**
 * Original, procedurally synthesised temple ambience — a tanpura-style drone with
 * soft, distant bells. Nothing is downloaded, so audio never delays loading and
 * there are no licensing questions. It only ever starts from a guest's tap.
 */
type Ctx = AudioContext

const SA = 138.59 // C#3
const PATTERN = [
  { f: SA * 0.75, gap: 1.25 }, // mandra Pa
  { f: SA, gap: 1.25 },
  { f: SA, gap: 1.25 },
  { f: SA * 0.5, gap: 1.85 }, // kharaj Sa
]

export class Ambience {
  private ctx: Ctx | null = null
  private master: GainNode | null = null
  private droneBus: BiquadFilterNode | null = null
  private wave: PeriodicWave | null = null
  private timer: number | null = null
  private nextPluck = 0
  private step = 0
  private nextBell = 0
  playing = false

  private setup() {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AC()
    this.ctx = ctx

    const master = ctx.createGain()
    master.gain.value = 0
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -20
    comp.ratio.value = 3
    master.connect(comp).connect(ctx.destination)
    this.master = master

    // generated hall reverb
    const seconds = 3.4
    const length = Math.floor(ctx.sampleRate * seconds)
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate)
    for (let c = 0; c < 2; c++) {
      const data = impulse.getChannelData(c)
      for (let i = 0; i < length; i++) {
        const t = i / length
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 3.2) * 0.6
      }
    }
    const convolver = ctx.createConvolver()
    convolver.buffer = impulse
    const wet = ctx.createGain()
    wet.gain.value = 0.42
    convolver.connect(wet).connect(master)

    const bus = ctx.createBiquadFilter()
    bus.type = 'lowpass'
    bus.frequency.value = 2600
    bus.connect(master)
    bus.connect(convolver)
    this.droneBus = bus

    // a bright, buzzing spectrum reminiscent of the tanpura's jawari bridge
    const n = 40
    const real = new Float32Array(n)
    const imag = new Float32Array(n)
    for (let k = 1; k < n; k++) {
      const buzz = 1 + 0.75 * Math.sin(k * 0.82) ** 2
      imag[k] = (buzz / Math.pow(k, 0.85)) * (k % 2 === 0 ? 0.92 : 1)
    }
    this.wave = ctx.createPeriodicWave(real, imag)
  }

  private pluck(freq: number, when: number) {
    const ctx = this.ctx!
    const osc = ctx.createOscillator()
    osc.setPeriodicWave(this.wave!)
    osc.frequency.value = freq
    osc.detune.value = (Math.random() - 0.5) * 4

    const tone = ctx.createBiquadFilter()
    tone.type = 'lowpass'
    tone.Q.value = 1.6
    tone.frequency.setValueAtTime(3400, when)
    tone.frequency.exponentialRampToValueAtTime(700, when + 3.6)

    const amp = ctx.createGain()
    amp.gain.setValueAtTime(0.0001, when)
    amp.gain.linearRampToValueAtTime(0.16, when + 0.02)
    amp.gain.exponentialRampToValueAtTime(0.06, when + 1.2)
    amp.gain.exponentialRampToValueAtTime(0.0001, when + 5.8)

    osc.connect(tone).connect(amp).connect(this.droneBus!)
    osc.start(when)
    osc.stop(when + 6)
  }

  private bell(when: number) {
    const ctx = this.ctx!
    const base = 640 + Math.random() * 120
    const partials = [
      [1, 1, 4.5],
      [2.01, 0.42, 2.6],
      [2.76, 0.3, 2.1],
      [4.07, 0.16, 1.3],
      [5.42, 0.09, 0.9],
    ]
    for (const [ratio, gain, decay] of partials) {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = base * ratio
      const amp = ctx.createGain()
      amp.gain.setValueAtTime(0.0001, when)
      amp.gain.linearRampToValueAtTime(0.045 * gain, when + 0.006)
      amp.gain.exponentialRampToValueAtTime(0.0001, when + decay)
      osc.connect(amp).connect(this.master!)
      osc.start(when)
      osc.stop(when + decay + 0.1)
    }
  }

  private schedule = () => {
    const ctx = this.ctx
    if (!ctx) return
    const horizon = ctx.currentTime + 0.5
    while (this.nextPluck < horizon) {
      const p = PATTERN[this.step % PATTERN.length]
      this.pluck(p.f, this.nextPluck)
      this.nextPluck += p.gap
      this.step++
    }
    if (this.nextBell < horizon) {
      this.bell(this.nextBell)
      if (Math.random() < 0.35) this.bell(this.nextBell + 0.9)
      this.nextBell += 9 + Math.random() * 8
    }
  }

  async start() {
    if (!this.ctx) this.setup()
    const ctx = this.ctx!
    await ctx.resume()
    const now = ctx.currentTime
    this.master!.gain.cancelScheduledValues(now)
    this.master!.gain.setValueAtTime(this.master!.gain.value, now)
    this.master!.gain.linearRampToValueAtTime(0.85, now + 2.5)
    this.nextPluck = Math.max(this.nextPluck, now + 0.05)
    this.nextBell = Math.max(this.nextBell, now + 3.5)
    if (this.timer === null) this.timer = window.setInterval(this.schedule, 120)
    this.schedule()
    this.playing = true
  }

  stop() {
    const ctx = this.ctx
    this.playing = false
    if (!ctx || !this.master) return
    const now = ctx.currentTime
    this.master.gain.cancelScheduledValues(now)
    this.master.gain.setValueAtTime(this.master.gain.value, now)
    this.master.gain.linearRampToValueAtTime(0, now + 0.7)
    window.setTimeout(() => {
      if (this.playing) return
      if (this.timer !== null) {
        window.clearInterval(this.timer)
        this.timer = null
      }
      void ctx.suspend()
    }, 800)
  }

  dispose() {
    if (this.timer !== null) window.clearInterval(this.timer)
    this.timer = null
    void this.ctx?.close()
    this.ctx = null
  }
}
