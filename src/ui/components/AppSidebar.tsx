import { Crown, Frame, Home, Layers, Settings, Shirt, Smile } from 'lucide-react'
import logo from 'public/logo.webp'
import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { BackupRestoreDialog } from './BackupRestoreDialog'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from './ui/sidebar'

export function AppSidebar() {
  const location = useLocation()
  const { projectId } = useParams()
  const [isBackupOpen, setIsBackupOpen] = useState(false)

  // Project specific items
  const projectItems = projectId ? [
    {
      title: 'Characters',
      url: `/projects/${projectId}/characters`,
      icon: Crown,
    },
    {
      title: 'Equipments',
      url: `/projects/${projectId}/equipments`,
      icon: Shirt,
    },
    {
      title: 'Poses',
      url: `/projects/${projectId}/poses`,
      icon: Frame,
    },
    {
      title: 'Expressions',
      url: `/projects/${projectId}/expressions`,
      icon: Smile,
    },
    {
      title: 'Categories',
      url: `/projects/${projectId}/categories`,
      icon: Layers,
    },
  ] : []

  const globalItems = [
    {
      title: 'Settings',
      url: '/settings',
      icon: Settings,
    }
  ]

  return (
    <>
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem className="mb-3">
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === '/'}
                    className="flex h-auto flex-col items-center gap-1 py-3"
                  >
                    <Link to="/" className="flex flex-col items-center justify-center">
                      <Home className="!h-6 !w-6 mb-1" />
                      <span className="text-xs font-medium">Home</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                {projectItems.map((item) => (
                  <SidebarMenuItem key={item.title} className="mb-3">
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname.startsWith(item.url)}
                      className="flex h-auto flex-col items-center gap-1 py-3"
                    >
                      <Link to={item.url} className="flex flex-col items-center justify-center">
                        <item.icon className="!h-6 !w-6 mb-1" />
                        <span className="text-xs font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}

                {globalItems.map((item) => (
                  <SidebarMenuItem key={item.title} className="mb-3 mt-4">
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.url}
                      className="flex h-auto flex-col items-center gap-1 py-3"
                    >
                      <Link to={item.url} className="flex flex-col items-center justify-center">
                        <item.icon className="!h-6 !w-6 mb-1 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div className="w-full flex items-center justify-center mb-3">
            <button
              onClick={() => setIsBackupOpen(true)}
              className="hover:scale-110 transition-transform cursor-pointer focus:outline-none"
              title="Backup & Restore"
            >
              <img src={logo} alt="Logo" className="w-14 h-14 rotate-10" />
            </button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <BackupRestoreDialog open={isBackupOpen} onOpenChange={setIsBackupOpen} />
    </>
  )
}
