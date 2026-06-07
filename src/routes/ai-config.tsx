import { createFileRoute } from '@tanstack/react-router';
import { AIConfigPage } from '@/pages/ai-config';

export const Route = createFileRoute('/ai-config')({
  component: AIConfigPage,
});
