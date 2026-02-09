import { Backpack, Settings, Users } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from './ui/sidebar'

// Menu items.
const items = [
  {
    title: 'Characters',
    url: '/characters',
    icon: Users,
  },
  {
    title: 'Equipments',
    url: '/equipments',
    icon: Backpack,
  },
  {
    title: 'Settings',
    url: '/settings',
    icon: Settings,
  },
]

export function AppSidebar() {
  const location = useLocation()

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title} className="mb-3">
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    className="flex h-auto flex-col items-center gap-1 py-3"
                  >
                    <Link to={item.url} className="flex flex-col items-center justify-center">
                      <item.icon className="!h-6 !w-6 mb-1" />
                      <span className="text-xs font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
