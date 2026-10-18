import type { AnalyticsEvent } from './events';

export function sendGtagEvent(
    measurementId: string,
    event: AnalyticsEvent,
): void {
    // TODO: Load gtag.js after consent and map AnalyticsEvent fields to GA4 events here
    void measurementId;
    void event;
}
