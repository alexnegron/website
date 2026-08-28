import type { QuartzComponent, QuartzComponentConstructor } from "@quartz-community/types"
import style from "./styles/particleSystem.scss"
// @ts-expect-error - the plugin build transpiles inline scripts into browser-ready strings
import script from "./scripts/particleSystem.inline.ts"

const ParticleSystem: QuartzComponentConstructor = () => {
  const Component: QuartzComponent = () => null
  Component.css = style
  Component.afterDOMLoaded = script
  return Component
}

export default ParticleSystem
