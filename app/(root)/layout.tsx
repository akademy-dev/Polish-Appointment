'use client'
import Navbar from "@/components/Navbar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { usePathname } from "next/navigation";

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
               <Navbar value={value} />
               {children}
            </main>
         )}
      </>
   );
}