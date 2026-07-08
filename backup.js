const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('No se encontró el archivo de clave de servicio:', serviceAccountPath);
  console.error('Crea la clave en Firebase Console y guárdala como serviceAccountKey.json en la raíz del proyecto.');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function backupFirestore() {
  const snapshot = {};
  const collections = await db.listCollections();

  for (const collection of collections) {
    const collectionSnapshot = await collection.get();
    snapshot[collection.id] = {};

    collectionSnapshot.forEach((doc) => {
      snapshot[collection.id][doc.id] = doc.data();
    });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(__dirname, `backup-vuelto-${timestamp}.json`);

  fs.writeFileSync(backupFile, JSON.stringify(snapshot, null, 2), 'utf8');
  console.log(`Backup completo escrito en: ${backupFile}`);
}

backupFirestore().catch((error) => {
  console.error('Error al hacer backup de Firestore:', error);
  process.exit(1);
});
