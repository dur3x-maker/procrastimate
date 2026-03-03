export type AchievementCategory =
  | "productivity"
  | "laziness"
  | "balance"
  | "absurd";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  target: number;
  legendary?: boolean;
  hidden?: boolean;
}

export const achievements: Achievement[] = [
  {
    id: "focus_5",
    title: "First Steps",
    description: "Complete 5 focus sessions",
    category: "productivity",
    target: 5,
  },
  {
    id: "focus_25",
    title: "Focused Mind",
    description: "Complete 25 focus sessions",
    category: "productivity",
    target: 25,
  },
  {
    id: "focus_100",
    title: "Focus Master",
    description: "Complete 100 focus sessions",
    category: "productivity",
    target: 100,
    legendary: true,
  },
  {
    id: "ignore_break_10",
    title: "Break Skipper",
    description: "Ignore 10 recommended breaks",
    category: "productivity",
    target: 10,
  },
  {
    id: "ignore_break_50",
    title: "Unstoppable",
    description: "Ignore 50 recommended breaks",
    category: "productivity",
    target: 50,
    legendary: true,
  },
  {
    id: "absurd_180",
    title: "Beyond Human",
    description: "Work 180+ minutes in absurd mode",
    category: "absurd",
    target: 180,
    legendary: true,
  },
  {
    id: "absurd_10_sessions",
    title: "Machine Mode",
    description: "Complete 10 sessions without breaks",
    category: "absurd",
    target: 10,
    legendary: true,
  },
  {
    id: "idle_3_days",
    title: "Professional Procrastinator",
    description: "Stay idle for 3 consecutive days",
    category: "laziness",
    target: 3,
    hidden: true,
  },
  {
    id: "idle_7_days",
    title: "Zen Master",
    description: "Stay idle for 7 consecutive days",
    category: "laziness",
    target: 7,
    hidden: true,
    legendary: true,
  },
  {
    id: "balance_perfect_week",
    title: "Balanced Life",
    description: "Maintain perfect work-break balance for 7 days",
    category: "balance",
    target: 7,
  },
  {
    id: "balance_50_breaks",
    title: "Break Enthusiast",
    description: "Take 50 breaks",
    category: "balance",
    target: 50,
  },
  {
    id: "complete_100_tasks",
    title: "Task Crusher",
    description: "Complete 100 tasks",
    category: "productivity",
    target: 100,
  },
  {
    id: "complete_500_tasks",
    title: "Productivity Legend",
    description: "Complete 500 tasks",
    category: "productivity",
    target: 500,
    legendary: true,
  },
  {
    id: "early_bird",
    title: "Early Bird",
    description: "Start 10 sessions before 7 AM",
    category: "productivity",
    target: 10,
    hidden: true,
  },
  {
    id: "night_owl",
    title: "Night Owl",
    description: "Work 20 sessions after 10 PM",
    category: "absurd",
    target: 20,
    hidden: true,
  },
  {
    id: "streak_3_days",
    title: "Consistency Starter",
    description: "Maintain a 3-day usage streak",
    category: "absurd",
    target: 3,
  },
  {
    id: "streak_7_days",
    title: "Week Warrior",
    description: "Maintain a 7-day usage streak",
    category: "absurd",
    target: 7,
  },
  {
    id: "streak_30_days",
    title: "Unstoppable Force",
    description: "Maintain a 30-day usage streak",
    category: "absurd",
    target: 30,
    legendary: true,
  },
  {
    id: "comeback_7_days",
    title: "Back From The Void",
    description: "Returned after 7+ days of absence",
    category: "absurd",
    target: 1,
    hidden: true,
  },
  {
    id: "relapse_break_streak",
    title: "Streak Destroyer",
    description: "Lost a streak of 7+ days",
    category: "laziness",
    target: 1,
    hidden: true,
  },
  {
    id: "ghost_mode_5",
    title: "Ghost Mode",
    description: "Opened app 5 times without doing anything",
    category: "laziness",
    target: 5,
    hidden: true,
  },
];
