import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function submitLead(leadData: Record<string, unknown>) {
  const { error } = await supabase.from('leads').insert([leadData])
  if (error) throw error
}