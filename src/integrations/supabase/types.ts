export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      address_history: {
        Row: {
          address: string
          created_at: string
          id: string
          last_used_at: string
          lat: number | null
          lng: number | null
          passenger_id: string
          used_count: number
        }
        Insert: {
          address: string
          created_at?: string
          id?: string
          last_used_at?: string
          lat?: number | null
          lng?: number | null
          passenger_id: string
          used_count?: number
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          last_used_at?: string
          lat?: number | null
          lng?: number | null
          passenger_id?: string
          used_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "address_history_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "passenger_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_messages: {
        Row: {
          booking_id: string
          id: string
          message: string
          read: boolean | null
          sender: string
          timestamp: string | null
        }
        Insert: {
          booking_id: string
          id?: string
          message: string
          read?: boolean | null
          sender: string
          timestamp?: string | null
        }
        Update: {
          booking_id?: string
          id?: string
          message?: string
          read?: boolean | null
          sender?: string
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          arrival_target_time: string | null
          cancel_reason: string | null
          completed_at: string | null
          created_at: string | null
          driver_id: string | null
          driver_name: string | null
          driver_phone: string | null
          dropoff_address: string
          estimated_value: number
          final_value: number | null
          id: string
          passenger_id: string
          pickup_address: string
          pickup_time: string
          plate: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string | null
          vehicle: string | null
          waiting_time: number | null
          waiting_value: number | null
        }
        Insert: {
          arrival_target_time?: string | null
          cancel_reason?: string | null
          completed_at?: string | null
          created_at?: string | null
          driver_id?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          dropoff_address: string
          estimated_value?: number
          final_value?: number | null
          id?: string
          passenger_id: string
          pickup_address: string
          pickup_time: string
          plate?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string | null
          vehicle?: string | null
          waiting_time?: number | null
          waiting_value?: number | null
        }
        Update: {
          arrival_target_time?: string | null
          cancel_reason?: string | null
          completed_at?: string | null
          created_at?: string | null
          driver_id?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          dropoff_address?: string
          estimated_value?: number
          final_value?: number | null
          id?: string
          passenger_id?: string
          pickup_address?: string
          pickup_time?: string
          plate?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string | null
          vehicle?: string | null
          waiting_time?: number | null
          waiting_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "passenger_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_profiles: {
        Row: {
          created_at: string | null
          is_online: boolean | null
          last_lat: number | null
          last_lng: number | null
          last_seen: string | null
          user_id: string
          vehicle_model: string | null
          vehicle_plate: string | null
          vehicle_year: number | null
        }
        Insert: {
          created_at?: string | null
          is_online?: boolean | null
          last_lat?: number | null
          last_lng?: number | null
          last_seen?: string | null
          user_id: string
          vehicle_model?: string | null
          vehicle_plate?: string | null
          vehicle_year?: number | null
        }
        Update: {
          created_at?: string | null
          is_online?: boolean | null
          last_lat?: number | null
          last_lng?: number | null
          last_seen?: string | null
          user_id?: string
          vehicle_model?: string | null
          vehicle_plate?: string | null
          vehicle_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_addresses: {
        Row: {
          address: string
          created_at: string | null
          id: string
          label: string
          lat: number | null
          lng: number | null
          passenger_id: string
        }
        Insert: {
          address: string
          created_at?: string | null
          id?: string
          label: string
          lat?: number | null
          lng?: number | null
          passenger_id: string
        }
        Update: {
          address?: string
          created_at?: string | null
          id?: string
          label?: string
          lat?: number | null
          lng?: number | null
          passenger_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_addresses_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "passenger_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      passenger_profiles: {
        Row: {
          city: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          phone: string | null
          photo: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          email: string
          id?: string
          name: string
          phone?: string | null
          photo?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          city?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          photo?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          brand: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          last4: string | null
          passenger_id: string
          type: string
        }
        Insert: {
          brand?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          last4?: string | null
          passenger_id: string
          type: string
        }
        Update: {
          brand?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          last4?: string | null
          passenger_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "passenger_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          payload: Json | null
          ride_id: string
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          ride_id: string
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          ride_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ride_events_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_offers: {
        Row: {
          created_at: string | null
          driver_id: string
          expires_at: string
          id: string
          ride_id: string
          status: string
        }
        Insert: {
          created_at?: string | null
          driver_id: string
          expires_at: string
          id?: string
          ride_id: string
          status?: string
        }
        Update: {
          created_at?: string | null
          driver_id?: string
          expires_at?: string
          id?: string
          ride_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ride_offers_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_offers_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      rides: {
        Row: {
          created_at: string | null
          dest_address: string
          dest_lat: number
          dest_lng: number
          driver_id: string | null
          id: string
          origin_address: string
          origin_lat: number
          origin_lng: number
          passenger_id: string
          price_cents: number | null
          scheduled_for: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dest_address: string
          dest_lat: number
          dest_lng: number
          driver_id?: string | null
          id?: string
          origin_address: string
          origin_lat: number
          origin_lng: number
          passenger_id: string
          price_cents?: number | null
          scheduled_for?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dest_address?: string
          dest_lat?: number
          dest_lng?: number
          driver_id?: string | null
          id?: string
          origin_address?: string
          origin_lat?: number
          origin_lng?: number
          passenger_id?: string
          price_cents?: number | null
          scheduled_for?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rides_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rides_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      users_profile: {
        Row: {
          created_at: string | null
          full_name: string
          id: string
          phone: string | null
          role: string
        }
        Insert: {
          created_at?: string | null
          full_name: string
          id: string
          phone?: string | null
          role: string
        }
        Update: {
          created_at?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          role?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      find_nearby_drivers: {
        Args: { p_lat: number; p_limit?: number; p_lng: number }
        Returns: {
          distance_km: number
          driver_id: string
        }[]
      }
      get_passenger_id: { Args: never; Returns: string }
      haversine_distance: {
        Args: { lat1: number; lat2: number; lng1: number; lng2: number }
        Returns: number
      }
      upsert_address_history: {
        Args: { p_address: string; p_lat?: number; p_lng?: number }
        Returns: string
      }
    }
    Enums: {
      booking_status:
        | "requested"
        | "confirmed"
        | "enroute"
        | "arrived"
        | "in_progress"
        | "completed"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      booking_status: [
        "requested",
        "confirmed",
        "enroute",
        "arrived",
        "in_progress",
        "completed",
        "cancelled",
      ],
    },
  },
} as const
