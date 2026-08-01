import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Filter out benign Three.js deprecation and WebGL program compiler warnings
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  const msg = args[0];
  if (
    typeof msg === 'string' &&
    (msg.includes('THREE.Clock') ||
      msg.includes('THREE.WebGLProgram') ||
      msg.includes('warning X4122'))
  ) {
    return;
  }
  originalWarn.apply(console, args);
};

const originalLog = console.log;
console.log = (...args: unknown[]) => {
  const msg = args[0];
  if (
    typeof msg === 'string' &&
    (msg.includes('THREE.Clock') ||
      msg.includes('THREE.WebGLProgram') ||
      msg.includes('warning X4122'))
  ) {
    return;
  }
  originalLog.apply(console, args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

