import { type ReactNode } from "react";
import { Sidebar, TopNav, MobileNav } from "./AppNav";

export function AppShell({ children, rightRail }: { children: ReactNode; rightRail?: ReactNode }) {
  return (
    <div className="min-h-dvh flex bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopNav />
        <div className="flex-1 flex">
          <main className="flex-1 min-w-0 px-3 sm:px-5 lg:px-8 pt-4 pb-24 md:pb-10">
            <div className="mx-auto w-full max-w-2xl">{children}</div>
          </main>
          {rightRail && (
            <aside className="hidden xl:block w-[340px] shrink-0 border-l p-5 sticky top-14 h-[calc(100dvh-3.5rem)] overflow-y-auto scrollbar-thin">
              {rightRail}
            </aside>
          )}
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
