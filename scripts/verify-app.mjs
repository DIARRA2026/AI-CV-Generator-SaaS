async function runTests() {
  const baseUrl = 'http://localhost:3000';
  const prodUrl = 'https://ai-cv-generator-saa-s.vercel.app';
  const results = [];

  async function test(name, fn) {
    try {
      const res = await fn();
      results.push({ name, passed: true, details: res });
      console.log('✅ PASS:', name, res ? JSON.stringify(res).slice(0, 120) : '');
    } catch (e) {
      results.push({ name, passed: false, error: e.message });
      console.error('❌ FAIL:', name, e.message);
    }
  }

  console.log('=== TEST 1: PAGES PRINCIPALES (LOCAL) ===');
  await test('Page Accueil (/)', async () => {
    const r = await fetch(baseUrl + '/');
    if (!r.ok) throw new Error('Status ' + r.status);
    const html = await r.text();
    return { status: r.status, htmlLength: html.length };
  });

  await test('Page Création de CV (/create)', async () => {
    const r = await fetch(baseUrl + '/create');
    if (!r.ok) throw new Error('Status ' + r.status);
    return { status: r.status };
  });

  await test('Page Consultation Publique CV (/c/cv-diarra-8651)', async () => {
    const r = await fetch(baseUrl + '/c/cv-diarra-8651');
    if (!r.ok) throw new Error('Status ' + r.status);
    const html = await r.text();
    const hasCrash = html.includes('client-side exception');
    if (hasCrash) throw new Error('Client crash detected in HTML');
    return { status: r.status, clientSafe: true };
  });

  await test('Page Admin (/admin)', async () => {
    const r = await fetch(baseUrl + '/admin');
    if (!r.ok) throw new Error('Status ' + r.status);
    return { status: r.status };
  });

  console.log('\n=== TEST 2: AUTHENTIFICATION ADMIN & SÉCURITÉ ===');
  let adminToken = '';
  await test('Auth SuperAdmin avec Clé Maître (/api/admin/auth)', async () => {
    const passkey = process.env.ADMIN_MASTER_PASSKEY;
    if (!passkey) {
      return { skipped: true, reason: 'ADMIN_MASTER_PASSKEY non configuré' };
    }
    const r = await fetch(baseUrl + '/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',
        passkey,
        email: process.env.ADMIN_ALLOWED_EMAILS?.split(',')[0] || 'innovagroup225@gmail.com'
      })
    });
    const data = await r.json();
    if (!data.success || !data.token) throw new Error(data.message || 'Token absent');
    adminToken = data.token;
    return { success: true, email: data.email, hasToken: true };
  });

  console.log('\n=== TEST 3: NOUVELLE API TRANSACTIONS ADMIN ===');
  await test('Récupération Transactions Cloud (/api/admin/transactions)', async () => {
    const r = await fetch(baseUrl + '/api/admin/transactions', {
      headers: {
        'Authorization': 'Bearer ' + adminToken
      }
    });
    const data = await r.json();
    if (!data.success) throw new Error(data.message || 'Erreur API transactions');
    return {
      success: true,
      count: data.transactions.length,
      stats: data.stats
    };
  });

  console.log('\n=== TEST 4: PASSERELLE LIGDICASH MOBILE MONEY ===');
  let testRef = '';
  let testToken = '';
  await test('Initialisation Checkout LigdiCash (/api/payments/ligdicash/checkout)', async () => {
    const r = await fetch(baseUrl + '/api/payments/ligdicash/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planTier: '2500',
        customerEmail: 'verification.test@moncv.ai',
        customerFirstName: 'Mamadou',
        customerLastName: 'Diarra',
        customerPhone: '+2250700510524'
      })
    });
    const data = await r.json();
    if (!data.success) throw new Error(data.message || 'Erreur checkout');
    testRef = data.transactionRef;
    testToken = data.token;
    return { success: true, ref: testRef, hasToken: Boolean(testToken), checkoutUrl: Boolean(data.checkoutUrl) };
  });

  await test('Statut Transaction LigdiCash (/api/payments/ligdicash/status)', async () => {
    const r = await fetch(baseUrl + '/api/payments/ligdicash/status?token=' + encodeURIComponent(testToken || 'TEST') + '&transaction_id=' + encodeURIComponent(testRef));
    const data = await r.json();
    return { success: data.success, status: data.status };
  });

  await test('Webhook Callback LigdiCash (/api/webhooks/ligdicash)', async () => {
    const r = await fetch(baseUrl + '/api/webhooks/ligdicash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'completed',
        token: testToken,
        custom_data: [
          { keyof_customdata: 'transaction_id', valueof_customdata: testRef }
        ]
      })
    });
    const data = await r.json();
    return { responseStatus: r.status, data };
  });

  console.log('\n=== TEST 5: VÉRIFICATION DE LA PRODUCTION EN LIGNE (VERCEL) ===');
  await test('Prod - Page Accueil', async () => {
    const r = await fetch(prodUrl + '/');
    return { status: r.status };
  });

  await test('Prod - Page CV Public (/c/cv-diarra-8651)', async () => {
    const r = await fetch(prodUrl + '/c/cv-diarra-8651');
    const html = await r.text();
    const hasCrash = html.includes('client-side exception');
    if (hasCrash) throw new Error('Client crash detected in prod HTML');
    return { status: r.status, htmlLength: html.length, clientSafe: !hasCrash };
  });

  await test('Prod - Console Admin (/admin)', async () => {
    const r = await fetch(prodUrl + '/admin');
    return { status: r.status };
  });

  await test('Prod - API Resume (/api/resumes/cv-diarra-8651)', async () => {
    const r = await fetch(prodUrl + '/api/resumes/cv-diarra-8651');
    const data = await r.json();
    return { status: r.status, data };
  });

  console.log('\n=== RÉSUMÉ DES VÉRIFICATIONS ===');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`TOTAL: ${results.length} | RÉUSSIS: ${passed} | ÉCHECS: ${failed}`);
}

runTests();
