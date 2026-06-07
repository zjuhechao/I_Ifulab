import { createFileRoute } from '@tanstack/react-router';
import { TrackingPage } from '@/pages/tracking';

export const Route = createFileRoute('/tracking')({
  component: TrackingPage,
});
