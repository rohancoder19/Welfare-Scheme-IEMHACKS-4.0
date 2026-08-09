import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import axios from 'axios'
import { store } from './redux/store'
import App from './App.jsx'
import './index.css'

if (import.meta.env.VITE_API_URL) {
  const url = import.meta.env.VITE_API_URL.trim();
  axios.defaults.baseURL = (url.startsWith('http://') || url.startsWith('https://')) ? url : `https://${url}`;
}


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
)
