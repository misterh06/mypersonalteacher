// app/hooks/useUserData.ts
import { useState, useEffect } from "react";
import { doc, getDoc, DocumentData } from "firebase/firestore";
import { db } from "../lib/firebaseConfig";
import { useUser } from "../context/UserContext";

interface UserData {
  userClass: string | null;
  loading: boolean;
}

export const useUserData = () => {
  const [userData, setUserData] = useState<UserData>({ userClass: null, loading: true });
  const { userId, loading: userLoading, user } = useUser(); // Utilisation du contexte pour récupérer l'userId et loading

  useEffect(() => {
    console.log("useUserData: useEffect called");
    console.log("useUserData: userId", userId);
    const fetchUserData = async () => {
      if (userId) {
        try {
          console.log("useUserData: fetching data for userId", userId);
          const userDocRef = doc(db, "users", userId);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            console.log("useUserData: document exists");
            const data = userDocSnap.data() as DocumentData;
            console.log("useUserData: data", data);
            setUserData({
              userClass: data.classe || null, // Récupérer la classe depuis Firestore (champ "classe")
              loading: false,
            });
            console.log("useUserData: loading set to false");
          } else {
            console.log("useUserData: No such document!");
            setUserData({ userClass: null, loading: false });
            console.log("useUserData: loading set to false");
          }
        } catch (error) {
          console.error("useUserData: Error fetching user data:", error);
          setUserData({ userClass: null, loading: false });
          console.log("useUserData: loading set to false");
        }
      } else {
        console.log("useUserData: no userId");
        setUserData({ userClass: null, loading: false });
        console.log("useUserData: loading set to false");
      }
    };

    fetchUserData();
  }, [userId]);

  return { ...userData, loading: userLoading || userData.loading };
};
