-- TEST CI : INVARIANT B2B < B2C
-- Cette requete DOIT retourner 0 ligne.
-- Si elle retourne des lignes, l invariant est viole et le deploy doit etre bloque.

SELECT
  b.slug,
  b.nom,
  ROUND(b.prix_fcfa::NUMERIC / b.credits, 4) AS prix_credit_b2b,
  c.seuil_b2c,
  'VIOLATION: ' || b.slug || ' a ' || ROUND(b.prix_fcfa::NUMERIC / b.credits, 4) || ' F/credit >= seuil B2C ' || c.seuil_b2c AS message
FROM public.credit_packs b
CROSS JOIN LATERAL (
  SELECT ROUND(MIN(prix_fcfa::NUMERIC / credits), 4) AS seuil_b2c
  FROM public.credit_packs
  WHERE segment = 'b2c' AND prix_fcfa > 0 AND actif
) c
WHERE b.segment = 'b2b'
  AND b.actif
  AND b.prix_fcfa > 0
  AND b.prix_fcfa::NUMERIC / b.credits >= c.seuil_b2c;

-- Verification complementaire : tous les packs B2B doivent avoir un prix/credit < seuil B2C
-- Valeurs attendues :
--   B2C plancher : 8.33 F/credit (Carriere 5000/600)
--   B2B max :      6.67 F/credit (Revendeur 10000/1500)
SELECT
  slug,
  nom,
  segment,
  prix_fcfa,
  credits,
  ROUND(prix_fcfa::NUMERIC / credits, 2) AS prix_credit
FROM public.credit_packs
WHERE actif AND prix_fcfa > 0
ORDER BY segment, prix_credit DESC;
