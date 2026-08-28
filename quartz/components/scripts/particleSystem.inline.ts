type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  fx: number
  fy: number
  radius: number
  coupling: number
}

type PotentialWell = { x: number; y: number }

type EnergyLandscape = {
  wells: PotentialWell[]
  strength: number
}

let disposeParticleSystem: (() => void) | undefined

const randomNormal = () =>
  Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() - 3

const initializeParticleSystem = () => {
  disposeParticleSystem?.()
  disposeParticleSystem = undefined

  const selectedCanvas = document.querySelector<HTMLCanvasElement>("canvas.interacting-particles")
  if (!selectedCanvas) return
  const selectedContext = selectedCanvas.getContext("2d")
  if (!selectedContext) return
  const canvas = selectedCanvas
  const context = selectedContext

  let width = 0
  let height = 0
  let frameId: number | undefined
  let visible = true
  let disposed = false
  let lastTime = performance.now()
  let pointer: { x: number; y: number; vx: number; vy: number } | undefined
  let landscape: EnergyLandscape | undefined
  let particleColor = "#284b63"
  let accentColor = "#84a59d"
  const particles: Particle[] = []
  const connectionRadius = 34
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)")

  const updateColors = () => {
    const styles = getComputedStyle(canvas)
    particleColor = styles.getPropertyValue("--secondary").trim() || particleColor
    accentColor = styles.getPropertyValue("--tertiary").trim() || accentColor
  }

  const makeParticle = (): Particle => ({
    x: 10 + Math.random() * Math.max(width - 20, 1),
    y: 10 + Math.random() * Math.max(height - 20, 1),
    vx: randomNormal() * 0.12,
    vy: randomNormal() * 0.12,
    fx: 0,
    fy: 0,
    radius: 1.9 + Math.random() * 0.7,
    coupling: 0,
  })

  const resize = () => {
    const oldWidth = width
    const oldHeight = height
    const bounds = canvas.getBoundingClientRect()
    width = Math.max(bounds.width, 1)
    height = Math.max(bounds.height, 1)

    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(width * pixelRatio)
    canvas.height = Math.round(height * pixelRatio)
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

    if (oldWidth > 0 && oldHeight > 0) {
      for (const particle of particles) {
        particle.x = (particle.x / oldWidth) * width
        particle.y = (particle.y / oldHeight) * height
      }
      if (landscape) {
        for (const well of landscape.wells) {
          well.x = (well.x / oldWidth) * width
          well.y = (well.y / oldHeight) * height
        }
      }
    }

    const targetCount = Math.max(22, Math.min(38, Math.round(width / 19)))
    while (particles.length < targetCount) particles.push(makeParticle())
    particles.splice(targetCount)
    updateColors()
    draw()
  }

  const accumulateForces = () => {
    const equilibriumDistance = 23
    const interactionScale = 13
    const cutoff = 58

    for (const particle of particles) {
      particle.fx = 0
      particle.fy = 0
      particle.coupling = 0
    }

    for (let i = 0; i < particles.length; i++) {
      const a = particles[i]
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const distanceSquared = dx * dx + dy * dy
        if (distanceSquared > cutoff * cutoff) continue

        const distance = Math.max(Math.sqrt(distanceSquared), 0.5)
        const localCoupling = Math.max(0, 1 - distance / connectionRadius)
        a.coupling += localCoupling
        b.coupling += localCoupling
        const displacement = (distance - equilibriumDistance) / interactionScale
        const exponential = Math.exp(-displacement)
        const pairForce = exponential * exponential - exponential
        const magnitude =
          pairForce > 0 ? Math.min(0.12, 0.012 * pairForce) : Math.max(-0.001, 0.003 * pairForce)
        const forceX = (magnitude * dx) / distance
        const forceY = (magnitude * dy) / distance

        a.fx -= forceX
        a.fy -= forceY
        b.fx += forceX
        b.fy += forceY

        const alignment = 0.015 * Math.max(0, 1 - distance / 48)
        const velocityDifferenceX = b.vx - a.vx
        const velocityDifferenceY = b.vy - a.vy
        a.fx += velocityDifferenceX * alignment
        a.fy += velocityDifferenceY * alignment
        b.fx -= velocityDifferenceX * alignment
        b.fy -= velocityDifferenceY * alignment
      }
    }

    if (pointer) {
      for (const particle of particles) {
        const dx = particle.x - pointer.x
        const dy = particle.y - pointer.y
        const distanceSquared = dx * dx + dy * dy
        if (distanceSquared > 92 * 92) continue
        const distance = Math.max(Math.sqrt(distanceSquared), 1)
        const influence = (1 - distance / 92) ** 2
        const magnitude = 0.09 * influence
        particle.fx += (magnitude * dx) / distance
        particle.fy += (magnitude * dy) / distance
        particle.fx += pointer.vx * 0.018 * influence
        particle.fy += pointer.vy * 0.018 * influence
      }
    }

    if (landscape) {
      for (const particle of particles) {
        let nearestWell: PotentialWell | undefined
        let nearestDistanceSquared = Number.POSITIVE_INFINITY

        for (const well of landscape.wells) {
          const dx = well.x - particle.x
          const dy = well.y - particle.y
          const distanceSquared = dx * dx + dy * dy
          if (distanceSquared < nearestDistanceSquared) {
            nearestDistanceSquared = distanceSquared
            nearestWell = well
          }
        }

        if (!nearestWell || nearestDistanceSquared > 145 * 145) continue
        const dx = nearestWell.x - particle.x
        const dy = nearestWell.y - particle.y
        const wellInfluence = Math.exp(-nearestDistanceSquared / (2 * 52 * 52))
        const wellStrength = 0.0015 * landscape.strength * wellInfluence
        particle.fx += dx * wellStrength
        particle.fy += dy * wellStrength
      }
    }
  }

  const evolve = (step: number) => {
    accumulateForces()
    const margin = 7

    for (const particle of particles) {
      if (particle.x < margin) particle.fx += (margin - particle.x) * 0.018
      if (particle.x > width - margin) particle.fx -= (particle.x - width + margin) * 0.018
      if (particle.y < margin) particle.fy += (margin - particle.y) * 0.018
      if (particle.y > height - margin) particle.fy -= (particle.y - height + margin) * 0.018

      const connectedness = Math.min(1, particle.coupling * 1.4)
      const mobility = 1.2 - 0.35 * connectedness
      const damping = Math.pow(0.92 - 0.06 * connectedness, step)
      let temperature = 0.12 - 0.065 * connectedness

      if (pointer) {
        const dx = particle.x - pointer.x
        const dy = particle.y - pointer.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const localInfluence = Math.max(0, 1 - distance / 125) ** 2
        const cursorSpeed = Math.min(1, Math.sqrt(pointer.vx ** 2 + pointer.vy ** 2) / 12)
        const cursorTemperature = -0.025 + cursorSpeed * 0.16
        temperature += cursorTemperature * localInfluence
      }

      const noise = Math.max(0.025, temperature) * Math.sqrt(step)

      particle.vx = particle.vx * damping + particle.fx * mobility * step + randomNormal() * noise
      particle.vy = particle.vy * damping + particle.fy * mobility * step + randomNormal() * noise
      particle.x += particle.vx * step
      particle.y += particle.vy * step

      if (particle.x < margin) {
        particle.x = margin
        particle.vx = Math.abs(particle.vx) * 0.35
      } else if (particle.x > width - margin) {
        particle.x = width - margin
        particle.vx = -Math.abs(particle.vx) * 0.35
      }
      if (particle.y < margin) {
        particle.y = margin
        particle.vy = Math.abs(particle.vy) * 0.35
      } else if (particle.y > height - margin) {
        particle.y = height - margin
        particle.vy = -Math.abs(particle.vy) * 0.35
      }
    }

    if (pointer) {
      pointer.vx *= Math.pow(0.78, step)
      pointer.vy *= Math.pow(0.78, step)
    }
    if (landscape) {
      landscape.strength *= Math.pow(0.989, step)
      if (landscape.strength < 0.025) landscape = undefined
    }
  }

  function draw() {
    context.clearRect(0, 0, width, height)

    context.lineWidth = 0.7
    context.strokeStyle = accentColor

    if (landscape) {
      for (const well of landscape.wells) {
        for (const [radius, opacity] of [
          [8, 0.1],
          [18, 0.055],
          [30, 0.025],
        ] as const) {
          context.globalAlpha = opacity * landscape.strength
          context.beginPath()
          context.arc(well.x, well.y, radius, 0, Math.PI * 2)
          context.stroke()
        }
      }
    }

    for (let i = 0; i < particles.length; i++) {
      const a = particles[i]
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        if (distance > connectionRadius) continue
        context.globalAlpha = 0.045 * (1 - distance / connectionRadius)
        context.beginPath()
        context.moveTo(a.x, a.y)
        context.lineTo(b.x, b.y)
        context.stroke()
      }
    }

    context.fillStyle = particleColor
    for (const particle of particles) {
      context.globalAlpha = 0.1
      context.beginPath()
      context.arc(particle.x, particle.y, particle.radius + 3.5, 0, Math.PI * 2)
      context.fill()

      context.globalAlpha = 0.82
      context.beginPath()
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
      context.fill()
    }
    context.globalAlpha = 1
  }

  const animate = (time: number) => {
    if (disposed || !visible || motionPreference.matches) {
      frameId = undefined
      return
    }

    const step = Math.min((time - lastTime) / (1000 / 60), 2)
    lastTime = time
    evolve(step)
    draw()
    frameId = requestAnimationFrame(animate)
  }

  const start = () => {
    if (disposed || !visible || motionPreference.matches || frameId !== undefined) return
    lastTime = performance.now()
    frameId = requestAnimationFrame(animate)
  }

  const onPointerMove = (event: PointerEvent) => {
    const bounds = canvas.getBoundingClientRect()
    const x = event.clientX - bounds.left
    const y = event.clientY - bounds.top
    pointer = {
      x,
      y,
      vx: Math.max(-24, Math.min(24, x - (pointer?.x ?? x))),
      vy: Math.max(-24, Math.min(24, y - (pointer?.y ?? y))),
    }
  }
  const onPointerLeave = () => {
    pointer = undefined
  }
  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return
    const bounds = canvas.getBoundingClientRect()
    const x = event.clientX - bounds.left
    const y = event.clientY - bounds.top
    const direction = pointer ? Math.atan2(pointer.vy, pointer.vx) : Math.random() * Math.PI * 2
    const separation = Math.min(30, height * 0.22)
    const margin = 12
    const clampX = (value: number) => Math.max(margin, Math.min(width - margin, value))
    const clampY = (value: number) => Math.max(margin, Math.min(height - margin, value))

    landscape = {
      strength: 1,
      wells: [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((offset) => ({
        x: clampX(x + Math.cos(direction + offset) * separation),
        y: clampY(y + Math.sin(direction + offset) * separation),
      })),
    }
    draw()
    start()
  }
  const onMotionChange = () => {
    if (motionPreference.matches && frameId !== undefined) {
      cancelAnimationFrame(frameId)
      frameId = undefined
      draw()
    } else {
      start()
    }
  }

  const resizeObserver = new ResizeObserver(resize)
  const visibilityObserver = new IntersectionObserver((entries) => {
    visible = entries[0]?.isIntersecting ?? true
    if (visible) {
      start()
    } else if (frameId !== undefined) {
      cancelAnimationFrame(frameId)
      frameId = undefined
    }
  })
  const themeObserver = new MutationObserver(() => {
    updateColors()
    draw()
  })

  canvas.addEventListener("pointermove", onPointerMove)
  canvas.addEventListener("pointerleave", onPointerLeave)
  canvas.addEventListener("pointerdown", onPointerDown)
  motionPreference.addEventListener("change", onMotionChange)
  resizeObserver.observe(canvas)
  visibilityObserver.observe(canvas)
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["saved-theme"],
  })
  resize()
  start()

  disposeParticleSystem = () => {
    disposed = true
    if (frameId !== undefined) cancelAnimationFrame(frameId)
    canvas.removeEventListener("pointermove", onPointerMove)
    canvas.removeEventListener("pointerleave", onPointerLeave)
    canvas.removeEventListener("pointerdown", onPointerDown)
    motionPreference.removeEventListener("change", onMotionChange)
    resizeObserver.disconnect()
    visibilityObserver.disconnect()
    themeObserver.disconnect()
  }
}

document.addEventListener("nav", initializeParticleSystem)
initializeParticleSystem()
