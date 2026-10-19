if (typeof window !== 'undefined') {
  const _warn = console.warn;
  console.warn = (...args) => {
    const msg = args[0];
    if (
      typeof msg === 'string' &&
      (msg.includes('"shadow*" style props are deprecated') ||
       msg.includes('props.pointerEvents is deprecated') ||
       msg.includes('Require cycle:'))
    ) {
      return;
    }
    _warn(...args);
  };
}

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);

