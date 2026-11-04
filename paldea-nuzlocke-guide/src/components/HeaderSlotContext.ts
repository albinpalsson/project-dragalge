import { createContext } from 'react';

// Separate from HeaderSlot so main-bundle code can provide the slot without
// importing react-dom, which only the Game view's portal needs.
export const HeaderSlotContext = createContext<HTMLElement | null>(null);
