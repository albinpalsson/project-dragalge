import { getDriveUser } from './drive-api';

// Who signed in last, so the login modal can offer "Continue as ...".
export interface GoogleAccount {
    name: string;
    email: string;
}

const STORAGE_KEY = 'paldea-nuzlocke-guide:google-account';

export function getRememberedAccount(): GoogleAccount | undefined {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as GoogleAccount) : undefined;
    } catch {
        return undefined;
    }
}

// Looks up the signed-in user and remembers them. Needs a valid token.
export async function rememberSignedInAccount(): Promise<GoogleAccount> {
    const { displayName, emailAddress } = await getDriveUser();
    const account = { name: displayName ?? '', email: emailAddress ?? '' };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
    return account;
}
