const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://otgxrewddogacbsgteyz.supabase.co";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90Z3hyZXdkZG9nYWNic2d0ZXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0NjY3ODIsImV4cCI6MjEwNDA0Mjc4Mn0.CiEQ_Q567aEKcyj1hOwnavnvPvrwtchucVrusoUwVlI";

const client = createClient(supabaseUrl, anonKey);

async function check() {
  console.log("Checking Supabase connection...");
  const tables = [
    'plans',
    'orders',
    'payment_transactions',
    'payment_events',
    'credit_wallets',
    'credit_transactions',
    'credit_reservations',
    'credit_packages',
    'credit_costs',
    'ai_usage',
    'profiles',
    'subscriptions',
    'credit_batches'
  ];
  
  for (const table of tables) {
    try {
      const { data, error } = await client.from(table).select('*').limit(1);
      if (error) {
        console.log(`Table [${table}]: ERROR (${error.code || 'NO_CODE'}) -> ${error.message}`);
      } else {
        console.log(`Table [${table}]: OK (${data ? data.length : 0} rows found)`);
      }
    } catch (err) {
      console.log(`Table [${table}]: EXCEPTION -> ${err.message}`);
    }
  }
}

check();
