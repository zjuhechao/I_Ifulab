import { createFileRoute } from '@tanstack/react-router';
import { CheckInPage } from '@/pages/check-in';

export const Route = createFileRoute('/check-in')({
  component: CheckInPage,
});
