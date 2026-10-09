export type AnalyticsEvent =
    | { name: 'page_view'; view: string }
    | {
          name: 'game_created';
          variant: string;
          randomizerMode: string;
      }
    | {
          name: 'progression_milestone';
          milestone: string;
          outcome?: string;
      };