// Carrega os veículos do Excel (via /api/veiculos), com cache em memória.
let cache = null

export function carregarVeiculos() {
  if (!cache) {
    cache = fetch('/api/veiculos')
      .then(r => r.json())
      .then(d => d.veiculos || [])
      .catch(() => [])
  }
  return cache
}
