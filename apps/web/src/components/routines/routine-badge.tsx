import { Badge } from '@/components/ui/badge';
import {
  DifficultyLevel,
  GoalType,
  DIFFICULTY_LABELS,
  DIFFICULTY_COLORS,
  GOAL_LABELS,
  GOAL_COLORS,
} from '@/types/routines';

interface DifficultyBadgeProps {
  difficulty: DifficultyLevel;
}

export function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  return (
    <Badge className={DIFFICULTY_COLORS[difficulty]}>
      {DIFFICULTY_LABELS[difficulty]}
    </Badge>
  );
}

interface GoalBadgeProps {
  goal: GoalType;
}

export function GoalBadge({ goal }: GoalBadgeProps) {
  return (
    <Badge className={GOAL_COLORS[goal]}>
      {GOAL_LABELS[goal]}
    </Badge>
  );
}
