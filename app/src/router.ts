export type ActiveView =
    | { view: 'home' }
    | { view: 'game'; gameRunId: string }
    | { view: 'about' };
