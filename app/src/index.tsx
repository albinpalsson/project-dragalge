import { createRoot } from 'react-dom/client';
import { createQueryClient } from '@pokedb2/server-query';
import './index.css';
import { App } from './views/App';
import { QueryClientProvider } from './server-query';
import { initTheme } from './theme';

initTheme();

const rootElement = document.getElementById('app');

if (!rootElement) {
    throw new Error('Expected to find root element with id "app".');
}

const queryClient = createQueryClient();

createRoot(rootElement).render(
    <QueryClientProvider client={queryClient}>
        <App />
    </QueryClientProvider>,
);
