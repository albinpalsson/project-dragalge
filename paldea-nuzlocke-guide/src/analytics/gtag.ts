import type { AnalyticsEvent } from './events';

type GtagCommand =
    | ['js', Date]
    | ['config', string, { send_page_view: false }]
    | [
          'event',
          'page_view',
          { send_to: string; page_title: string; app_view: string },
      ]
    | [
          'event',
          'game_created',
          { send_to: string; game_variant: string; randomizer_mode: string },
      ]
    | [
          'event',
          'progression_milestone',
          { send_to: string; milestone: string; outcome?: string },
      ];

type Gtag = (...command: GtagCommand) => void;

declare global {
    interface Window {
        dataLayer?: unknown[];
        gtag?: Gtag;
    }
}

let gtag: Gtag | undefined;
const configuredMeasurementIds = new Set<string>();

export function sendGtagEvent(
    measurementId: string,
    event: AnalyticsEvent,
): void {
    // track() owns consent; no queue or globals are created before its first call.
    const send = initializeGtag(measurementId);

    switch (event.name) {
        case 'page_view':
            send('event', 'page_view', {
                send_to: measurementId,
                page_title: event.view,
                app_view: event.view,
            });
            return;
        case 'game_created':
            send('event', 'game_created', {
                send_to: measurementId,
                game_variant: event.variant,
                randomizer_mode: event.randomizerMode,
            });
            return;
        case 'progression_milestone':
            send('event', 'progression_milestone', {
                send_to: measurementId,
                milestone: event.milestone,
                ...(event.outcome === undefined
                    ? {}
                    : { outcome: event.outcome }),
            });
            return;
        default: {
            const unhandledEvent: never = event;
            throw new Error(
                `Unsupported analytics event: ${JSON.stringify(unhandledEvent)}`,
            );
        }
    }
}

function initializeGtag(measurementId: string): Gtag {
    if (!gtag) {
        window.dataLayer ??= [];
        const dataLayer = window.dataLayer;
        window.gtag ??= function (..._command: GtagCommand): void {
            // biome-ignore lint/complexity/noArguments: Match Google's gtag queue format.
            dataLayer.push(arguments);
        };
        gtag = window.gtag;
        gtag('js', new Date());

        loadGtagScript(measurementId);
    }

    if (!configuredMeasurementIds.has(measurementId)) {
        gtag('config', measurementId, { send_page_view: false });
        configuredMeasurementIds.add(measurementId);
    }

    return gtag;
}

function loadGtagScript(measurementId: string): void {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    script.onerror = () => {
        // Ad blockers and offline use commonly block this; analytics is optional.
        console.warn('[analytics] Failed to load gtag.js');
    };
    document.head.appendChild(script);
}