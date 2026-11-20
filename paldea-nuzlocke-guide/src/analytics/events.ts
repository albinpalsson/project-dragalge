export type AnalyticsEvent =
    | { name: 'page_view'; view: string }
    | {
          name: 'game_created';
          variant: string;
          randomizerMode: string;
      }
    // The first game created in a Google Drive that had no games yet.
    | { name: 'first_cloud_game' }
    | {
          name: 'progression_milestone';
          milestone: string;
          outcome?: string;
      };