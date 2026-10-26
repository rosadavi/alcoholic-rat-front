import * as React from "react"

export type Route = "bares" | "bebidas" | "publicar" | "feed"

const ROUTES: Route[] = ["bares", "bebidas", "publicar", "feed"]
const DEFAULT_ROUTE: Route = "bares"

function readHash(): Route {
  const hash = window.location.hash.replace(/^#\/?/, "") as Route
  return ROUTES.includes(hash) ? hash : DEFAULT_ROUTE
}

export function useRoute() {
  const [route, setRoute] = React.useState<Route>(readHash)

  React.useEffect(() => {
    const handleChange = () => setRoute(readHash())
    window.addEventListener("hashchange", handleChange)
    return () => window.removeEventListener("hashchange", handleChange)
  }, [])

  return route
}

export function href(route: Route) {
  return `#/${route}`
}
