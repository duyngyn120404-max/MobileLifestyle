import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/src/services/supabase';

type AuthContextType = {
    user: User | null;
    isLoadingUser: boolean;
    signUp: (email: string, password: string, fullName: string) => Promise<string | null>;
    signIn: (email: string, password: string) => Promise<string | null>;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);
 
export function AuthProvider({children}: {children: React.ReactNode}) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoadingUser, setIsLoadingUser] = useState(true);

    useEffect(() => {
        getUser();
        
        // Listen to auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                setUser(session?.user ?? null);
            }
        );

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    const getUser = async () => {
        try {
            const { data: { user: sessionUser } } = await supabase.auth.getUser();
            setUser(sessionUser ?? null);
        } catch(error) {
            setUser(null);
        } finally {
            setIsLoadingUser(false)
        }
    }

    const signUp = async (email: string, password: string, fullName: string) => {
        try {
            // Sign up with Supabase Auth
            const { data: { user: newUser }, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (signUpError) {
                return signUpError.message;
            }

            if (!newUser?.id) {
                return "Failed to create user account";
            }

            // Create user profile in users table using UUID from auth
            const { error: profileError } = await supabase
                .from('users')
                .insert({
                    id: newUser.id,
                    full_name: fullName,
                    email: email,
                });

            if (profileError) {
                return profileError.message;
            }

            setUser(newUser);
            return null;
        } catch (error) {
            if (error instanceof Error) {
                return error.message;
            }
            return "An error occurred during sign up.";
        }
    };

    const signIn = async (email: string, password: string) => {
        try {
            const { data: { user: signInUser }, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                return error.message;
            }

            setUser(signInUser);
            return null;
        } catch (error) {
            if (error instanceof Error) {
                return error.message;
            }
            return "An error occurred during sign in.";
        }
    };

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
            setUser(null);
        } catch(error) {
            console.log(error)
        }
    };

    return( 
        <AuthContext.Provider value={{user, isLoadingUser, signUp, signIn, signOut}}>
            {children}
        </AuthContext.Provider>
    );
};

export function useAuth() {
    const context =  useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
