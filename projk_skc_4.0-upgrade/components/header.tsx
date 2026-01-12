"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useAuth } from "@/components/auth-provider"
import { User, LogOut, Menu, X } from "lucide-react"
import { useState } from "react"

export function Header() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(path)
  }

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/plans', label: 'Plans' },
    { href: '/contact', label: 'Contact' },
  ]

  const handleLinkClick = () => {
    setIsOpen(false)
  }

  const handleLogout = () => {
    logout()
    setIsOpen(false)
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <Image 
              src="/matchb-logo.png" 
              alt="MatchB" 
              width={120} 
              height={40} 
              className="h-10 w-auto" 
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link 
                key={link.href}
                href={link.href} 
                className={`text-gray-600 hover:text-rose-600 transition-colors font-medium relative ${
                  isActive(link.href) ? 'text-rose-600' : ''
                }`}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute -bottom-[21px] left-0 right-0 h-0.5 bg-rose-600"></span>
                )}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link href={user.role === 'admin' ? '/admin' : '/dashboard'}>
                  <Button variant="ghost" className="text-gray-600 hover:text-rose-600 hover:bg-rose-50">
                    <User className="w-4 h-4 mr-2" />
                    {user.role === 'admin' ? 'Admin Panel' : 'Dashboard'}
                  </Button>
                </Link>
                <Button 
                  onClick={logout}
                  variant="ghost" 
                  className="text-gray-600 hover:text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login/user">
                  <Button variant="ghost" className="text-gray-600 hover:text-rose-600 hover:bg-rose-50">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-rose-600 hover:bg-rose-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                    Join Now
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-gray-600 hover:text-rose-600 hover:bg-rose-50"
                >
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle className="text-left">
                    <Image 
                      src="/matchb-logo.png" 
                      alt="MatchB" 
                      width={120} 
                      height={40} 
                      className="h-10 w-auto" 
                    />
                  </SheetTitle>
                </SheetHeader>
                
                <div className="flex flex-col space-y-4 mt-6">
                  {/* Navigation Links */}
                  <nav className="flex flex-col space-y-3">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={handleLinkClick}
                        className={`flex items-center px-3 py-2 text-base font-medium rounded-md transition-colors ${
                          isActive(link.href)
                            ? 'text-rose-600 bg-rose-50 border-l-4 border-rose-600'
                            : 'text-gray-600 hover:text-rose-600 hover:bg-rose-50'
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </nav>

                  {/* Mobile Auth Section */}
                  <div className="pt-4 border-t border-gray-200">
                    {user ? (
                      <div className="flex flex-col space-y-3">
                        <Link 
                          href={user.role === 'admin' ? '/admin' : '/dashboard'}
                          onClick={handleLinkClick}
                        >
                          <Button 
                            variant="outline" 
                            className="w-full justify-start text-gray-600 hover:text-rose-600 hover:bg-rose-50 border-gray-200"
                          >
                            <User className="w-4 h-4 mr-2" />
                            {user.role === 'admin' ? 'Admin Panel' : 'Dashboard'}
                          </Button>
                        </Link>
                        <Button 
                          onClick={handleLogout}
                          variant="outline" 
                          className="w-full justify-start text-gray-600 hover:text-red-600 hover:bg-red-50 border-gray-200"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Logout
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col space-y-3">
                        <Link href="/login/user" onClick={handleLinkClick}>
                          <Button 
                            variant="outline" 
                            className="w-full text-gray-600 hover:text-rose-600 hover:bg-rose-50 border-gray-200"
                          >
                            Sign In
                          </Button>
                        </Link>
                        <Link href="/register" onClick={handleLinkClick}>
                          <Button className="w-full bg-rose-600 hover:bg-rose-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                            Join Now
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* User Info (if authenticated) */}
                  {user && (
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center space-x-3 px-3 py-2 bg-gray-50 rounded-md">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-rose-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user.name || user.email}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {user.role === 'admin' ? 'Administrator' : 'Member'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}