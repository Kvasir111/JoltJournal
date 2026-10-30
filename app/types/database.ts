export interface Database {
  public: {
    Tables: {
      brands: {
        Row: {
          id: number
          name: string
          normalized_name: string
          created_at: string
        }
        Insert: {
          id?: never
          name: string
          normalized_name: string
          created_at?: string
        }
        Update: {
          name?: string
          normalized_name?: string
          created_at?: string
        }
        Relationships: []
      }
      drinks: {
        Row: {
          id: number
          user_id: string | null
          brand_id: number
          source_key: string | null
          flavor: string
          normalized_flavor: string
          rating: number
          buy_again: boolean | null
          notes: string | null
          tried_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: never
          user_id?: string | null
          brand_id: number
          source_key?: string | null
          flavor: string
          normalized_flavor: string
          rating: number
          buy_again?: boolean | null
          notes?: string | null
          tried_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string | null
          brand_id?: number
          source_key?: string | null
          flavor?: string
          normalized_flavor?: string
          rating?: number
          buy_again?: boolean | null
          notes?: string | null
          tried_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'drinks_brand_id_fkey'
            columns: ['brand_id']
            isOneToOne: false
            referencedRelation: 'brands'
            referencedColumns: ['id']
          }
        ]
      }
      wishlist_items: {
        Row: {
          id: number
          user_id: string
          brand_id: number
          flavor: string
          normalized_flavor: string
          created_at: string
        }
        Insert: {
          id?: never
          user_id: string
          brand_id: number
          flavor: string
          normalized_flavor: string
          created_at?: string
        }
        Update: {
          user_id?: string
          brand_id?: number
          flavor?: string
          normalized_flavor?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'wishlist_items_brand_id_fkey'
            columns: ['brand_id']
            isOneToOne: false
            referencedRelation: 'brands'
            referencedColumns: ['id']
          }
        ]
      }
      site_settings: {
        Row: {
          singleton: boolean
          owner_user_id: string
          created_at: string
        }
        Insert: {
          singleton?: boolean
          owner_user_id: string
          created_at?: string
        }
        Update: {
          singleton?: boolean
          owner_user_id?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      is_site_owner: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      merge_my_brand: {
        Args: {
          source_brand_id: number
          requested_target_name: string
        }
        Returns: Array<{
          source_name: string
          target_name: string
          moved_drinks: number
          moved_wishlist: number
        }>
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
