
import type {  ModuleTransformMetadata } from '../main';

export interface ParsedDependency {
  type: 'require';
  specifier: string;
}

export interface ResolvedRequire {
  specifier: string;
  resolvedPath: string;
}

export interface DependencyModule {
  type: 'js';
  path: string;
  code: string;
  requires: ResolvedRequire[];
  metadata: ModuleTransformMetadata;
}

export interface CssDependency {
  type: 'css';
  path: string;
  code: string;
}

export type DependencyEntry = DependencyModule | CssDependency;

export type VisitState =
  | { status: 'pending' }
  | { status: 'ready'; entry: DependencyEntry };

export interface BuildDependencyTreeResult {
  entries: DependencyEntry[];
}
