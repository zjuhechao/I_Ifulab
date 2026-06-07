import { createFileRoute } from '@tanstack/react-router';
import { PriceComparePage } from '@/pages/price-compare';

export const Route = createFileRoute('/price-compare')({
  component: PriceComparePage,
});
