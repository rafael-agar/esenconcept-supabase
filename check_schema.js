import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wrpsqmdwhwbruqgyjdis.supabase.co';
const supabaseAnonKey = 'sb_publishable_WpvRoMnWhLgA0pPapkUY1w_PeUvKjcc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { error: err2 } = await supabase.from('order_items').insert({
    order_id: '00000000-0000-0000-0000-000000000000',
    product_id: '00000000-0000-0000-0000-000000000000',
    quantity: 1,
    unit_price: 10,
    variant_id: '00000000-0000-0000-0000-000000000000'
  });
  console.log('Insert Error:', err2);
}
check();
