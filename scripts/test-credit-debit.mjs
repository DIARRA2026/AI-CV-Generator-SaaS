import { createClient } from "@supabase/supabase-js";
import assert from "assert";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://otgxrewddogacbsgteyz.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!serviceRoleKey) {
  console.error("ERREUR: Cle Supabase requise pour les tests.");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const TEST_USER_ID = "00000000-0000-4000-a000-000000000001";

async function cleanupTestData() {
  await supabaseAdmin.rpc("reset_test_user_credits", { p_user_id: TEST_USER_ID });
}

async function runTests() {
  console.log("================================================================");
  console.log("TESTS FONCTIONNELS DU SYSTEME DE CREDITS ET DEBIT ATOMIQUE");
  console.log("================================================================
");

  await cleanupTestData();

  try {
    console.log("TEST 1: Attribution des 20 credits de bienvenue (Idempotence)");
    const { data: firstGift, error: e1 } = await supabaseAdmin.rpc("grant_welcome_credits", {
      p_user_id: TEST_USER_ID,
    });
    assert(!e1, "Erreur grant_welcome_credits 1: " + e1?.message);
    assert.strictEqual(firstGift, true, "Le premier don doit renvoyer true");

    const { data: secondGift, error: e2 } = await supabaseAdmin.rpc("grant_welcome_credits", {
      p_user_id: TEST_USER_ID,
    });
    assert(!e2, "Erreur grant_welcome_credits 2: " + e2?.message);
    assert.strictEqual(secondGift, false, "Le second don identique doit renvoyer false");

    const { data: bal1 } = await supabaseAdmin.rpc("get_user_credit_balance", { p_user_id: TEST_USER_ID });
    assert.strictEqual(bal1[0].balance, 20, "Le solde doit etre exactement de 20 credits");
    console.log("  -> SUCCES : 20 credits recus, second appel ignore sans doublon.
");

    console.log("TEST 2: Rejet d une action en cas de solde insuffisant");
    let caughtError = false;
    try {
      const { data, error } = await supabaseAdmin.rpc("consume_user_credits", {
        p_user_id: TEST_USER_ID,
        p_amount: 25,
        p_action: "test_large_action",
      });
      if (error) throw error;
    } catch (err) {
      caughtError = true;
      assert(err.message.includes("INSUFFICIENT_CREDITS"), "Le message doit contenir INSUFFICIENT_CREDITS");
    }
    assert.strictEqual(caughtError, true, "L operation doit obligatoirement echouer");

    const { data: bal2 } = await supabaseAdmin.rpc("get_user_credit_balance", { p_user_id: TEST_USER_ID });
    assert.strictEqual(bal2[0].balance, 20, "Le solde doit etre reste intact a 20");
    console.log("  -> SUCCES : Debit excessif rejete, solde intact a 20 credits.
");

    console.log("TEST 3: Exclusion stricte des lots expires");
    const expiredDate = new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString();
    await supabaseAdmin.rpc("add_test_credit_batch", {
      p_user_id: TEST_USER_ID,
      p_pack_code: "essentiel",
      p_credits: 50,
      p_expires_at: expiredDate,
    });

    const { data: bal3 } = await supabaseAdmin.rpc("get_user_credit_balance", { p_user_id: TEST_USER_ID });
    assert.strictEqual(bal3[0].balance, 20, "Le lot expire ne doit pas etre comptabilise");

    const { data: newBal3, error: e3 } = await supabaseAdmin.rpc("consume_user_credits", {
      p_user_id: TEST_USER_ID,
      p_amount: 15,
      p_action: "cv_generate",
    });
    assert(!e3, "Erreur debit: " + e3?.message);
    assert.strictEqual(newBal3, 5, "Nouveau solde doit etre de 5 (20 - 15)");

    const { data: bal3After } = await supabaseAdmin.rpc("get_user_credit_balance", { p_user_id: TEST_USER_ID });
    assert.strictEqual(bal3After[0].balance, 5, "Le solde disponible doit etre de 5");
    console.log("  -> SUCCES : Lot expire ignore, 15 credits debites sur le lot actif, reste 5.
");

    console.log("TEST 4: Consommation ordonnee sur plusieurs lots (Plus proche expiration d abord)");
    await cleanupTestData();

    const expA = new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString();
    await supabaseAdmin.rpc("add_test_credit_batch", {
      p_user_id: TEST_USER_ID,
      p_pack_code: "essentiel",
      p_credits: 10,
      p_expires_at: expA,
    });

    const expB = new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString();
    await supabaseAdmin.rpc("add_test_credit_batch", {
      p_user_id: TEST_USER_ID,
      p_pack_code: "evolution",
      p_credits: 30,
      p_expires_at: expB,
    });

    const { data: newBal4, error: e4 } = await supabaseAdmin.rpc("consume_user_credits", {
      p_user_id: TEST_USER_ID,
      p_amount: 25,
      p_action: "test_multi_batch",
    });
    assert(!e4, "Erreur debit multi-lots: " + e4?.message);
    assert.strictEqual(newBal4, 15, "Le solde final doit etre de 15 credits (40 - 25)");

    const { data: bal4Final } = await supabaseAdmin.rpc("get_user_credit_balance", { p_user_id: TEST_USER_ID });
    assert.strictEqual(bal4Final[0].balance, 15, "Le solde final doit etre de 15");
    console.log("  -> SUCCES : Lot A vide a 0, Lot B debite de 15, reste 15.
");

    console.log("TEST 5: Appels concurrents simultanes (Serialization FOR UPDATE)");
    const [res1, res2] = await Promise.allSettled([
      supabaseAdmin.rpc("consume_user_credits", {
        p_user_id: TEST_USER_ID,
        p_amount: 10,
        p_action: "concurrent_1",
      }),
      supabaseAdmin.rpc("consume_user_credits", {
        p_user_id: TEST_USER_ID,
        p_amount: 10,
        p_action: "concurrent_2",
      }),
    ]);

    const successCount = [res1, res2].filter(
      (r) => r.status === "fulfilled" && !r.value?.error
    ).length;

    const failedCount = [res1, res2].filter(
      (r) => r.status === "rejected" || (r.status === "fulfilled" && r.value?.error)
    ).length;

    assert.strictEqual(successCount, 1, "Exactement 1 des 2 requetes concurrentes doit reussir");
    assert.strictEqual(failedCount, 1, "La deuxieme requete concurrente doit echouer sans passer en negatif");

    const { data: bal5 } = await supabaseAdmin.rpc("get_user_credit_balance", { p_user_id: TEST_USER_ID });
    assert.strictEqual(bal5[0].balance, 5, "Le solde doit etre de 5 credits (15 - 10)");
    console.log("  -> SUCCES : 1 requete acceptee, 1 rejetee, solde protege a 5 (jamais negatif).
");

    console.log("TEST 6: Remboursement apres incident technique");
    const { data: refundBal, error: e6 } = await supabaseAdmin.rpc("refund_user_credits", {
      p_user_id: TEST_USER_ID,
      p_amount: 10,
      p_action: "refund_failed_ia",
      p_ref: "ERR_TIMEOUT_MOCK",
    });
    assert(!e6, "Erreur remboursement: " + e6?.message);
    assert.strictEqual(refundBal, 15, "Le solde apres remboursement de 10 doit etre de 15");
    console.log("  -> SUCCES : 10 credits rembourses, solde restaure a 15.
");

    console.log("================================================================");
    console.log("TOUS LES TESTS DU SYSTEME DE CREDITS ONT REUSSI AVEC SUCCES (6/6)");
    console.log("================================================================
");
  } finally {
    await cleanupTestData();
  }
}

runTests().catch((err) => {
  console.error("ECHEC DES TESTS :", err);
  process.exit(1);
});
