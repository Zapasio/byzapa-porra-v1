import { Query, getDocs, QuerySnapshot } from 'firebase/firestore';

export async function safeGetDocs(query: Query): Promise<QuerySnapshot> {
  try {
    return await getDocs(query);
  } catch (error: any) {
    if (error.code === 'failed-precondition' && error.message.includes('requires an index')) {
      // Extrae el link del mensaje de error (Firestore lo incluye)
      const indexLink = error.message.match(/You can create it here: (https:\/\/[^\s]+)/)?.[1] || 'Ve a Firebase console > Firestore > Indexes y crea manual.';
      alert(`Error: Necesitas crear un índice en Firestore. Copia este link y ábrelo: ${indexLink}`);
    } else {
      alert(`Error al cargar datos: ${error.message}`);
    }
    throw error;  // Para que el código sepa que falló
  }
}

// Ejemplo de uso en tu código: en lugar de const snapshot = await getDocs(myQuery); usa const snapshot = await safeGetDocs(myQuery);