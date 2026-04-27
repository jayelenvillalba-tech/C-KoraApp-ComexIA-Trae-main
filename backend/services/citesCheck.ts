const CITES_KEYWORDS = [
  'caiman', 'cocodrilo', 'tortuga', 'loro', 'papagayo',
  'jaguar', 'puma', 'vicuña', 'guanaco', 'ñandú',
  'madera precur', 'cedro', 'palo santo', 'araucaria', 'quebracho',
  'coral', 'caviar', 'esturión', 'tiburón',
  'caoba', 'rosewood', 'mahogany', 'ebony',
  'marfil', 'ivory', 'orchid', 'orquídea', 'cactus',
];

export async function checkCitesRestriction(
  productDescription: string
): Promise<{
  hasCitesRisk: boolean;
  warning: string | null;
  requiresPermit: boolean;
}> {
  const desc = productDescription.toLowerCase();
  const hasKeyword = CITES_KEYWORDS.some(kw => desc.includes(kw));

  if (!hasKeyword) return { hasCitesRisk: false, warning: null, requiresPermit: false };

  return {
    hasCitesRisk: true,
    warning: '⚠️ Este producto podría estar sujeto a restricciones CITES (especies protegidas). Verificar antes de publicar en: checklist.cites.org',
    requiresPermit: true,
  };
}
