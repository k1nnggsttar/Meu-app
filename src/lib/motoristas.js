// Carrega os motoristas do Excel (via /api/motoristas), com cache em memória.
let cache = null

export function carregarMotoristas() {
  if (!cache) {
    cache = fetch('/api/motoristas')
      .then(r => r.json())
      .then(d => d.motoristas || [])
      .catch(() => [])
  }
  return cache
}

export const isMotoristaAtivo = (m) =>
  String(m?.situacao || '').toLowerCase().includes('trabalhando')
