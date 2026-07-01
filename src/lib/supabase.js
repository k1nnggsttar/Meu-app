import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://emszbetrqacghzddodsr.supabase.co'
const supabaseKey = 'sb_publishable_M-Tf9hCg96rG1LtjCO17Ww_PIFxkYU0'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  }
})

