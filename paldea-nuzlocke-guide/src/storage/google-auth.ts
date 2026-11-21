import { GOOGLE_CLIENT_ID } from './config';

// Only the app's own hidden folder in the user's Drive: other Drive files are
// neither visible to nor writable by this app.
const SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const GIS_URL = 'https://accounts.google.com/gsi/client';
const TOKEN_KEY = 'paldea-nuzlocke-guide:google-token';
// Signed out this long before Google's access really lapses, so a save that is
// already under way can finish.
const SIGN_OUT_MARGIN_MS = 120_000;
// A request is only sent with a token that is good for at least this long.
const REQUEST_MARGIN_MS = 10_000;

// Google rejected the access token: nothing more can be done without a new one.
export class GoogleAuthError extends Error {
    constructor(message = 'Sign in to Google to continue.') {
        super(message);
        this.name = 'GoogleAuthError';
    }
}

interface TokenResponse {
    access_token?: string;
    expires_in?: number | string;
    error?: string;
    error_description?: string;
}

interface TokenRequestOptions {
    prompt?: string;
    login_hint?: string;
}

interface TokenClient {
    requestAccessToken(overrides?: TokenRequestOptions): void;
}

interface GoogleOauth2 {
    initTokenClient(config: {
        client_id: string;
        scope: string;
        callback: (response: TokenResponse) => void;
        error_callback: (error: { type: string; message?: string }) => void;
    }): TokenClient;
    hasGrantedAllScopes(response: TokenResponse, ...scopes: string[]): boolean;
}

declare global {
    interface Window {
        google?: { accounts: { oauth2: GoogleOauth2 } };
    }
}

interface StoredToken {
    token: string;
    expiresAt: number;
}

let memoryToken: StoredToken | undefined;
let gisPromise: Promise<GoogleOauth2> | undefined;
let tokenClient: TokenClient | undefined;
let pendingToken:
    | { resolve: () => void; reject: (error: Error) => void }
    | undefined;
let expiryTimer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

function readStoredToken(): StoredToken | undefined {
    if (memoryToken) {
        return memoryToken;
    }
    try {
        const raw = window.sessionStorage.getItem(TOKEN_KEY);
        return raw ? (JSON.parse(raw) as StoredToken) : undefined;
    } catch {
        return undefined;
    }
}

function signedInNow(): boolean {
    const stored = readStoredToken();
    return stored !== undefined && stored.expiresAt - SIGN_OUT_MARGIN_MS > Date.now();
}

// Whether the user counts as signed in. Turns false shortly before the access
// token lapses, which is when the app asks them to sign in again.
let signedIn = signedInNow();

function update(): void {
    clearTimeout(expiryTimer);
    const stored = readStoredToken();
    if (stored) {
        const remaining = stored.expiresAt - SIGN_OUT_MARGIN_MS - Date.now();
        if (remaining > 0) {
            expiryTimer = setTimeout(update, remaining + 50);
        }
    }
    const next = signedInNow();
    if (next !== signedIn) {
        signedIn = next;
        for (const listener of listeners) {
            listener();
        }
    }
}

// Timers do not run while a laptop sleeps, so check again on return.
document.addEventListener('visibilitychange', update);
// A token kept from before a reload needs its sign-out timer too.
update();

export function isSignedIn(): boolean {
    return signedIn;
}

export function subscribeToGoogleSession(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

// Resolves at once when signed in, otherwise after the next sign-in. Reading
// or saving games waits on this, so a lapsed login pauses work instead of
// failing it.
export function whenSignedIn(): Promise<void> {
    if (signedIn) {
        return Promise.resolve();
    }
    return new Promise((resolve) => {
        const stop = subscribeToGoogleSession(() => {
            if (signedIn) {
                stop();
                resolve();
            }
        });
    });
}

// The access token to send with a request, if it is still good.
export function getGoogleToken(): string | undefined {
    const stored = readStoredToken();
    return stored && stored.expiresAt - REQUEST_MARGIN_MS > Date.now()
        ? stored.token
        : undefined;
}

function storeToken(stored: StoredToken): void {
    memoryToken = stored;
    try {
        // Survives a reload of this tab, never other tabs or later sessions.
        window.sessionStorage.setItem(TOKEN_KEY, JSON.stringify(stored));
    } catch {
        // The in-memory copy is enough.
    }
    update();
}

export function clearGoogleToken(): void {
    memoryToken = undefined;
    try {
        window.sessionStorage.removeItem(TOKEN_KEY);
    } catch {
        // Nothing stored.
    }
    update();
}

// Load Google's sign-in script ahead of time. A popup is only allowed from a
// click handler, so by the time the user clicks Sign in it must already be here.
export function preloadGoogleSignIn(): Promise<GoogleOauth2> {
    if (!gisPromise) {
        gisPromise = new Promise<GoogleOauth2>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = GIS_URL;
            script.async = true;
            script.onload = () => {
                const oauth2 = window.google?.accounts.oauth2;
                if (oauth2) {
                    resolve(oauth2);
                } else {
                    reject(new Error('Google sign-in did not load.'));
                }
            };
            script.onerror = () =>
                reject(new Error('Google sign-in could not be loaded.'));
            document.head.appendChild(script);
        });
        // A failed load can be retried.
        gisPromise.catch(() => {
            gisPromise = undefined;
        });
    }
    return gisPromise;
}

// Opens Google's sign-in popup. Call from a click handler.
//   email:         the account to continue as; Google skips its account chooser.
//   chooseAccount: always show the account chooser.
export async function signInToGoogle({
    email,
    chooseAccount = false,
}: { email?: string; chooseAccount?: boolean } = {}): Promise<void> {
    const oauth2 = await preloadGoogleSignIn();
    tokenClient ??= oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPE,
        callback: (response) => {
            const pending = pendingToken;
            pendingToken = undefined;
            if (!pending) {
                return;
            }
            if (!response.access_token || response.error) {
                pending.reject(
                    new Error(
                        response.error_description ??
                            'Google sign-in was not completed.',
                    ),
                );
            } else if (!oauth2.hasGrantedAllScopes(response, SCOPE)) {
                // Google lets users untick the permission on the consent screen.
                pending.reject(
                    new Error(
                        'Allow access to the app data folder to store your games in Google Drive.',
                    ),
                );
            } else {
                storeToken({
                    token: response.access_token,
                    expiresAt:
                        Date.now() + Number(response.expires_in ?? 3600) * 1000,
                });
                pending.resolve();
            }
        },
        error_callback: (error) => {
            const pending = pendingToken;
            pendingToken = undefined;
            pending?.reject(new Error(describeSignInError(error.type)));
        },
    });

    const client = tokenClient;
    const options: TokenRequestOptions = chooseAccount
        ? { prompt: 'select_account' }
        : email
          ? { login_hint: email, prompt: '' }
          : {};
    await new Promise<void>((resolve, reject) => {
        pendingToken = { resolve, reject };
        client.requestAccessToken(options);
    });
}

function describeSignInError(type: string): string {
    switch (type) {
        case 'popup_closed':
            return 'The Google window was closed before sign-in finished. Try again.';
        case 'popup_failed_to_open':
            return "Your browser blocked Google's sign-in window. Allow pop-ups for this site and try again.";
        default:
            return 'Google sign-in could not be opened.';
    }
}
