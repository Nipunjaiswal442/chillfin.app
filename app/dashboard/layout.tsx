import AuthGuard from '@/components/AuthGuard'
import Sidebar from '@/components/dashboard/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-bg-deep flex">
        <Sidebar />
        <main className="flex-1 lg:ml-56 min-h-screen">
          <div className="page-enter p-6 lg:p-8 max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
