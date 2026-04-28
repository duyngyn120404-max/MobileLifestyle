import { useAuth } from "@/src/contexts/auth-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { Button, Text, TextInput, useTheme } from "react-native-paper";
    
export default function AuthScreen(){
    const [isSignUp, setIsSignUp] = useState<boolean>(false);
    const [fullName, setFullName] = useState<string>("")
    const [email, setEmail] = useState<string>("")
    const [password, setPassword] = useState<string>("")
    const [confirmPassword, setConfirmPassword] = useState<string>("")
    const [error, setError] = useState<string | null>(null)
    
    const router = useRouter();
    const theme = useTheme()    
    const [loading, setLoading] = useState(false);

    const {signIn, signUp} = useAuth();

    const handleAuth = async () => {
        setLoading(true);
        setError(null);

        if (isSignUp) {
            // Signup validation
            if (!fullName || !email || !password || !confirmPassword) {
                setError("All fields are required.");
                return;
            }
            if (password.length < 6){
                setError("Password must be at least 6 characters long.");
                return;
            }
            if (password !== confirmPassword) {
                setError("Passwords do not match.");
                return;
            }
            const signUpError = await signUp(email, password, fullName);
            if (signUpError) {
                setError(signUpError);
                return;
            }

            setError("Check your email to confirm your account");
        } else {
            // Login validation
            if (!email || !password) {
                setError("Email and password are required.");
                return;
            }
            if (password.length < 6){
                setError("Password must be at least 6 characters long.");
                return;
            }
            const signInError = await signIn(email, password);
            if (signInError) {
                setError(signInError);
                return;
            }
            router.replace("/");
        }
    };


    const handleSwitchMode = () => {
        setIsSignUp((prev) => !prev);
        setError(null);
        setFullName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
    };

    return(
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <View style={styles.content}>
                <Text style={styles.title} variant="headlineMedium">
                    {isSignUp ? "Create Account" : "Welcome back"}</Text>
                
                {isSignUp && (
                    <TextInput
                        label="Full Name"
                        placeholder="John Doe"
                        mode="outlined"
                        style={styles.input}
                        value={fullName}
                        onChangeText={setFullName}
                    />
                )}
                
                <TextInput
                    label="Email"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholder="example@gmail.com"
                    mode="outlined"
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                />
                <TextInput
                    label="Password"
                    secureTextEntry
                    mode="outlined"
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                />
                
                {isSignUp && (
                    <TextInput
                        label="Confirm Password"
                        secureTextEntry
                        mode="outlined"
                        style={styles.input}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                    />
                )}

                {error && <Text style={{color: theme.colors.error, marginBottom: 16}}>{error}</Text>}

                <Button 
                    mode="contained" 
                    style={styles.button}
                    onPress={handleAuth}
                    disabled={loading}
                >
                        {loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
                </Button>
                <Button 
                    mode="text" 
                    onPress={handleSwitchMode} 
                    style={styles.switchModeButton}
                >
                    {isSignUp ? "Already have an account?" : "Don't have an account?"}
                </Button>
                
            </View>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5"
    },
    content: {
        flex: 1,
        padding: 16,
        justifyContent: "center",
    },
    title: {
        textAlign: "center",
        marginBottom: 24,
    },
    input: {
        marginBottom: 16,
    },
    button: {
        marginBottom: 8,
    },
    switchModeButton: {
        marginTop: 16
    }
});
