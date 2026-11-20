declare const process: {
    env: {
        GOOGLE_CLIENT_ID?: string;
    };
};

// A public OAuth client id: it identifies the app to Google and holds no secret.
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? '';
// Without an id, Google Drive storage is not offered at all.
export const isDriveConfigured = GOOGLE_CLIENT_ID.length > 0;
