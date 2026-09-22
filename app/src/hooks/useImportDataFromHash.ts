import { useState } from 'react';

export function useImportDataFromHash() {
    const [importData, setImportData] = useState(() =>
        importDataFromHash(window.location.hash),
    );

    return {
        importData,
        dismissImport: () => {
            window.history.replaceState(
                null,
                '',
                `${window.location.pathname}${window.location.search}`,
            );
            setImportData(undefined);
        },
    };
}

function importDataFromHash(hash: string): string | undefined {
    if (!hash.startsWith('#import=')) {
        return undefined;
    }
    try {
        return decodeURIComponent(hash.slice(8));
    } catch {
        return '';
    }
}