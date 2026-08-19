import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://lprugrqcobjlagfjvwbm.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwcnVncnFjb2JqbGFnZmp2d2JtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MDYxMTgsImV4cCI6MjA5NzM4MjExOH0.etNnZPdMRIpNgGP9kZV4-QadueXgzmq7s2N0UV06e3Q";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Faltan VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
