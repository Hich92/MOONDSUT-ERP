'use client'

import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar }  from './AppSidebar'
import { TaskBell }    from './TaskBell'
import { Separator }   from '@/components/ui/separator'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ChatWidget }  from '@/components/chat/ChatWidget'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={400}>
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-4" />
          </div>
          <div className="ml-auto flex items-center gap-1">
            <TaskBell />
          </div>
        </header>
        <div className="flex flex-1 flex-col">
          {children}
        </div>
      </SidebarInset>
      <ChatWidget />
    </SidebarProvider>
    </TooltipProvider>
  )
}
