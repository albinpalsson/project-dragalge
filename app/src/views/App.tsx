import { css } from '@pokedb2/css-in-js';
import { Home } from './Home/Home';
import { ThemeToggle } from './ThemeToggle';

export function App() {
    return (
        <main>
            <div className={header}>
                <h1>PokeDB</h1>
                <ThemeToggle />
            </div>

            <Home />
        </main>
    );
}

const header = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;
