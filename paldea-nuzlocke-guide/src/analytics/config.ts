declare const process: {
    env: {
        GA4_MEASUREMENT_ID?: string;
        APP_VERSION?: string;
        NODE_ENV?: string;
    };
};

export const APP_VERSION = process.env.APP_VERSION ?? 'dev';
export const GA4_MEASUREMENT_ID = process.env.GA4_MEASUREMENT_ID ?? '';
export const isAnalyticsConfigured = GA4_MEASUREMENT_ID.length > 0;
export const isDevelopment = process.env.NODE_ENV === 'development';
