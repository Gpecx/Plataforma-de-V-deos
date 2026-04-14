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
            // Step 1: Generate credential using existing email and provided current password
            const credential = EmailAuthProvider.credential(user.email, data.currentPassword);

            // Step 2: Re-authenticate user to satisfy "recent login" requirement
            await reauthenticateWithCredential(user, credential);

            // Step 3: Perform the password update
            await updatePassword(user, data.newPassword);

            toast.success("Senha alterada com sucesso!");
            return true;
        } catch (error) {
            const fbError = error as FirebaseError;
            console.error("Password Change Error:", fbError.code);

            // Map Firebase codes to user-friendly messages
            let errorMessage = "Ocorreu um erro ao alterar a senha.";

            switch (fbError.code) {
                case "auth/wrong-password":
                    errorMessage = "A senha atual está incorreta.";
                    break;
                case "auth/weak-password":
                    errorMessage = "A nova senha é considerada fraca pela segurança do Firebase.";
                    break;
                case "auth/requires-recent-login":
                    errorMessage = "Sessão expirada. Por favor, faça login novamente.";
                    break;
                case "email-mismatch":
                    errorMessage = "O e-mail fornecido não corresponde ao usuário logado.";
                    break;
            }

            toast.error(errorMessage);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    return { changePassword, isLoading };
};
