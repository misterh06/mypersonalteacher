// app/context/UserContext.tsx
import { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../lib/firebaseConfig";

// Définir l'interface pour les données de l'utilisateur
interface UserData {
  userClass: string | null;
  userId: string | null;
  user: User | null;
  loading: boolean;
}

// Créer le contexte avec une valeur par défaut
const UserContext = createContext<UserData>({
  userClass: null,
  userId: null,
  user: null,
  loading: true,
});

// Créer un hook personnalisé pour utiliser le contexte
export const useUser = () => useContext(UserContext);

// Créer un provider pour le contexte
export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userClass, setUserClass] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    console.log("UserContext: useEffect called");
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("UserContext: onAuthStateChanged called");
      console.log("UserContext: currentUser", currentUser);
      setUser(currentUser);
      setUserId(currentUser?.uid || null);
      setLoading(false);
      console.log("UserContext: loading set to false");
    });

    return () => unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ userClass, userId, user, loading }}>
      {children}
    </UserContext.Provider>
  );
};
