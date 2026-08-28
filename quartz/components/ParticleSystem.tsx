import { QuartzComponentConstructor } from "./types"
// @ts-ignore
import script from "./scripts/particleSystem.inline"
import style from "./styles/particleSystem.scss"

function ParticleSystem() {
  return null
}

ParticleSystem.afterDOMLoaded = script
ParticleSystem.css = style

export default (() => ParticleSystem) satisfies QuartzComponentConstructor
