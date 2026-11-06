// =====================================================================
// PERFIS DE ACESSO
// Não existe servidor: o login é verificado no próprio navegador.
// Aqui ficam apenas o "sal" e o hash PBKDF2-SHA256 de cada senha — a
// senha em si não está no código. Isso separa os dados de cada pessoa e
// impede o acesso casual, mas NÃO é segurança de servidor: quem tiver o
// código-fonte pode tentar adivinhar senhas fracas. Não reutilize essas
// senhas em outros serviços.
//
// Para trocar uma senha: gere novo sal + hash (210.000 iterações) e
// substitua os valores abaixo.
// =====================================================================

export interface Profile {
  id: string;
  name: string;
  firstName: string;
  email: string;
  salt: string; // hex
  hash: string; // hex
}

export const PBKDF2_ITERATIONS = 210_000;

export const PROFILES: Profile[] = [
  {
    id: 'kaua',
    name: 'Kauã Lima',
    firstName: 'Kauã',
    email: 'kaua.lima@aprovacao.local',
    salt: '2cf61e1848d8e0bd64e3f5c641629cb9',
    hash: '35b37502efa473783880b90166ac86e2c135247da3e1530345c6d7c7b396d330',
  },
  {
    id: 'anny',
    name: 'Anny Barbosa',
    firstName: 'Anny',
    email: 'anny.barbosa@aprovacao.local',
    salt: 'ce17d276324cff7ec46649d4ecb59c2f',
    hash: 'c3ad5fc4a52155c0811c043c7a29f95ea2ac3d7c5f37f12b1a93375cda30a3fc',
  },
];

export const PROFILE_MAP: Record<string, Profile> = Object.fromEntries(PROFILES.map((p) => [p.id, p]));
