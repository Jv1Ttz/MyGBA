import os from 'os'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import selfsigned from 'selfsigned'

function getLocalIpAddresses() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((iface): iface is NonNullable<typeof iface> => !!iface && iface.family === 'IPv4' && !iface.internal)
    .map((iface) => iface.address)
}

function createHttpsOptions(hosts: string[]) {
  const altNames = hosts.map((host) => {
    const isIp = /^\d+\.\d+\.\d+\.\d+$/.test(host)
    return isIp ? { type: 7, ip: host } : { type: 2, value: host }
  })

  const attrs = [{ name: 'commonName', value: hosts[0] }]
  const pems = selfsigned.generate(attrs, {
    days: 365,
    keySize: 2048,
    algorithm: 'sha256',
    extensions: [{ name: 'subjectAltName', altNames }],
  })

  return {
    key: pems.private,
    cert: pems.cert,
  }
}

// COOP/COEP headers are required for SharedArrayBuffer (mGBA WASM threads)
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const envHosts = env.VITE_DEV_HOSTS?.split(',').map((host) => host.trim()).filter(Boolean) ?? []
  const localIps = getLocalIpAddresses()
  const hosts = Array.from(new Set(['localhost', '127.0.0.1', ...localIps, ...envHosts]))

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      host: '0.0.0.0',
      https: createHttpsOptions(hosts),
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
    },
    preview: {
      host: '0.0.0.0',
      https: createHttpsOptions(hosts),
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
    },
    optimizeDeps: {
      exclude: ['@thenick775/mgba-wasm'],
    },
  }
})
