import { createHash } from 'node:crypto';
import { type FSWatcher, statSync, watch } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createServer, type Server } from 'node:http';
import path from 'node:path';

import { type BundlerConfig, runBundler } from '../main.ts';
import { BundlerPerformanceCollector } from '../performance-collector.ts';
import { OUTPUT_BUFFER_DIR_NAMES, pickCacheSlot } from './cache-slot.ts';

export interface DevServerConfig {
    cwd?: string;
    host?: string;
    port?: number;
    configOverrides?: Partial<BundlerConfig>;
    debounceMs?: number;
}

interface RebuildResult {
    success: boolean;
    error?: string;
    buildTime: number;
    version?: string;
    moduleCount?: number;
    reloadTriggered?: boolean;
}

interface FileState {
    mtimeMs: number;
    size: number;
}

interface WsSocketLike {
    destroyed?: boolean;
    destroy(): void;
    write(data: string | Uint8Array): unknown;
    on(
        event: 'close' | 'error',
        listener: (...args: unknown[]) => void,
    ): unknown;
}

const DEV_WS_PATH = '/__dev/ws';
const DEV_CLIENT_MARKER = 'data-bundler-dev-client';

export class DevServer {
    private readonly cwd: string;
    private readonly host: string;
    private readonly port: number;
    private readonly configOverrides: Partial<BundlerConfig>;
    private readonly debounceMs: number;

    private server: Server | undefined;
    private instanceCacheDir: string | undefined;
    private outputDirPath: string | undefined;
    private outputBufferPaths: [string, string] | undefined;
    private activeBufferIndex: 0 | 1 | undefined;
    private currentVersion = '';
    private buildInFlight = false;
    private pendingRebuild = false;
    private rebuildLoopPromise: Promise<void> | null = null;
    private lastChangeAt = 0;
    private lastBuildEndAt = 0;
    private rebuildTimer: NodeJS.Timeout | undefined;
    private isStopping = false;
    private rebuildCounter = 0;
    private queuedFollowUpNotified = false;
    private pendingChangedPaths = new Set<string>();
    private readonly wsClients = new Set<WsSocketLike>();
    private readonly fileWatchers = new Map<string, FSWatcher>();
    private readonly watchedFileStates = new Map<string, FileState>();

    constructor(config: DevServerConfig) {
        this.cwd = path.resolve(config.cwd ?? process.cwd());
        this.host = config.host ?? '127.0.0.1';
        this.port = config.port ?? 3000;
        this.debounceMs = config.debounceMs ?? 250;
        this.configOverrides = {
            ...(config.configOverrides ?? {}),
            mode: 'dev',
        };
    }

    async start(): Promise<void> {
        if (this.server) {
            return;
        }

        this.server = createServer((request, response) => {
            void this.handleHttpRequest(request, response);
        });
        this.server.on('upgrade', (request, socket) => {
            this.handleWsUpgrade(request, socket);
        });

        const server = this.server;
        if (!server) {
            throw new Error(
                'Expected HTTP server to be created before listen.',
            );
        }

        await new Promise<void>((resolve, reject) => {
            server.once('error', reject);
            server.listen(this.port, this.host, () => {
                server.off('error', reject);
                resolve();
            });
        });

        this.initializeInstancePaths();

        const initialRebuildId = ++this.rebuildCounter;
        this.log(`[dev] rebuild #${initialRebuildId} start (initial)`);
        const initialBuild = await this.runBuild();
        if (!initialBuild.success) {
            this.log(
                `[dev] rebuild #${initialRebuildId} failed ${formatMs(initialBuild.buildTime)}`,
            );
            await this.closeServerAfterFailedStart();
            throw new Error(initialBuild.error ?? 'Initial dev build failed.');
        }
        this.log(
            `[dev] rebuild #${initialRebuildId} done ${formatMs(initialBuild.buildTime)} (modules: ${initialBuild.moduleCount ?? 0}, v: ${shortVersion(initialBuild.version)})`,
        );

        this.log(
            `[dev] ready ${this.getBaseUrl()} (watching ${this.fileWatchers.size} files)`,
        );
    }

    async stop(): Promise<void> {
        this.isStopping = true;
        this.pendingRebuild = false;

        if (this.rebuildTimer) {
            clearTimeout(this.rebuildTimer);
            this.rebuildTimer = undefined;
        }

        if (this.rebuildLoopPromise) {
            try {
                await this.rebuildLoopPromise;
            } catch {
                // Ignore build errors during shutdown.
            }
        }

        for (const watcher of this.fileWatchers.values()) {
            watcher.close();
        }
        this.fileWatchers.clear();

        for (const socket of this.wsClients) {
            socket.destroy();
        }
        this.wsClients.clear();

        if (!this.server) {
            return;
        }
        const server = this.server;

        await new Promise<void>((resolve, reject) => {
            server.close((error) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve();
            });
        });

        this.server = undefined;
    }

    getBaseUrl(): string {
        if (!this.server) {
            return `http://${this.host}:${this.port}`;
        }

        const address = this.server.address();
        if (address && typeof address === 'object') {
            return `http://${address.address}:${address.port}`;
        }

        return `http://${this.host}:${this.port}`;
    }

    async rebuild(): Promise<{
        success: boolean;
        error?: string;
        buildTime: number;
    }> {
        const result = await this.runBuild();
        return {
            success: result.success,
            error: result.error,
            buildTime: result.buildTime,
        };
    }

    private async runBuild(): Promise<RebuildResult> {
        const start = performance.now();
        const perf = new BundlerPerformanceCollector({ write() {} });

        try {
            const { cacheDir, outputDir, bufferIndex } =
                this.getNextBuildPaths();
            const result = await runBundler({
                cwd: this.cwd,
                configOverrides: {
                    ...this.configOverrides,
                    cacheDir,
                    outputDir,
                },
                performance: perf,
            });

            const previousVersion = this.currentVersion;
            const nextVersion = buildVersionToken(
                result.outputPath,
                result.cssOutputPaths,
            );
            this.syncWatchers(result.watchedFilePaths);

            this.outputDirPath = path.resolve(
                this.cwd,
                result.config.outputDir,
            );
            this.activeBufferIndex = bufferIndex;
            this.currentVersion = nextVersion;

            let reloadTriggered = false;
            if (previousVersion && previousVersion !== nextVersion) {
                this.broadcastReload();
                reloadTriggered = true;
            }

            const summary = perf.getSummary();

            return {
                success: true,
                buildTime: performance.now() - start,
                version: nextVersion,
                moduleCount: summary?.moduleCount ?? 0,
                reloadTriggered,
            };
        } catch (error) {
            const message =
                error instanceof Error
                    ? (error.stack ?? error.message)
                    : String(error);
            return {
                success: false,
                error: message,
                buildTime: performance.now() - start,
            };
        }
    }

    private initializeInstancePaths(): void {
        const configuredCacheDir = this.configOverrides.cacheDir ?? '.cache';
        const cacheRoot = path.resolve(this.cwd, configuredCacheDir);
        const instanceCacheDir = pickCacheSlot(cacheRoot);
        this.instanceCacheDir = instanceCacheDir;
        this.outputBufferPaths = OUTPUT_BUFFER_DIR_NAMES.map((dirName) =>
            path.join(instanceCacheDir, dirName),
        ) as [string, string];
    }

    private getNextBuildPaths(): {
        cacheDir: string;
        outputDir: string;
        bufferIndex: 0 | 1;
    } {
        if (!this.instanceCacheDir || !this.outputBufferPaths) {
            throw new Error(
                'Dev server build paths have not been initialized.',
            );
        }

        const bufferIndex = this.activeBufferIndex === 0 ? 1 : 0;
        return {
            cacheDir: this.instanceCacheDir,
            outputDir: path.join(
                this.instanceCacheDir,
                `output-${bufferIndex}`,
            ),
            bufferIndex,
        };
    }

    private async closeServerAfterFailedStart(): Promise<void> {
        const server = this.server;
        if (!server) {
            return;
        }

        await new Promise<void>((resolve) => {
            server.close(() => resolve());
        });
        this.server = undefined;
    }

    private syncWatchers(inputPaths: string[]): void {
        const nextPaths = new Set(
            inputPaths
                .map((filePath) => path.resolve(filePath))
                .filter((filePath) => shouldWatchFile(this.cwd, filePath)),
        );

        for (const [watchedPath, watcher] of this.fileWatchers) {
            if (!nextPaths.has(watchedPath)) {
                watcher.close();
                this.fileWatchers.delete(watchedPath);
                this.watchedFileStates.delete(watchedPath);
            }
        }

        for (const filePath of nextPaths) {
            if (this.fileWatchers.has(filePath)) {
                continue;
            }

            try {
                this.watchedFileStates.set(
                    filePath,
                    toFileState(statSync(filePath)),
                );
                const watcher = watch(filePath, () => {
                    void this.handleWatchEvent(filePath);
                });
                this.fileWatchers.set(filePath, watcher);
            } catch {
                this.watchedFileStates.delete(filePath);
                // Ignore files that cannot be watched (deleted or temporarily unavailable).
            }
        }
    }

    private async handleWatchEvent(filePath: string): Promise<void> {
        try {
            const nextState = toFileState(await stat(filePath));
            const previousState = this.watchedFileStates.get(filePath);
            if (
                previousState?.mtimeMs === nextState.mtimeMs &&
                previousState.size === nextState.size
            ) {
                return;
            }

            this.watchedFileStates.set(filePath, nextState);
        } catch {
            this.watchedFileStates.delete(filePath);
        }

        this.onFileChanged(filePath);
    }

    private onFileChanged(filePath: string): void {
        if (this.isStopping) {
            return;
        }

        const displayPath = toDisplayPath(this.cwd, filePath);
        const sizeBefore = this.pendingChangedPaths.size;
        this.pendingChangedPaths.add(displayPath);
        if (sizeBefore === 0) {
            this.log(`[dev] change ${displayPath}`);
        }

        this.pendingRebuild = true;
        this.lastChangeAt = Date.now();

        if (this.buildInFlight && !this.queuedFollowUpNotified) {
            this.log('[dev] queued follow-up rebuild');
            this.queuedFollowUpNotified = true;
        }

        if (this.rebuildTimer) {
            clearTimeout(this.rebuildTimer);
        }

        this.rebuildTimer = setTimeout(() => {
            this.rebuildTimer = undefined;
            this.ensureRebuildLoop();
        }, this.debounceMs);
    }

    private ensureRebuildLoop(): void {
        if (this.rebuildLoopPromise) {
            return;
        }

        this.rebuildLoopPromise = this.maybeStartRebuild().finally(() => {
            this.rebuildLoopPromise = null;
            if (!this.isStopping && this.pendingRebuild) {
                this.ensureRebuildLoop();
            }
        });
    }

    private async maybeStartRebuild(): Promise<void> {
        if (this.isStopping || !this.pendingRebuild) {
            return;
        }

        const waitMs =
            Math.max(this.lastChangeAt, this.lastBuildEndAt) +
            this.debounceMs -
            Date.now();
        if (waitMs > 0) {
            this.rebuildTimer = setTimeout(() => {
                this.rebuildTimer = undefined;
                this.ensureRebuildLoop();
            }, waitMs);
            return;
        }

        if (this.buildInFlight) {
            return;
        }

        this.pendingRebuild = false;
        this.buildInFlight = true;
        this.queuedFollowUpNotified = false;
        const rebuildId = ++this.rebuildCounter;
        const changedSummary = summarizeChangedPaths(this.pendingChangedPaths);
        this.pendingChangedPaths.clear();
        this.log(`[dev] rebuild #${rebuildId} start (${changedSummary})`);

        const result = await this.runBuild();
        this.buildInFlight = false;
        this.lastBuildEndAt = Date.now();

        if (!result.success && result.error) {
            this.log(
                `[dev] rebuild #${rebuildId} failed ${formatMs(result.buildTime)}`,
            );
            process.stderr.write(`${result.error}\n`);
            return;
        }

        const reloadLabel = result.reloadTriggered ? 'reload' : 'no-reload';
        this.log(
            `[dev] rebuild #${rebuildId} done ${formatMs(result.buildTime)} (modules: ${result.moduleCount ?? 0}, ${reloadLabel}, v: ${shortVersion(result.version)})`,
        );
    }

    private async handleHttpRequest(
        request: IncomingMessage,
        response: ServerResponse,
    ): Promise<void> {
        if (!this.outputDirPath) {
            response.statusCode = 503;
            response.end('Build not ready');
            return;
        }

        if (request.method !== 'GET' && request.method !== 'HEAD') {
            response.statusCode = 405;
            response.end('Method Not Allowed');
            return;
        }

        const requestUrl = new URL(request.url ?? '/', this.getBaseUrl());
        let pathname = decodeURIComponent(requestUrl.pathname);
        if (pathname === '/') {
            pathname = '/index.html';
        }

        try {
            if (pathname.toLowerCase().endsWith('.html')) {
                const absolutePath = safeResolveFromRoot(
                    this.outputDirPath,
                    pathname,
                );
                if (!absolutePath) {
                    response.statusCode = 403;
                    response.end('Forbidden');
                    return;
                }

                const sourceHtml = await readFile(absolutePath, 'utf8');
                const body = injectDevClientScript(
                    sourceHtml,
                    this.currentVersion,
                );
                response.statusCode = 200;
                response.setHeader('content-type', 'text/html; charset=utf-8');
                if (request.method === 'HEAD') {
                    response.end();
                    return;
                }
                response.end(body);
                return;
            }

            for (const outputDirPath of this.getOutputDirsForAssetRequest()) {
                const absolutePath = safeResolveFromRoot(
                    outputDirPath,
                    pathname,
                );
                if (!absolutePath) {
                    response.statusCode = 403;
                    response.end('Forbidden');
                    return;
                }

                try {
                    const fileBuffer = await readFile(absolutePath);
                    response.statusCode = 200;
                    response.setHeader(
                        'content-type',
                        guessContentType(absolutePath),
                    );
                    if (request.method === 'HEAD') {
                        response.end();
                        return;
                    }
                    response.end(fileBuffer);
                    return;
                } catch {}
            }

            response.statusCode = 404;
            response.end('Not Found');
        } catch {
            response.statusCode = 404;
            response.end('Not Found');
        }
    }

    private getOutputDirsForAssetRequest(): string[] {
        if (this.activeBufferIndex === undefined || !this.outputBufferPaths) {
            return [this.outputDirPath].filter(
                (outputDirPath): outputDirPath is string =>
                    Boolean(outputDirPath),
            );
        }

        const previousBufferIndex = this.activeBufferIndex === 0 ? 1 : 0;
        return [
            this.outputBufferPaths[this.activeBufferIndex],
            this.outputBufferPaths[previousBufferIndex],
        ];
    }

    private handleWsUpgrade(
        request: IncomingMessage,
        socket: WsSocketLike,
    ): void {
        const requestUrl = new URL(request.url ?? '/', this.getBaseUrl());
        if (requestUrl.pathname !== DEV_WS_PATH) {
            socket.destroy();
            return;
        }

        const upgrade = request.headers.upgrade;
        const wsKey = request.headers['sec-websocket-key'];
        if (
            upgrade?.toLowerCase() !== 'websocket' ||
            typeof wsKey !== 'string'
        ) {
            socket.destroy();
            return;
        }

        const acceptKey = createHash('sha1')
            .update(`${wsKey}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`, 'utf8')
            .digest('base64');

        socket.write(
            [
                'HTTP/1.1 101 Switching Protocols',
                'Upgrade: websocket',
                'Connection: Upgrade',
                `Sec-WebSocket-Accept: ${acceptKey}`,
                '',
                '',
            ].join('\r\n'),
        );

        this.wsClients.add(socket);
        socket.on('close', () => this.wsClients.delete(socket));
        socket.on('error', () => this.wsClients.delete(socket));

        const clientVersion = requestUrl.searchParams.get('v') ?? '';
        if (clientVersion !== this.currentVersion) {
            sendWebSocketText(socket, 'reload');
        }
    }

    private broadcastReload(): void {
        for (const socket of this.wsClients) {
            sendWebSocketText(socket, 'reload');
        }
    }

    private log(message: string): void {
        process.stdout.write(`${message}\n`);
    }
}

export async function startDevServer(
    config: DevServerConfig,
): Promise<DevServer> {
    const server = new DevServer(config);
    await server.start();
    return server;
}

function toFileState(stats: { mtimeMs: number; size: number }): FileState {
    return { mtimeMs: stats.mtimeMs, size: stats.size };
}

function shouldWatchFile(cwd: string, filePath: string): boolean {
    const relative = path.relative(cwd, filePath);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
        return false;
    }

    return !relative.split(path.sep).includes('node_modules');
}

function safeResolveFromRoot(
    rootPath: string,
    requestedPath: string,
): string | null {
    const relativePath = requestedPath.replace(/^\/+/, '');
    const resolved = path.resolve(rootPath, relativePath);
    const relative = path.relative(rootPath, resolved);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
        return null;
    }

    return resolved;
}

function buildVersionToken(
    outputPath: string,
    cssOutputPaths: string[],
): string {
    const jsAsset = path.basename(outputPath);
    const cssAssets = cssOutputPaths
        .map((filePath) => path.basename(filePath))
        .sort();

    const payload = [jsAsset, ...cssAssets].join('|');
    return createHash('sha1')
        .update(payload, 'utf8')
        .digest('hex')
        .slice(0, 12);
}

function formatMs(value: number): string {
    return `${value.toFixed(1)}ms`;
}

function toDisplayPath(cwd: string, filePath: string): string {
    const relative = path.relative(cwd, filePath);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
        return path.basename(filePath);
    }

    return relative.split(path.sep).join('/');
}

function summarizeChangedPaths(paths: Set<string>): string {
    const list = [...paths];
    if (list.length === 0) {
        return 'manual';
    }

    if (list.length === 1) {
        return list[0];
    }

    const preview = list.slice(0, 2).join(', ');
    const remainder = list.length - 2;
    if (remainder > 0) {
        return `${preview} (+${remainder})`;
    }

    return preview;
}

function shortVersion(version: string | undefined): string {
    if (!version) {
        return 'n/a';
    }
    return version.slice(0, 8);
}

function injectDevClientScript(sourceHtml: string, version: string): string {
    if (sourceHtml.includes(DEV_CLIENT_MARKER)) {
        return sourceHtml;
    }

    const escapedVersion = JSON.stringify(version);
    const script = `<script ${DEV_CLIENT_MARKER}>(()=>{const v=${escapedVersion};const proto=location.protocol==='https:'?'wss':'ws';const ws=new WebSocket(proto+'://'+location.host+'${DEV_WS_PATH}?v='+encodeURIComponent(v));ws.onmessage=(event)=>{if(event.data==='reload'){location.reload();}};})();</script>`;
    const lower = sourceHtml.toLowerCase();
    const bodyCloseIndex = lower.lastIndexOf('</body>');
    if (bodyCloseIndex === -1) {
        return `${sourceHtml}\n${script}\n`;
    }

    return `${sourceHtml.slice(0, bodyCloseIndex)}${script}\n${sourceHtml.slice(bodyCloseIndex)}`;
}

function guessContentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
        case '.ico':
            return 'image/x-icon';
        case '.html':
            return 'text/html; charset=utf-8';
        case '.js':
            return 'application/javascript; charset=utf-8';
        case '.css':
            return 'text/css; charset=utf-8';
        case '.json':
            return 'application/json; charset=utf-8';
        case '.map':
            return 'application/json; charset=utf-8';
        case '.avif':
            return 'image/avif';
        case '.png':
            return 'image/png';
        case '.jpg':
        case '.jpeg':
            return 'image/jpeg';
        case '.gif':
            return 'image/gif';
        case '.webp':
            return 'image/webp';
        case '.svg':
            return 'image/svg+xml';
        case '.woff2':
            return 'font/woff2';
        case '.woff':
            return 'font/woff';
        case '.ttf':
            return 'font/ttf';
        case '.txt':
            return 'text/plain; charset=utf-8';
        default:
            return 'application/octet-stream';
    }
}

function sendWebSocketText(socket: WsSocketLike, text: string): void {
    if (socket.destroyed) {
        return;
    }

    const payload = Buffer.from(text, 'utf8');
    const frameHeader = buildWebSocketTextFrameHeader(payload.length);
    socket.write(Buffer.concat([frameHeader, payload]));
}

function buildWebSocketTextFrameHeader(payloadLength: number): Buffer {
    if (payloadLength < 126) {
        return Buffer.from([0x81, payloadLength]);
    }

    if (payloadLength < 65536) {
        return Buffer.from([
            0x81,
            126,
            (payloadLength >> 8) & 0xff,
            payloadLength & 0xff,
        ]);
    }

    const header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    const high = Math.floor(payloadLength / 2 ** 32);
    const low = payloadLength >>> 0;
    header.writeUInt32BE(high, 2);
    header.writeUInt32BE(low, 6);
    return header;
}
