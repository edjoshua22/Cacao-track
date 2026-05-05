// Script to remove only picsum placeholder photos from Firebase
import { getDatabase, ref, get, set } from "firebase/database";
import { app } from "./firebaseConfig.js";

const db = getDatabase(app);

async function removePicsumPhotosOnly() {
  try {
    console.log("🧹 Checking for picsum placeholder photos in Firebase...");
    
    const capturesRef = ref(db, "captures");
    const capturesSnap = await get(capturesRef);
    
    if (capturesSnap.exists()) {
      const captures = capturesSnap.val();
      let removedCount = 0;
      let keptCount = 0;
      
      // Filter out picsum photos only
      const filteredCaptures = {};
      
      Object.keys(captures).forEach(key => {
        const url = captures[key];
        if (url && url.includes('picsum.photos')) {
          console.log(`🗑️  Removing picsum photo: ${key}`);
          removedCount++;
        } else {
          // Keep real photos
          filteredCaptures[key] = url;
          console.log(`✅ Keeping real photo: ${key}`);
          keptCount++;
        }
      });
      
      // Update Firebase with only real photos
      await set(ref(db, "captures"), filteredCaptures);
      
      console.log(`\n📊 Summary:`);
      console.log(`🗑️  Removed ${removedCount} picsum placeholder photos`);
      console.log(`✅ Kept ${keptCount} real photos`);
      console.log(`🎉 Picsum photos cleaned up successfully!`);
      
    } else {
      console.log("ℹ️  No captures found in Firebase");
    }
    
  } catch (error) {
    console.error("❌ Error removing picsum photos:", error);
  }
}

// Run the cleanup
removePicsumPhotosOnly();
