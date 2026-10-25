export type ActiveView =
    | { view: 'home' }
    | { view: 'game'; gameName: string }
    | { view: 'about' }
    | { view: 'licenses' };
