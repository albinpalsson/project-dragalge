import { buildMailto } from './contact';

const MAX_STACK_LENGTH = 800;

export interface CrashReport {
    subject: string;
    body: string;
    mailto: string;
}

export function buildCrashReport(error: unknown): CrashReport {
    const subject = 'Paldea Nuzlocke Guide crash report';
    const body = [
        'Please describe what you were doing when the error occurred:',
        '',
        '',
        '--- Technical details (no game data included) ---',
        `Time: ${new Date().toISOString()}`,
        `Page: ${window.location.pathname}${window.location.hash}`,
        `Browser: ${navigator.userAgent}`,
        ...describeErrorChain(error),
    ].join('\n');
    return { subject, body, mailto: buildMailto(subject, body) };
}

function describeErrorChain(error: unknown): string[] {
    const lines: string[] = [];
    const seen = new Set<unknown>();
    let current = error;
    while (current !== undefined && current !== null && !seen.has(current)) {
        seen.add(current);
        if (current instanceof Error) {
            lines.push(`Error: ${current.name}: ${current.message}`);
            if (current.stack) {
                lines.push(`Stack: ${current.stack.slice(0, MAX_STACK_LENGTH)}`);
            }
            current = 'cause' in current ? current.cause : undefined;
        } else {
            lines.push(`Error: ${String(current)}`);
            break;
        }
    }
    return lines;
}
