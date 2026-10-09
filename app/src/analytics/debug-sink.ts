import type { AnalyticsEvent } from './events';

export function sendDebugEvent(event: AnalyticsEvent): void {
    console.debug('[analytics]', event);
    window.__analyticsEvents ??= [];
    window.__analyticsEvents.push(event);
}
