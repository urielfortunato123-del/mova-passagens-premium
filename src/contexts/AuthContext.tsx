import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { PassengerProfile, SignUpFormData } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  passengerProfile: PassengerProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signUp: (data: SignUpFormData) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [passengerProfile, setPassengerProfile] = useState<PassengerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('passenger_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPassengerProfile({
          id: data.id,
          userId: data.user_id,
          name: data.name,
          email: data.email,
          phone: data.phone || undefined,
          photo: data.photo || undefined,
          city: data.city || undefined,
          createdAt: data.created_at || undefined,
          updatedAt: data.updated_at || undefined,
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          // Use setTimeout to avoid race conditions with Supabase
          setTimeout(() => fetchProfile(currentSession.user.id), 100);
        } else {
          setPassengerProfile(null);
        }

        setIsLoading(false);
      }
    );

    // THEN get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);

      if (initialSession?.user) {
        fetchProfile(initialSession.user.id);
      }

      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: 'Bem-vindo de volta!',
        description: 'Login realizado com sucesso.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro no login',
        description: error.message || 'Verifique suas credenciais.',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (data: SignUpFormData) => {
    setIsLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create passenger profile
        const { error: profileError } = await supabase
          .from('passenger_profiles')
          .insert({
            user_id: authData.user.id,
            name: data.name,
            email: data.email,
            phone: data.phone || null,
          });

        if (profileError) throw profileError;

        toast({
          title: 'Conta criada!',
          description: 'Sua conta foi criada com sucesso.',
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro no cadastro',
        description: error.message || 'Não foi possível criar sua conta.',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setPassengerProfile(null);
      toast({
        title: 'Até logo!',
        description: 'Você saiu da sua conta.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao sair',
        description: error.message,
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        passengerProfile,
        isLoading,
        login,
        signUp,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
