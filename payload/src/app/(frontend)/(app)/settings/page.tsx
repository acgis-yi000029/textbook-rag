'use client'

import ComingSoon from '@/features/shared/components/ComingSoon'
import { Settings } from 'lucide-react'

export default function Page() {
  return (
    <ComingSoon
      title="设置"
      description="用户偏好、模型配置、API 密钥管理"
      icon={Settings}
      iconColor="text-muted-foreground"
    />
  )
}
