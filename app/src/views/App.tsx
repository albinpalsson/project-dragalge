import React, { useState } from 'react';
import { Button } from './Button';
import { multiply } from '../math';

export function App() {
  const [count, setCount] = useState(0);

  return (
    <main>
      <h1>PokeDB</h1>
      <Button label={`Clicked ${count} times`} onClick={() => setCount((prev) => Math.max(1, multiply(prev, 2)))} />
    </main>
  );
}
