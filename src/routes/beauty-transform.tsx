import { createFileRoute } from '@tanstack/react-router';
import { BeautyTransformPage } from '@/pages/beauty-transform';

export const Route = createFileRoute('/beauty-transform')({
  component: BeautyTransformPage,
});
