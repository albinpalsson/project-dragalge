export interface ProcessedJsFile {
  type: 'js';
  code: string;
  dependencies: string[];
  metadata: Record<string, unknown>;
}

export interface ProcessedCssFile {
  type: 'css';
  code: string;
  dependencies: string[];
}

export type ProcessedFileResult = ProcessedJsFile | ProcessedCssFile;

export type ProcessedJsFileRef = Omit<ProcessedJsFile, 'code'> & { payloadFileName: string };
export type ProcessedCssFileRef = Omit<ProcessedCssFile, 'code'> & { payloadFileName: string };

export type ProcessedFileResultRef = ProcessedJsFileRef | ProcessedCssFileRef;
