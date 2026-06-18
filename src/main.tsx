import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app/App.tsx'

// StrictMode removed: PixiJS uses WebGL imperatively on a canvas and is
// incompatible with StrictMode's double-effect invocation in development
// (two concurrent app.init() calls on the same canvas freeze the renderer).
createRoot(document.getElementById('root')!).render(<App />)
