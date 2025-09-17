// src/config/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://grrmkhffntyoqxvzwjkz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdycm1raGZmbnR5b3F4dnp3amt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMzE4ODQsImV4cCI6MjA3MzcwNzg4NH0.AxTCM_GnMGLhTOCObawI3hxvgMQTolVmEqyTcphGHuw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
