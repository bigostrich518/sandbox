import { createClient } from '@supabase/supabase-js';

// These should be configured in your .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function saveBracketToSupabase(userId: string, bracketState: any) {
    const { data, error } = await supabase
        .from('brackets')
        .upsert({
            user_id: userId,
            state: bracketState,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

    if (error) {
        console.error('Error saving bracket:', error);
        throw error;
    }
    return data;
}

export async function loadBracketFromSupabase(userId: string) {
    const { data, error } = await supabase
        .from('brackets')
        .select('state')
        .eq('user_id', userId)
        .single();

    if (error) {
        console.error('Error loading bracket:', error);
        throw error;
    }
    return data?.state;
}
