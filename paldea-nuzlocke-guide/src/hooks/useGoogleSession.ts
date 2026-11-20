import { useSyncExternalStore } from 'react';
import { isSignedIn, subscribeToGoogleSession } from '../storage/google-auth';

// Whether the user is signed in to Google; false shortly before access lapses.
export function useGoogleSession(): boolean {
    return useSyncExternalStore(
        subscribeToGoogleSession,
        isSignedIn,
        isSignedIn,
    );
}
