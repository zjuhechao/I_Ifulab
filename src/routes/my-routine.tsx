import { createFileRoute } from '@tanstack/react-router'
import { MyRoutinePage } from '@/pages/my-routine'

export const Route = createFileRoute('/my-routine')({
  component: MyRoutinePage,
})
