import {
    isAnalyticsConfigured,
    isDevelopment,
    GA4_MEASUREMENT_ID,
} from './config';
import {
    getStoredAnalyticsConsent,
    storeAnalyticsConsent,
    type AnalyticsConsent,
} from './consent';
import { sendDebugEvent } from './debug-sink';
import type { AnalyticsEvent } from './events';
import { sendGtagEvent } from './gtag';

let consent = getStoredAnalyticsConsent();

export function initAnalytics(): void {
    consent = getStoredAnalyticsConsent();
}

export function setAnalyticsConsent(nextConsent: AnalyticsConsent): void {
    consent = nextConsent;
    storeAnalyticsConsent(nextConsent);
}

export function getAnalyticsConsent(): AnalyticsConsent | null {
    return consent;
}

export function track(event: AnalyticsEvent): void {
    if (consent !== 'granted') {
        return;
    }

    if (isAnalyticsConfigured) {
        sendGtagEvent(GA4_MEASUREMENT_ID, event);
        return;
    }

    if (isDevelopment) {
        sendDebugEvent(event);
    }
}