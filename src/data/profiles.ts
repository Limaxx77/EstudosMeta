// =====================================================================
// PERFIS DE ACESSO
// Não existe servidor: o login é verificado no próprio navegador.
// Aqui ficam apenas o "sal" e o hash PBKDF2-SHA256 de cada senha — a
// senha em si não está no código. Isso separa os dados de cada pessoa e
// impede o acesso casual, mas NÃO é segurança de servidor: quem tiver o
// código-fonte pode tentar adivinhar senhas fracas. Não reutilize essas
// senhas em outros serviços.
//
// Para trocar uma senha: rode  node scripts/hash-senha.mjs "nova senha"  e
// substitua os valores abaixo. Maiúsculas, acentos, espaços e hífens
// não importam na hora de digitar a senha.
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
    salt: '85171106419ae5b8c4461f57d4a0ab82',
    hash: '63d72b90f8dec670a1d6feb08be36243c8caa07a9758532c906f2ef2e700978e',
  },
  {
    id: 'anny',
    name: 'Anny Barbosa',
    firstName: 'Anny',
    email: 'anny.barbosa@aprovacao.local',
    salt: '01b15d18208df6efd815ee4ef35c1d26',
    hash: '6e10c88551ada8cbe0a0a672b0a733e822e20109b372c6af9b7ad6b2a89d9c31',
  },
];

export const PROFILE_MAP: Record<string, Profile> = Object.fromEntries(PROFILES.map((p) => [p.id, p]));
