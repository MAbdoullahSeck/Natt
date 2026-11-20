/** Clés react-query, centralisées pour les invalidations. */
export const cles = {
  mesTontines: ['mes_tontines'] as const,
  tontine: (id: string) => ['tontine', id] as const,
  abonnements: ['abonnements'] as const,
  notifications: ['notifications'] as const,
  historiqueMembre: (tontineId: string, membreId: string) =>
    ['historique', tontineId, membreId] as const,
};
