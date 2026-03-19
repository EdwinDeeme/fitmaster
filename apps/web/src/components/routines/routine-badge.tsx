import {
  DifficultyLevel,
  GoalType,
  DIFFICULTY_LABELS,
  GOAL_LABELS,
} from '@/types/routines';

const DIFFICULTY_DOT: Record<DifficultyLevel, string> = {
  BEGINNER:     'bg-emerald-400',
  INTERMEDIATE: 'bg-amber-400',
  ADVANCED:     'bg-rose-400',
};

const GOAL_DOT: Record<GoalType, string> = {
  WEIGHT_LOSS: 'bg-sky-400',
  MUSCLE_GAIN: 'bg-violet-400',
  MAINTENANCE: 'bg-gray-400',
  STRENGTH:    'bg-orange-400',
  ENDURANCE:   'bg-teal-400',
};

function Chip({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-gray-50 border border-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
      {label}
    </span>
  );
}

export function DifficultyBadge({ difficulty }: { difficulty: DifficultyLevel }) {
  return <Chip dot={DIFFICULTY_DOT[difficulty]} label={DIFFICULTY_LABELS[difficulty]} />;
}

export function GoalBadge({ goal }: { goal: GoalType }) {
  return <Chip dot={GOAL_DOT[goal]} label={GOAL_LABELS[goal]} />;
}
