import AuthGuard from '@/components/AuthGuard'
import Sidebar from '@/components/dashboard/Sidebar'
import { UserProvider } from '@/contexts/UserContext'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <UserProvider>
        <div className="min-h-screen bg-bg-deep flex">
          <Sidebar />
          <main className="flex-1 lg:ml-56 min-h-screen">
            <div className="page-enter p-6 lg:p-8 max-w-5xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </UserProvider>
    </AuthGuard>
  )
}
