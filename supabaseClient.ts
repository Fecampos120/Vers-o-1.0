
import { createClient } from '@supabase/supabase-js';

// Credenciais fornecidas pelo usuário
const supabaseUrl = 'https://elpjfqmdospwpkjxcdno.supabase.co';
const supabaseKey = 'sb_publishable_l5FSO1jl3BKEZqS550Klkw_3hAf-7sh';

export const supabase = createClient(supabaseUrl, supabaseKey);
