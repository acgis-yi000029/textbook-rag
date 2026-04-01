'use client'

import { PipelineDashboard } from '@/features/engine/ingestion'

export default function Page() {
  return (
    <div className="h-[calc(100vh-3.5rem)]">
      <PipelineDashboard />
    </div>
  )
}
