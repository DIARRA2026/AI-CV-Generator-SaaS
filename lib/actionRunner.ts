import { supabaseAdmin } from "./supabaseAdmin";
import { ExecuterActionResult } from "./types";

/**
 * MONCV.AI - executerAction()
 * ============================================================
 * REGLE ABSOLUE : NE JAMAIS DEBITER AVANT QUE L IA AIT REUSSI.
 * Ce helper est le seul point d entree autorises pour debiter des credits.
 *
 * Ordre d execution garanti :
 * 1. Lit le cout de l action dans action_costs (DB)
 * 2. Si cout > 0 : verifie le solde - refuse si insuffisant
 * 3. Execute generer() - la generation IA
 * 4. Valide le resultat avec valider()
 * 5. Seulement si valide : debite via consommer_credits()
 * 6. Si le debit echoue apres un succes IA : livre quand meme + log incident
 */
export async function executerAction<T>({
  compteId,
  compteType = "user",
  action,
  reference,
  generer,
  valider,
}: {
  compteId: string;
  compteType?: "user" | "org";
  action: string;
  reference: string;
  generer: () => Promise<T>;
  valider: (result: T) => boolean;
}): Promise<ExecuterActionResult<T>> {
  if (!supabaseAdmin) {
    return { ok: false, motif: "service_indisponible" };
  }

  // 1. Lire le cout dans la DB (source de verite - jamais le fichier config)
  const { data: costRow, error: costErr } = await supabaseAdmin
    .from("action_costs")
    .select("cout, actif")
    .eq("cle", action)
    .single();

  if (costErr || !costRow) {
    return { ok: false, motif: "action_inconnue:" + action };
  }
  if (!costRow.actif) {
    return { ok: false, motif: "action_desactivee:" + action };
  }

  const cout: number = costRow.cout;

  // 2. Verifier le solde si action payante
  if (cout > 0) {
    const { data: soldeData } = await supabaseAdmin.rpc("solde_credits", {
      p_compte: compteId,
      p_type: compteType,
    });
    const solde = soldeData?.[0]?.solde ?? 0;
    if (solde < cout) {
      return {
        ok: false,
        solde,
        motif: `solde_insuffisant:${solde}:${cout}`,
      };
    }
  }

  // 3. Executer la generation IA (AVANT tout debit)
  let resultat: T;
  try {
    resultat = await generer();
  } catch (err: any) {
    // Echec IA - aucun credit debite
    console.error("[executerAction] Echec generation IA:", err);
    return {
      ok: false,
      motif: "echec_ia:" + (err?.message ?? "erreur interne"),
    };
  }

  // 4. Valider le resultat
  if (!valider(resultat)) {
    return { ok: false, motif: "resultat_invalide" };
  }

  // 5. Actions gratuites : retourner directement
  if (cout === 0) {
    const { data: soldeData } = await supabaseAdmin.rpc("solde_credits", {
      p_compte: compteId,
      p_type: compteType,
    });
    return {
      ok: true,
      resultat,
      solde: soldeData?.[0]?.solde ?? 0,
      motif: "gratuit",
    };
  }

  // 6. Debiter les credits (APRES succes confirme de l IA)
  const { data: debitData, error: debitErr } = await supabaseAdmin.rpc(
    "consommer_credits",
    {
      p_compte: compteId,
      p_type: compteType,
      p_action: action,
      p_reference: reference,
      p_meta: { action, reference, cout },
    }
  );

  const debitResult = debitData?.[0];

  if (debitErr || !debitResult?.ok) {
    // Incident rare : IA a reussi mais debit echoue (ex: race condition)
    // On livre quand meme le resultat et on log l incident pour resolution manuelle
    const motif = debitResult?.motif ?? debitErr?.message ?? "debit_echoue";
    console.error(
      `[executerAction] INCIDENT DEBIT apres succes IA - compte=${compteId} action=${action} ref=${reference} motif=${motif}`
    );
    // Retourner le resultat quand meme - ne pas penaliser l utilisateur
    const { data: soldeData } = await supabaseAdmin.rpc("solde_credits", {
      p_compte: compteId,
      p_type: compteType,
    });
    return {
      ok: true, // Le resultat est livre
      resultat,
      solde: soldeData?.[0]?.solde ?? 0,
      motif: "incident_debit_livre_quand_meme",
    };
  }

  return {
    ok: true,
    resultat,
    solde: debitResult.restant,
    motif: debitResult.motif,
  };
}
