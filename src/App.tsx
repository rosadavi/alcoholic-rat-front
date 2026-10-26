import type * as React from "react"

import { useAuth } from "@/lib/auth"
import { useRoute, type Route } from "@/lib/router"
import { AppSidebar } from "@/components/app-sidebar"
import { Header } from "@/components/layout/header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AuthPage } from "@/pages/auth-page"
import { BarsPage } from "@/pages/bars-page"
import { DrinksPage } from "@/pages/drinks-page"
import { FeedPage } from "@/pages/feed-page"
import { NewPostPage } from "@/pages/new-post-page"

const PAGES: Record<Route, () => React.ReactNode> = {
  bares: BarsPage,
  bebidas: DrinksPage,
  publicar: NewPostPage,
  feed: FeedPage,
}

export function App() {
  const { session } = useAuth()
  const route = useRoute()

  if (!session) return <AuthPage />

  const Page = PAGES[route]

  return (
    <SidebarProvider>
      <AppSidebar route={route} />
      <SidebarInset>
        <Header fixed />
        <Page key={route} />
      </SidebarInset>
    </SidebarProvider>
  )
}
