import { createHash } from 'node:crypto';
import type { BrowserContext, Route } from '@playwright/test';

export const ACCOUNTS = [
    { token: 'token-a', name: 'Account A', email: 'a@example.com' },
    { token: 'token-b', name: 'Account B', email: 'b@example.com' },
];

interface FakeFile {
    id: string;
    name: string;
    owner: string;
    content: Buffer;
}

const CORS = {
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'authorization, content-type',
    'access-control-allow-methods': 'GET, POST, PATCH, DELETE, OPTIONS',
};

// A stand-in for the part of the Google Drive API the app uses (each account's
// hidden appDataFolder), shared by every browser context a test connects to.
export class FakeDrive {
    readonly files = new Map<string, FakeFile>();
    // Uploads that replaced a file's content, so a test can see what was saved.
    uploads = 0;
    // Answer every request as Google does for a token it no longer accepts.
    rejectAuth = false;
    // Fail every request as if the network were down.
    unreachable = false;
    failNext = 0;
    hang = false;
    private nextId = 1;

    names(owner = ACCOUNTS[0].email): string[] {
        return [...this.files.values()]
            .filter((file) => file.owner === owner)
            .map((file) => file.name)
            .sort();
    }

    async handle(route: Route): Promise<void> {
        const request = route.request();
        if (this.hang) {
            return new Promise(() => {});
        }
        if (this.unreachable || this.failNext > 0) {
            this.failNext = Math.max(0, this.failNext - 1);
            await route.abort('internetdisconnected');
            return;
        }
        if (request.method() === 'OPTIONS') {
            await route.fulfill({ status: 204, headers: CORS });
            return;
        }
        const bearer = request.headers().authorization?.replace('Bearer ', '');
        const account = ACCOUNTS.find((entry) => entry.token === bearer);
        if (this.rejectAuth || !account) {
            await route.fulfill({ status: 401, headers: CORS, body: '{}' });
            return;
        }

        const url = new URL(request.url());
        const method = request.method();
        const upload = url.pathname.match(/^\/upload\/drive\/v3\/files\/(.+)$/);
        const file = url.pathname.match(/^\/drive\/v3\/files\/?(.*)$/);
        const owned = (id: string) => {
            const found = this.files.get(decodeURIComponent(id));
            return found?.owner === account.email ? found : undefined;
        };

        if (url.pathname === '/drive/v3/about') {
            await this.json(route, {
                user: { displayName: account.name, emailAddress: account.email },
            });
        } else if (upload && method === 'PATCH') {
            const existing = owned(upload[1]);
            if (!existing) {
                await route.fulfill({ status: 404, headers: CORS, body: '{}' });
                return;
            }
            existing.content = request.postDataBuffer() ?? Buffer.alloc(0);
            this.uploads++;
            await this.json(route, this.metadata(existing));
        } else if (file && file[1] === '' && method === 'POST') {
            const { name } = request.postDataJSON() as { name: string };
            const created = {
                id: `file-${this.nextId++}`,
                name,
                owner: account.email,
                content: Buffer.alloc(0),
            };
            this.files.set(created.id, created);
            await this.json(route, this.metadata(created));
        } else if (file && file[1] === '' && method === 'GET') {
            const wanted = /name = '(.*)' and/.exec(
                url.searchParams.get('q') ?? '',
            )?.[1];
            const match = [...this.files.values()].find(
                (entry) =>
                    entry.owner === account.email && entry.name === wanted,
            );
            await this.json(route, {
                files: match ? [this.metadata(match)] : [],
            });
        } else if (file && method === 'GET') {
            const existing = owned(file[1]);
            if (!existing) {
                await route.fulfill({ status: 404, headers: CORS, body: '{}' });
            } else if (url.searchParams.get('alt') === 'media') {
                await route.fulfill({
                    status: 200,
                    headers: CORS,
                    contentType: 'application/octet-stream',
                    body: existing.content,
                });
            } else {
                await this.json(route, this.metadata(existing));
            }
        } else {
            await route.fulfill({ status: 404, headers: CORS, body: '{}' });
        }
    }

    private metadata(file: FakeFile) {
        return {
            id: file.id,
            md5Checksum: createHash('md5').update(file.content).digest('hex'),
        };
    }

    private json(route: Route, body: unknown) {
        return route.fulfill({
            status: 200,
            headers: CORS,
            contentType: 'application/json',
            body: JSON.stringify(body),
        });
    }
}

// Answers Google's sign-in script and the Drive API for every page in `context`.
// The fake sign-in picks the account like Google does: the hinted one, the other
// one when asked to choose, otherwise the first. It stores the options it
// received in localStorage (`fake-token-request`) so tests can inspect them.
export async function installFakeGoogle(
    context: BrowserContext,
    drive: FakeDrive,
): Promise<void> {
    await context.route('https://accounts.google.com/gsi/client', (route) =>
        route.fulfill({
            contentType: 'application/javascript',
            body: `(() => {
                const accounts = ${JSON.stringify(ACCOUNTS)};
                let current = 0;
                window.google = { accounts: { oauth2: {
                    initTokenClient(config) {
                        return { requestAccessToken(options = {}) {
                            localStorage.setItem('fake-token-request', JSON.stringify(options));
                            if (options.login_hint) {
                                current = Math.max(0, accounts.findIndex(
                                    (account) => account.email === options.login_hint));
                            } else if (options.prompt === 'select_account') {
                                current = (current + 1) % accounts.length;
                            }
                            setTimeout(() => config.callback({
                                access_token: accounts[current].token,
                                expires_in: 3600,
                            }), 0);
                        } };
                    },
                    hasGrantedAllScopes() { return true; },
                } } };
            })();`,
        }),
    );
    await context.route('https://www.googleapis.com/**', (route) =>
        drive.handle(route),
    );
}
