import { Backpack, Frame, Settings, Smile, Users } from 'lucide-react'
import logo from 'public/logo.webp'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
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
    title: 'Poses',
    url: '/poses',
    icon: Frame,
  },
  {
    title: 'Expressions',
    url: '/expressions',
    icon: Smile,
  },
  {
    title: 'Settings',
    url: '/settings',
    icon: Settings,
  },
]

export function AppSidebar() {
  const location = useLocation()
  const [isBackupOpen, setIsBackupOpen] = useState(false)

  return (
    <>
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
