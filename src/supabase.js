// src/supabase.js
import { createClient } from '@supabase/supabase-js';

// Replace these with your Supabase project URL and anon key
const supabaseUrl = 'https://lwrgwidvlbhyuanhslnc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3cmd3aWR2bGJoeXVhbmhzbG5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMzYyMjMsImV4cCI6MjA3MjYxMjIyM30.qe1J2Z4q8JeXUAvTnOJJ_IZD7LMULKO_8bi082vtEGQ';
export const supabase = createClient(supabaseUrl, supabaseKey);
