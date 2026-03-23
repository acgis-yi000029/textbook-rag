import AppLayout from '@/features/layout/AppLayout'

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout>
      {children}
    </AppLayout>
  )
}

