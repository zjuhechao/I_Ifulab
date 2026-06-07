import { createFileRoute } from '@tanstack/react-router'
import { MyProductsPage } from '@/pages/my-products'

export const Route = createFileRoute('/my-products')({
  component: MyProductsPage,
})
