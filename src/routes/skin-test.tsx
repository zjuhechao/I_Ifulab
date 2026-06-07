import { createFileRoute } from '@tanstack/react-router';
import { SkinTestPage } from '@/pages/skin-test';

export const Route = createFileRoute('/skin-test')({
  component: SkinTestPage,
});
