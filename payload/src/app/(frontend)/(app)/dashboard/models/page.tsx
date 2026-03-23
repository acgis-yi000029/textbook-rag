'use client'

import ComingSoon from '@/features/shared/components/ComingSoon'
import { Brain } from 'lucide-react'

export default function Page() {
  return (
    <ComingSoon
      title="模型管理"
      description="查看 / 拉取 / 删除 Ollama 模型"
      icon={Brain}
      iconColor="text-purple-400"
    />
  )
}
