"use client";
import Navbar from "@/components/Navbar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { usePathname } from "next/navigation";
import SearchForm from "@/components/SearchForm";
import CreateInfoButton from "@/components/CreateInfoButton";

export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const value = pathname.split("/")[1] || "schedule";

  const isRoot = pathname === "/";

  return (
    <>
      {isRoot ? (
        <SidebarProvider>
          <AppSidebar />
          <SidebarTrigger />
          <main className="font-lexend p-4 w-full h-screen overflow-hidden">
               <Navbar value={value} />
               <div className="w-full h-[calc(100vh-6rem)]">
                  {children}
               </div>
            </main>
        </SidebarProvider>
      ) : (
        <main className="font-lexend p-4">
          <header className="mb-5 w-full space-y-4 lg:space-y-0">
            <div className="flex items-center justify-between">
              <Navbar value={value} />
              <div className="hidden lg:flex items-center gap-4">
                <div className="w-80">
                  <SearchForm />
                </div>
                <CreateInfoButton type={value} />
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:hidden sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1 sm:max-w-md">
                <SearchForm />
              </div>
              <CreateInfoButton type={value} />
            </div>
          </header>

          {children}
        </main>
      )}
    </>
  );
}
