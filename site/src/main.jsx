import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import App from './App.jsx';
import { makeCatalog } from './catalog.js';
import { cfg } from './constants.js';

const EMPTY = makeCatalog({});

function Root() {
  const [state, setState] = React.useState({ status: 'loading', cat: EMPTY });
  const load = React.useCallback(() => {
    setState({ status: 'loading', cat: EMPTY });
    fetch(`${import.meta.env.BASE_URL}catalog.json`, { cache: 'no-cache' })
      .then((r) => {
        if (!r.ok) throw new Error(`catalog.json: HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        cfg.MP = data.marketplace.name;
        cfg.REPO = data.marketplace.repo;
        cfg.GH = `https://github.com/${data.marketplace.repo}`;
        setState({ status: 'ready', cat: makeCatalog(data) });
      })
      .catch((e) => {
        console.error(e);
        setState({ status: 'error', cat: EMPTY });
      });
  }, []);
  React.useEffect(load, [load]);
  return <App status={state.status} cat={state.cat} onRetry={load} />;
}

createRoot(document.getElementById('root')).render(<Root />);
