import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { Global } from '@emotion/react';
import 'prismjs/themes/prism.css';
import App from './App';
import { store } from './store';
import { globalStyles } from './globalStyles';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <Global styles={globalStyles} />
      <App />
    </Provider>
  </React.StrictMode>
);
