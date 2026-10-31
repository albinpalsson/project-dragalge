import type { ModuleTransformMetadata } from '../main.ts';

export interface ParsedDependency {
    type: 'require' | 'dynamic';
    specifier: string;
}

export interface ResolvedRequire {
    specifier: string;
    resolvedPath: string;
    dynamic: boolean;
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

export interface Chunk {
    entries: DependencyEntry[];
    /** Lazy roots whose static closure contains this chunk's modules. */
    roots: string[];
}

export interface LazyRoot {
    path: string;
    /** Every chunk that must be loaded before `path` can be required. */
    chunks: Chunk[];
}

export interface ChunkGraph {
    main: DependencyEntry[];
    chunks: Chunk[];
    roots: LazyRoot[];
}

export interface BuildDependencyTreeResult extends ChunkGraph {
    /** Every module in depth-first order, regardless of chunk. */
    entries: DependencyEntry[];
}
