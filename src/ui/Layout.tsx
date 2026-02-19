import { Github } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import { AppSidebar } from './components/AppSidebar'
import { Separator } from './components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from './components/ui/sidebar'

export default function Layout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 justify-between sticky top-0 z-10 bg-background">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <span className="font-black tracking-wider text-lg">Forgery</span>
          </div>
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Github className="h-5 w-5" />
          </a>
        </header>
        <main className="flex flex-1 flex-col gap-4 px-4">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
