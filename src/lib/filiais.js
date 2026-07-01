export const FILIAIS = [
  { codigo: 'ARG', nome: 'ARAGUAINA' },
  { codigo: 'BEL', nome: 'ANANINDEUA' },
  { codigo: 'BNU', nome: 'BLUMENAU' },
  { codigo: 'BSB', nome: 'BRASILIA' },
  { codigo: 'CGR', nome: 'CAMPO GRANDE' },
  { codigo: 'COR', nome: 'CORUMBA' },
  { codigo: 'DOU', nome: 'DOURADOS' },
  { codigo: 'FOR', nome: 'FORTALEZA' },
  { codigo: 'FSA', nome: 'FEIRA DE SANTANA' },
  { codigo: 'GOI', nome: 'APARECIDA DE GOIANIA' },
  { codigo: 'HGY', nome: 'APARECIDA DE GOIANIA' },
  { codigo: 'ITN', nome: 'ITABUNA' },
  { codigo: 'JOI', nome: 'ARAQUARI' },
  { codigo: 'MAO', nome: 'MANAUS' },
  { codigo: 'POA', nome: 'PORTO ALEGRE' },
  { codigo: 'PVH', nome: 'PORTO VELHO' },
  { codigo: 'ROO', nome: 'RONDONOPOLIS' },
  { codigo: 'SCZ', nome: 'SANTA CRUZ DO SUL' },
  { codigo: 'SNP', nome: 'SINOP' },
  { codigo: 'SOB', nome: 'SOBRAL' },
  { codigo: 'TLS', nome: 'TRES LAGOAS' },
  { codigo: 'VDC', nome: 'VITORIA DA CONQUISTA' },
  { codigo: 'VIX', nome: 'VIANA' },
  { codigo: 'VLH', nome: 'VILHENA' },
  { codigo: 'VZG', nome: 'CUIABA' },
]

const filialMap = Object.fromEntries(FILIAIS.map(f => [f.codigo, f.nome]))

export function getNomeFilial(codigo) {
  return filialMap[codigo] || codigo
}
