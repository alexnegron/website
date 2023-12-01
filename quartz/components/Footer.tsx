import { QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/footer.scss"
import { version } from "../../package.json"

interface Options {
  links: Record<string, string>
  icons: Record<string, string>
}

export default ((opts?: Options) => {
  function Footer({ displayClass }: QuartzComponentProps) {
    const year = new Date().getFullYear()
    const links = opts?.links ?? []
    const icons = opts?.icons ?? []
    return (
      <footer class={`${displayClass ?? ""}`}>
        <hr />
        <p>
          {/* Created with <a href="https://quartz.jzhao.xyz/">Quartz v{version}</a>, © {year} */}
        </p>
        <ul>
          {Object.entries(links).map(([text, link]) => (
            <li>
              <a href={link} title={text}>
                <img src={(icons as Record<string, string>)[text]} className="footer-icon" />
              </a>
            </li>
          ))}
        </ul>
      </footer>
    )
  }

  Footer.css = style
  return Footer
}) satisfies QuartzComponentConstructor
