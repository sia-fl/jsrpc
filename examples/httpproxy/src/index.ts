import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import * as signale from 'signale'

const app = express()
const PORT = 3000 // 你的代理服务器端口
const VITE_PORT = 5173 // Vite 的启动端口，默认是 5173，可以根据实际情况修改

// 代理配置，将所有请求转发到 Vite
app.use('/', createProxyMiddleware({
  target: `http://localhost:${VITE_PORT}`,
  changeOrigin: true,
  ws: true,
  pathFilter: path => !path.startsWith('/viembed'),
  logger: console,
}))

// hello word
app.get('/viembed', (_, res) => {
  res.send('Hello, Vite!')
})

// 启动代理服务器
app.listen(PORT, () => {
  signale.log(`Proxy server is running on http://localhost:${PORT}`)
})
