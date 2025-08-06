
/**
 * API functions for YFF applications
 */
import { supabase } from '@/integrations/supabase/client';
import { ExtendedYffApplication } from '@/types/yff-application';

/**
 * Fetch all YFF applications with individual information
 */
export const fetchYffApplications = async (): Promise<ExtendedYffApplication[]> => {
  console.log('🔍 Fetching YFF applications...');
  
  const { data, error } = await supabase
    .from('yff_applications')
    .select(`
      *,
      individuals (
        individual_id,
        first_name,
        last_name,
        email,
        phone_number
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching YFF applications:', error);
    throw error;
  }

  console.log('✅ Successfully fetched YFF applications:', data?.length || 0);
  return data as ExtendedYffApplication[];
};
