import { db } from "./firebase";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc,
  orderBy, 
  serverTimestamp 
} from "firebase/firestore";

export const interviewService = {
  // Create a new interview session
  async createInterview(userId, interviewData) {
    try {
      const docRef = await addDoc(collection(db, "interviews"), {
        userId,
        ...interviewData,
        status: "Pending",
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error creating interview:", error);
      throw error;
    }
  },

  // Get all interviews for a user
  async getUserInterviews(userId) {
    try {
      const q = query(
        collection(db, "interviews"), 
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore timestamp to JS Date string
        date: doc.data().createdAt?.toDate().toLocaleDateString() || "N/A"
      }));
    } catch (error) {
      console.error("Error fetching interviews:", error);
      throw error;
    }
  },

  // Get a specific interview report
  async getInterviewReport(interviewId) {
    try {
      const docRef = doc(db, "interviews", interviewId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      throw error;
    }
  },

  // Update interview results
  async updateInterview(interviewId, results) {
    try {
      const docRef = doc(db, "interviews", interviewId);
      await updateDoc(docRef, { 
        ...results, 
        status: "Completed",
        updatedAt: serverTimestamp() 
      });
    } catch (error) {
      console.error("Error updating interview:", error);
      throw error;
    }
  }
};
