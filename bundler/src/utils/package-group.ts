export const APPLICATION_PACKAGE_GROUP = 'application';

/**
 * Maps a module path to the package it belongs to, using the last `node_modules`
 * segment in the path. Modules outside `node_modules` belong to the application.
 */
export function getPackageGroup(filePath: string): string {
    const segments = filePath.replace(/\\/g, '/').split('/');
    const lastIndex = segments.lastIndexOf('node_modules');
    if (lastIndex === -1) {
        return APPLICATION_PACKAGE_GROUP;
    }

    const name = segments[lastIndex + 1];
    if (!name) {
        return APPLICATION_PACKAGE_GROUP;
    }

    if (name.startsWith('@')) {
        const scoped = segments[lastIndex + 2];
        return scoped ? `${name}/${scoped}` : APPLICATION_PACKAGE_GROUP;
    }

    return name;
}
