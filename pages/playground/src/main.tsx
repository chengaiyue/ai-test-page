import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
// 组件样式：由组件包以独立产物提供
import '@ai-test/button/style.css'
import '@ai-test/input/style.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
