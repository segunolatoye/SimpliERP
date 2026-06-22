"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black">
      {/* Top Navigation */}
      <header className={`border-b border-gray-200 dark:border-white/10 ${isLoginPage ? "w-full" : ""}`}>
        <div className={`flex items-center justify-between py-4 ${isLoginPage ? "px-6" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full"}`}>
          <Link href="/" className="flex items-center">
            <Image src="/logos/simpliERP-dark.png" alt="SimpliERP Logo" width={120} height={33} className="hidden dark:block" />
            <Image src="/logos/simpliERP-light.png" alt="SimpliERP Logo" width={120} height={33} className="block dark:hidden" />
          </Link>
          <div className="flex items-center text-sm">
            {isLoginPage ? (
              <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
                <Link 
                  href="/signup" 
                  className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black font-medium rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-sm"
                >
                  Sign Up
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
                <Link 
                  href="/login" 
                  className="px-4 py-2 border border-gray-300 text-black dark:border-white/20 dark:text-white font-medium rounded-md hover:bg-gray-50 dark:hover:bg-white/5 transition-colors shadow-sm"
                >
                  Log In
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>
    </div>
  );
}
