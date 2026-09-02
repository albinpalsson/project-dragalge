export * from './schema.ts';

// The runtime entry (artifacts/paldea-db.js) default-exports the encoded DB blob as base64.
declare const data: string;
export default data;
