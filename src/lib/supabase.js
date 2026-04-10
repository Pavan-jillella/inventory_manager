import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isValidUrl = supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://');

export const supabase = (isValidUrl && supabaseKey && supabaseKey !== 'your_anon_key_here') 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;
