const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const serviceAccount = require("./service-account.json");

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();
const CLUB_ID = "ciudad-real";

const COLECCIONES = [
  "mant_equipo",
  "mant_tareas",
  "mant_partes",
  "mant_aplicaciones",
  "mant_maquinaria",
  "mant_fichajes",
];

async function migrarColeccion(nombre) {
  const origenRef = db.collection(nombre);
  const destinoRef = db.collection("clubes").doc(CLUB_ID).collection(nombre);
  const snapshot = await origenRef.get();

  if (snapshot.empty) {
    console.log(`  (${nombre}) no tiene documentos, se omite.`);
    return 0;
  }

  let contador = 0;
  const lote = db.batch();

  snapshot.forEach((doc) => {
    const destinoDoc = destinoRef.doc(doc.id);
    lote.set(destinoDoc, doc.data());
    contador++;
  });

  await lote.commit();
  console.log(`  (${nombre}) migrados ${contador} documentos.`);
  return contador;
}

async function main() {
  console.log(`Migrando datos al club "${CLUB_ID}"...\n`);
  let total = 0;

  for (const coleccion of COLECCIONES) {
    total += await migrarColeccion(coleccion);
  }

  console.log(`\nHecho. Total de documentos migrados: ${total}`);
  console.log("Las colecciones originales NO se han borrado, por seguridad.");
}

main().catch((err) => {
  console.error("Error durante la migración:", err);
  process.exit(1);
});