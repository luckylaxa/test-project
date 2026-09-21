/**
 * Placeholder until Phase 2 creates the schema.
 * This file is then regenerated from the live database with the Supabase MCP
 * (generate_typescript_types) — do not hand-edit it after that.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
