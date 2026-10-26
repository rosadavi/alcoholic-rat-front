import { Beer, Camera, LogOut, ShieldCheck, Store, User } from "lucide-react"

import { useAuth, useSession } from "@/lib/auth"
import { href, type Route } from "@/lib/router"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

const NAV_ITEMS: {
  route: Route
  label: string
  icon: typeof Store
  soon?: boolean
}[] = [
  { route: "feed", label: "Feed", icon: Camera, soon: true },
  { route: "bares", label: "Bares", icon: Store },
]

export function AppSidebar({ route }: { route: Route }) {
  const { logout } = useAuth()
  const { login, role } = useSession()
  const { setOpenMobile } = useSidebar()

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<a href={href("bares")} />}
              onClick={() => setOpenMobile(false)}
            >
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Beer className="size-4" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-heading font-bold">Alcoholic Rat</span>
                <span className="text-xs text-muted-foreground">Online</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.route}>
                  <SidebarMenuButton
                    isActive={route === item.route}
                    tooltip={item.label}
                    render={<a href={href(item.route)} />}
                    onClick={() => setOpenMobile(false)}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                  {item.soon && <SidebarMenuBadge>em breve</SidebarMenuBadge>}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 rounded-lg p-2">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent">
                {role === "ADMIN" ? (
                  <ShieldCheck className="size-4" />
                ) : (
                  <User className="size-4" />
                )}
              </div>
              <div className="flex min-w-0 flex-col leading-tight">
                <span className="truncate text-sm font-medium">{login}</span>
                <span className="text-xs text-muted-foreground">
                  {role === "ADMIN" ? "Administrador" : "Usuário"}
                </span>
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={logout}>
              <LogOut />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
