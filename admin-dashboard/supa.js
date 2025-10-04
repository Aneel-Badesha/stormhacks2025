import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Expect window.CONFIG to be defined in config.js
const { SUPABASE_URL, SUPABASE_ANON } = window.CONFIG || {};
if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.error('Missing Supabase configuration. Ensure config.js defines window.CONFIG with SUPABASE_URL and SUPABASE_ANON.');
}

export const supa = createClient(SUPABASE_URL, SUPABASE_ANON);

export const auth = {
  async signIn(email, password){
    return supa.auth.signInWithPassword({ email, password });
  },
  async signOut(){
    return supa.auth.signOut();
  },
  async user(){
    const { data } = await supa.auth.getUser();
    return data?.user || null;
  }
};

// Also expose on window for inline scripts
window.supa = supa;
window.auth = auth;
