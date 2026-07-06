export const CONFERENTES = [
  { codigo: '0811', unidade: 'FOR', apelido: 'JOAB', nome: 'JOAB FERNANDES DE SOUSA' },
  { codigo: '0812', unidade: 'FOR', apelido: 'IGORS', nome: 'IGOR SOARES DA SILVA' },
  { codigo: '0813', unidade: 'FOR', apelido: 'JANIOS', nome: 'JANIO RIBEIRO DA SILVA' },
  { codigo: '0814', unidade: 'HGY', apelido: 'IPETELOS', nome: 'IPETELOS SILVA DOS SANTOS' },
  { codigo: '0815', unidade: 'VIX', apelido: 'SENA', nome: 'RAIMUNDO ALVES DE SENA' },
  { codigo: '0816', unidade: 'VIX', apelido: 'MAFALCAO', nome: 'MARCIA CARDOSO FALCAO' },
  { codigo: '0817', unidade: 'JOI', apelido: 'DAISIELE', nome: 'DAISIELE DOS SANTOS' },
  { codigo: '0818', unidade: 'JOI', apelido: 'MAGNA', nome: 'MAGNA AGLEICE TRAUTEMULLER' },
  { codigo: '0819', unidade: 'SCZ', apelido: 'ESANTOS', nome: 'EDUARDA CRISTINE DOS SANTOS' },
  { codigo: '0820', unidade: 'VZG', apelido: 'THAIANA', nome: 'THAINA DA SILVA FERREIRA' },
  { codigo: '0821', unidade: 'CCX', apelido: 'GIOVANY', nome: 'GIOVANY THALISON MORAIS CAMPOS' },
  { codigo: '0822', unidade: 'HGY', apelido: 'NELSON', nome: 'NELSON GRACIANO BRAGA' },
  { codigo: '0823', unidade: 'HGY', apelido: 'REBEKA', nome: 'REBEKA RODRIGUES DA SILVA' },
  { codigo: '0824', unidade: 'VZG', apelido: 'ALANF', nome: 'ALAN SOARES DE FRANCA' },
  { codigo: '0825', unidade: 'HGY', apelido: 'LARISSAC', nome: 'LARISSA DIAS COSTA' },
  { codigo: '0826', unidade: 'GOI', apelido: 'EDILON', nome: 'EDILON PINHEIRO DA SILVA' },
  { codigo: '0827', unidade: 'GOI', apelido: 'ISABELLA', nome: 'ISABELLA RODRIGUES OLIVEIRA' },
  { codigo: '0828', unidade: 'GYN', apelido: 'RAMOMP', nome: 'RAMON NASCIMENTO PEREIRA' },
  { codigo: '0829', unidade: 'SCZ', apelido: 'ANTONIOG', nome: 'ANTONIO GABRIEL MARTINS GUIMAR' },
  { codigo: '0830', unidade: 'CGR', apelido: 'THOMAZ', nome: 'THOMAZ JEFERSON SANABRIA DUART' },
]

export function getConferente(codigo) {
  return CONFERENTES.find(c => c.codigo === codigo) || null
}
