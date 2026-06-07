import { createFileRoute } from '@tanstack/react-router';
import { QuestionnairePage } from '@/pages/questionnaire';

export const Route = createFileRoute('/questionnaire')({
  component: QuestionnairePage,
});
