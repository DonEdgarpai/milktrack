import { db } from './firebase'
import { doc, setDoc, collection } from 'firebase/firestore'

export async function initializeFirestore(userId: string) {
  try {
    // Crear documento de usuario
    await setDoc(doc(db, 'users', userId), {
      email: 'usuario@ejemplo.com',
      createdAt: new Date().toISOString()
    })

    // Crear colección de vacunas
    const vaccinesRef = collection(db, 'users', userId, 'vaccines')
    await setDoc(doc(vaccinesRef), {
      name: 'Vacuna de ejemplo',
      description: 'Esta es una vacuna de ejemplo',
      recommendedAge: 12,
      recommendedSituation: 'Anual',
      frequency: 'Anual'
    })

    // Crear colección de registros de vacunación
    const recordsRef = collection(db, 'users', userId, 'vaccinationRecords')
    await setDoc(doc(recordsRef), {
      cowId: 'Vaca001',
      vaccineIds: ['vacunaEjemplo'],
      date: new Date().toISOString(),
      lot: 'L123456',
      administrator: 'Dr. Ejemplo',
      notes: 'Registro de ejemplo',
      sideEffects: null
    })

    console.log('Firestore inicializado correctamente')
  } catch (error) {
    console.error('Error al inicializar Firestore:', error)
  }
}