import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cgwfbmkxwgrktqzyytbw.supabase.co'

const supabasePublishableKey =
  'sb_publishable__v4B5k-SGxoU0pLWmbOv9g_KnV9ST7J'

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey
)