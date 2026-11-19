import { useEffect } from 'react';
import { requestPersistentStorage } from '../storage-persistence';

export function usePersistentStorageRequest(): void {
    useEffect(() => {
        void requestPersistentStorage();
    }, []);
}
