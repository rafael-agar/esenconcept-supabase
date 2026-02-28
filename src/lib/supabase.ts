import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wrpsqmdwhwbruqgyjdis.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 'sb_publishable_WpvRoMnWhLgA0pPapkUY1w_PeUvKjcc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
