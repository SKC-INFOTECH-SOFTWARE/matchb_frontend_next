"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Settings, Lock, UserPlus, CreditCard } from "lucide-react"
import AdminPasswordChange from "./AdminPasswordChange"
import AdminAddUser from "./AdminAddUser"
import AdminPlansManagement from "./AdminPlansManagement"

interface AdminSettingsProps {
  userId: number
  onUserAdded?: () => void
}

export default function AdminSettings({ userId, onUserAdded }: AdminSettingsProps) {
  const [activeTab, setActiveTab] = useState("password")

  const tabs = [
    {
      id: "password",
      label: "Change Password",
      shortLabel: "Password",
      icon: Lock,
      component: (
        <div className="max-w-md mx-auto sm:mx-0">
          <AdminPasswordChange userId={userId} />
        </div>
      )
    },
    {
      id: "add-user",
      label: "Add User",
      shortLabel: "Add User",
      icon: UserPlus,
      component: <AdminAddUser onUserAdded={onUserAdded} />
    },
    {
      id: "plans",
      label: "Manage Plans",
      shortLabel: "Plans",
      icon: CreditCard,
      component: <AdminPlansManagement />
    }
  ]

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
            Admin Settings
          </CardTitle>
          <CardDescription className="text-sm">
            Manage admin account, users, and system settings
          </CardDescription>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
          {/* Mobile Tab Navigation - Scrollable Horizontal */}
          <div className="block sm:hidden mb-4">
            <div className="flex overflow-x-auto space-x-1 pb-2 -mx-1">
              {tabs.map((tab) => {
                const IconComponent = tab.icon
                return (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveTab(tab.id)}
                    className="whitespace-nowrap flex-shrink-0 text-xs"
                  >
                    <IconComponent className="h-3 w-3 mr-1" />
                    {tab.shortLabel}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Desktop Tab Navigation - Grid Layout */}
          <div className="hidden sm:block mb-6">
            <div className="grid grid-cols-3 gap-2 p-1 bg-muted rounded-lg">
              {tabs.map((tab) => {
                const IconComponent = tab.icon
                return (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab(tab.id)}
                    className="flex items-center gap-2 justify-center"
                  >
                    <IconComponent className="h-4 w-4" />
                    <span className="hidden md:inline">{tab.label}</span>
                    <span className="md:hidden">{tab.shortLabel}</span>
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="mt-4 sm:mt-6">
            {tabs.find(tab => tab.id === activeTab)?.component}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}