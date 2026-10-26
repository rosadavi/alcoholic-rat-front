import { useAuth } from "@/lib/auth"
import { useRoute } from "@/lib/router"
import { AppSidebar } from "@/components/app-sidebar"
import { Header } from "@/components/layout/header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AuthPage } from "@/pages/auth-page"
import { BarsPage } from "@/pages/bars-page"
import { FeedPage } from "@/pages/feed-page"

export function App() {
  const { session } = useAuth()
  const route = useRoute()

  if (!session) return <AuthPage />

  return (
    <SidebarProvider>
      <AppSidebar route={route} />
      <SidebarInset>
        <Header fixed />
        {route === "feed" ? <FeedPage /> : <BarsPage />}
      </SidebarInset>
    </SidebarProvider>
  )
}
