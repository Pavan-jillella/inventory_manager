import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAmgA2vm3ra2Mkyb-zmzCte_PzNmUTqeVw',
  authDomain: 'country-inn-suites.firebaseapp.com',
  projectId: 'country-inn-suites',
  storageBucket: 'country-inn-suites.appspot.com',
  messagingSenderId: '799171770616',
  appId: '1:799171770616:web:078f367663dcd07f1ce30d',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearInventory() {
  try {
    console.log('📦 Fetching all inventory items...');
    const itemsRef = collection(db, 'items');
    const snapshot = await getDocs(itemsRef);

    if (snapshot.empty) {
      console.log('✅ Inventory already empty!');
      process.exit(0);
    }

    console.log(`🗑️  Found ${snapshot.size} items. Deleting...`);
    const batch = writeBatch(db);

    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`✅ Successfully deleted ${snapshot.size} items from inventory!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing inventory:', error);
    process.exit(1);
  }
}

clearInventory();
