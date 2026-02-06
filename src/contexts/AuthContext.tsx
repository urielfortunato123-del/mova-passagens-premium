import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { movaSupabase, onboarding, getMovaToken } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  full_name: string;
  phone?: string;
  role: 'passenger' | 'driver';
}

// Alias para compatibilidade com código antigo
interface PassengerProfile {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  photo?: string;
  city?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface SignUpFormData {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  passengerProfile: PassengerProfile | null; // Alias para compatibilidade
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signUp: (data: SignUpFormData) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Criar passengerProfile como alias de userProfile para compatibilidade
  const passengerProfile: PassengerProfile | null = userProfile && user ? {
    id: userProfile.id,
    userId: userProfile.id,
    name: userProfile.full_name,
    email: user.email,
    phone: userProfile.phone,
  } : null;

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await movaSupabase
        .from('users_profile')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setUserProfile({
          id: data.id,
          full_name: data.full_name,
          phone: data.phone || undefined,
          role: data.role,
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

  const getToken = async (): Promise<string | null> => {
    return getMovaToken();
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = movaSupabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          // Use setTimeout to avoid race conditions with Supabase
          setTimeout(() => fetchProfile(currentSession.user.id), 100);
        } else {
          setUserProfile(null);
        }

        setIsLoading(false);
      }
    );

    // THEN get initial session
    movaSupabase.auth.getSession().then(({ data: { session: initialSession } }) => {
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
      const { data: authData, error } = await movaSupabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if user has a profile, if not create one via onboarding
      if (authData.session && authData.user) {
        const { data: existingProfile, error: profileError } = await movaSupabase
          .from('users_profile')
          .select('id, role')
          .eq('id', authData.user.id)
          .maybeSingle();

        console.log('Profile check:', { existingProfile, profileError });

        const needsPassengerRole = !existingProfile || existingProfile.role !== 'passenger';

        if (needsPassengerRole) {
          // User doesn't have a passenger profile (or has another role) → ensure passenger via onboarding
          try {
            const token = authData.session.access_token;
            const userName = authData.user.user_metadata?.name || email.split('@')[0];
            console.log('Ensuring passenger profile via onboarding for:', userName);
            await onboarding(token, userName);
            console.log('Passenger profile ensured successfully via onboarding');

            // Fetch the newly created/updated profile
            await fetchProfile(authData.user.id);
          } catch (onboardingError) {
            console.error('Onboarding failed:', onboardingError);
            toast({
              variant: 'destructive',
              title: 'Erro ao criar perfil',
              description: 'Tente fazer login novamente.',
            });
            throw onboardingError;
          }
        } else {
          // Profile exists and is passenger, fetch it
          await fetchProfile(authData.user.id);
        }
      }

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
      // 1. Create auth user
      const { data: authData, error: authError } = await movaSupabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (authError) throw authError;

      if (authData.user && authData.session) {
        // 2. Call onboarding API to create profile
        const token = authData.session.access_token;
        await onboarding(token, data.name, data.phone);

        toast({
          title: 'Conta criada!',
          description: 'Sua conta foi criada com sucesso.',
        });
      } else {
        toast({
          title: 'Verifique seu email',
          description: 'Enviamos um link de confirmação para seu email.',
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
      await movaSupabase.auth.signOut();
      setUserProfile(null);
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
        userProfile,
        passengerProfile,
        isLoading,
        login,
        signUp,
        logout,
        refreshProfile,
        getToken,
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
