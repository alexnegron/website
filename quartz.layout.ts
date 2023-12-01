import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// components shared across all pages
// import githubLogo from 'content/github-mark.svg';
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  // header: [Component.LinksHeader()],
  header: [],
  footer: Component.Footer({
    links: {
      GitHub: "https://github.com/alexnegron",
      GoogleScholar: "https://scholar.google.com/citations?user=FOMHR0UAAAAJ&hl=en",
      X: "https://x.com/algomage",
    },
    icons: {
      GitHub: "https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/github.svg",
      GoogleScholar: "https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/googlescholar.svg",
      X: "https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/x.svg",
    }
  }),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.Breadcrumbs(),
    Component.ArticleTitle(),
    Component.TagList(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Search(), 
    Component.Darkmode(),
  ],
  right: [
    Component.Explorer(),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [
    Component.Breadcrumbs(),
    Component.ArticleTitle(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Search(), 
    Component.Darkmode(),
  ],
  right: [
  ],
}
