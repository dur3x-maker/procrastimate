export interface AchievementMeta {
  id: string;
  titleKey: string;
  descriptionKey: string;
  category: "productivity" | "balance" | "absurd";
  legendary: boolean;
  hidden?: boolean;
}

export const achievements: AchievementMeta[] = [
  {
    id: "focus_5",
    titleKey: "achievements.focus_5.title",
    descriptionKey: "achievements.focus_5.description",
    category: "productivity",
    legendary: false,
  },
  {
    id: "focus_25",
    titleKey: "achievements.focus_25.title",
    descriptionKey: "achievements.focus_25.description",
    category: "productivity",
    legendary: false,
  },
  {
    id: "focus_100",
    titleKey: "achievements.focus_100.title",
    descriptionKey: "achievements.focus_100.description",
    category: "productivity",
    legendary: true,
  },
  {
    id: "ignore_break_10",
    titleKey: "achievements.ignore_break_10.title",
    descriptionKey: "achievements.ignore_break_10.description",
    category: "absurd",
    legendary: false,
  },
  {
    id: "ghost_mode_5",
    titleKey: "achievements.ghost_mode_5.title",
    descriptionKey: "achievements.ghost_mode_5.description",
    category: "balance",
    legendary: false,
  },
  {
    id: "early_finish_10",
    titleKey: "achievements.early_finish_10.title",
    descriptionKey: "achievements.early_finish_10.description",
    category: "productivity",
    legendary: false,
  },
  {
    id: "streak_7",
    titleKey: "achievements.streak_7.title",
    descriptionKey: "achievements.streak_7.description",
    category: "productivity",
    legendary: false,
  },
  {
    id: "streak_30",
    titleKey: "achievements.streak_30.title",
    descriptionKey: "achievements.streak_30.description",
    category: "productivity",
    legendary: true,
  },
  {
    id: "night_owl",
    titleKey: "achievements.night_owl.title",
    descriptionKey: "achievements.night_owl.description",
    category: "absurd",
    legendary: false,
    hidden: true,
  },
  {
    id: "marathon",
    titleKey: "achievements.marathon.title",
    descriptionKey: "achievements.marathon.description",
    category: "absurd",
    legendary: true,
    hidden: true,
  },
];
