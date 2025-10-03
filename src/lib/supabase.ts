import { supabase } from '@/integrations/supabase/client'

export async function submitLead(leadData: Record<string, unknown>) {
  const { error } = await supabase.from('leads').insert([leadData])
  if (error) throw error
}