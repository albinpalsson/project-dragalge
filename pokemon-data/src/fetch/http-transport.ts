import type { Browser, Page, Response as BrowserResponse } from 'playwright-core';

const USER_AGENT =
    'paldea-nuzlocke-guide-scraper/1.0 (hobby project)';
const CHALLENGE_TIMEOUT_MS = 60_000;
const CHALLENGE_POLL_MS = 500;
const BROWSER_IDLE_CLOSE_MS = 3_000;

export type FetchTransportName = 'node-fetch' | 'browser';

export class FetchError extends Error {
    readonly url: string;
    readonly transport: FetchTransportName;
    readonly status: number | undefined;

    constructor(
        message: string,
        url: string,
        transport: FetchTransportName,
        options: { status?: number; cause?: unknown } = {},
    ) {
        super(`[${transport}] ${message}`, { cause: options.cause });
        this.name = 'FetchError';
        this.url = url;
        this.transport = transport;
        this.status = options.status;
    }
}

export interface HttpTransport {
    /** Resolves with the response body, or throws a FetchError. */
    fetchBytes(url: string): Promise<Uint8Array>;
    close(): Promise<void>;
}

interface BrowserSession {
    browser: Browser;
    page: Page;
}

// hosts that answered a plain fetch with 403 and are fetched via the browser
const browserHosts = new Set<string>();
let sessionPromise: Promise<BrowserSession> | undefined;
let idleTimer: NodeJS.Timeout | undefined;

async function fetchWithNode(url: string): Promise<Uint8Array> {
    let response: Response;
    try {
        response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    } catch (cause) {
        throw new FetchError(`network error fetching ${url}`, url, 'node-fetch', {
            cause,
        });
    }
    if (!response.ok) {
        throw new FetchError(
            `HTTP ${response.status} fetching ${url}`,
            url,
            'node-fetch',
            { status: response.status },
        );
    }
    return new Uint8Array(await response.arrayBuffer());
}

async function launchBrowser(): Promise<BrowserSession> {
    try {
        const { chromium } = await import('playwright-core');
        // Cloudflare's challenge is not passed by headless browsers
        const browser = await chromium.launch({
            channel: 'chrome',
            headless: false,
        });
        return { browser, page: await browser.newPage() };
    } catch (cause) {
        throw new FetchError('could not launch Chrome', '', 'browser', { cause });
    }
}

function getSession(): Promise<BrowserSession> {
    if (!sessionPromise) {
        const pending = launchBrowser();
        sessionPromise = pending;
        // let a later request retry the launch
        pending.catch(() => {
            if (sessionPromise === pending) {
                sessionPromise = undefined;
            }
        });
    }
    return sessionPromise;
}

async function closeBrowser(): Promise<void> {
    clearTimeout(idleTimer);
    const pending = sessionPromise;
    sessionPromise = undefined;
    if (!pending) {
        return;
    }
    try {
        const { browser } = await pending;
        await browser.close();
    } catch {
        // the launch failed or the browser is already gone
    }
}

function scheduleIdleClose(): void {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
        void closeBrowser();
    }, BROWSER_IDLE_CLOSE_MS);
}

function isChallenge(response: BrowserResponse): boolean {
    return response.headers()['cf-mitigated'] === 'challenge';
}

async function navigate(page: Page, url: string): Promise<BrowserResponse> {
    const response = await page.goto(url);
    if (!response) {
        throw new FetchError(`no response navigating to ${url}`, url, 'browser');
    }
    return response;
}

async function waitForChallenge(page: Page, url: string): Promise<void> {
    process.stdout.write('Waiting for the Cloudflare challenge to complete\n');
    const deadline = Date.now() + CHALLENGE_TIMEOUT_MS;
    while ((await page.title()).includes('Just a moment')) {
        if (Date.now() > deadline) {
            throw new FetchError(
                `Cloudflare challenge not completed within ${CHALLENGE_TIMEOUT_MS / 1000}s for ${url}`,
                url,
                'browser',
            );
        }
        await page.waitForTimeout(CHALLENGE_POLL_MS);
    }
}

function assertOk(response: BrowserResponse, url: string): void {
    if (isChallenge(response)) {
        throw new FetchError(
            `still blocked by the Cloudflare challenge fetching ${url}`,
            url,
            'browser',
            { status: response.status() },
        );
    }
    if (!response.ok()) {
        throw new FetchError(
            `HTTP ${response.status()} fetching ${url}`,
            url,
            'browser',
            { status: response.status() },
        );
    }
}

async function fetchWithBrowser(url: string): Promise<Uint8Array> {
    clearTimeout(idleTimer);
    try {
        const { page } = await getSession();
        let response = await navigate(page, url);
        if (isChallenge(response)) {
            await waitForChallenge(page, url);
            // the challenge cookie is set now, so the same URL should succeed
            response = await navigate(page, url);
        }
        assertOk(response, url);
        return new Uint8Array(await response.body());
    } catch (cause) {
        if (cause instanceof FetchError) {
            throw cause;
        }
        throw new FetchError(`browser error fetching ${url}`, url, 'browser', {
            cause,
        });
    } finally {
        scheduleIdleClose();
    }
}

export const httpTransport: HttpTransport = {
    async fetchBytes(url: string): Promise<Uint8Array> {
        const host = new URL(url).hostname;
        if (!browserHosts.has(host)) {
            try {
                return await fetchWithNode(url);
            } catch (err) {
                if (!(err instanceof FetchError) || err.status !== 403) {
                    throw err;
                }
                browserHosts.add(host);
                process.stdout.write(
                    `${host} returned 403, fetching it with Chrome instead\n`,
                );
            }
        }
        return fetchWithBrowser(url);
    },

    close: closeBrowser,
};
