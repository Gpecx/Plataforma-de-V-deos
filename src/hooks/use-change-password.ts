import { useState } from "react";
import {
    reauthenticateWithCredential,
    EmailAuthProvider,
    updatePassword
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { PasswordChangeInput } from "@/lib/validations/auth";

export const useChangePassword = () => {
    const [isLoading, setIsLoading] = useState(false);

    const changePassword = async (data: PasswordChangeInput) => {
        const user = auth.currentUser;

        if (!user || !user.email) {
            toast.error("Usuário não autenticado.");
            return false;
        }

        setIsLoading(true);

        try {
            // Step 1: Protocolo 1 - Reautenticação Obrigatória
            const credential = EmailAuthProvider.credential(user.email, data.currentPassword);
            await reauthenticateWithCredential(user, credential);

            // Step 2: Protocolo 2 - Update Silencioso
            await updatePassword(user, data.newPassword);

            // Step 3: Protocolo - Sincronização de Sessão (Server-side)
            const newToken = await user.getIdToken(true);
            await fetch('/api/auth/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken: newToken })
            });

            toast.success("Senha atualizada com sucesso!");
            return true;
        } catch (error) {
            const fbError = error as FirebaseError;
            console.error("Password Change Error:", fbError.code);

            // Step 4: Protocolo 3 - Tratamento de Erros sem Redirecionamento Punitivo
            let errorMessage = "Ocorreu um erro ao alterar a senha.";

            switch (fbError.code) {
                case "auth/wrong-password":
                    errorMessage = "A senha atual está incorreta.";
                    break;
                case "auth/weak-password":
                    errorMessage = "A nova senha é considerada fraca.";
                    break;
                case "auth/requires-recent-login":
                    errorMessage = "Sessão expirada. Por favor, reautentique-se.";
                    break;
            }

            toast.error(errorMessage);
            return false;
        }
 finally {
            setIsLoading(false);
        }
    };

    return { changePassword, isLoading };
};
