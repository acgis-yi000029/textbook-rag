'use client'

import ComingSoon from '@/features/shared/components/ComingSoon'
import { FileText } from 'lucide-react'

export default function Page() {
  return (
    <ComingSoon
      title="Prompt 管理"
      description="编辑 / 测试 Prompt 模板"
      icon={FileText}
      iconColor="text-rose-400"
    />
  )
}
