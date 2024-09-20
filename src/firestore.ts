import { db } from './firebase';
import { collection, doc, setDoc, updateDoc, deleteDoc, getDocs, addDoc, getDoc } from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';

interface Note {
  id: string;
  date: string;
  content: string;
}

interface Vaccine {
  id: string;
  name: string;
  description: string;
  recommendedAge: number;
  recommendedSituation: string;
  frequency: string;
}




interface VaccinationRecord {
  id: string;
  cowId: string;
  vaccineIds: string[];
  date: string;
  lot: string;
  administrator: string;
  notes: string;
  sideEffects: string | null;
}

interface Insemination {
  id: string;
  cowId: string;
  bullId: string;
  date: string;
  hasBirthed: boolean;
  notes: string;
}

interface Check {
  id: string;
  cowId: string;
  date: string;
  checkNumber: number;
}

interface Calf {
  id: string;
  name: string;
  birthDate: string;
  motherCowId: string;
  gender: 'male' | 'female';
  weight: number;
  feedingRecords: FeedingRecord[];
  vaccinations: Vaccination[];
  growthMilestones: GrowthMilestone[];
  notes?: Note[];
}

interface FeedingRecord {
  id: string;
  date: string;
  type: string;
  amount: number;
  unit: 'litros' | 'kilos';
}

interface Vaccination {
  id: string;
  date: string;
  type: string;
}

interface GrowthMilestone {
  id: string;
  date: string;
  description: string;
}

interface PregnantCow {
  id: string;
  name: string;
  breedingDate: string;
  weight: number;
  health: 'Buena' | 'Regular' | 'Mala';
  activity: 'Alta' | 'Normal' | 'Baja';
  estimatedDueDate: string;
  notes: string[];
}

interface Cow {
  id: string;
  name: string;
  breed: string;
  birthDate: string;
  geneticInfo: string;
  healthHistory: string;
  uniqueTraits: string;
  vaccinations: Vaccination[];
  treatments: Treatment[];
  milkProduction: MilkProduction[];
  feedingSchedule: FeedingSchedule[];
  notes: string[];
}

interface Vaccination {
  id: string;
  date: string;
  type: string;
}

interface Treatment {
  id: string;
  date: string;
  description: string;
  medication: string;
}

interface MilkProduction {
  id: string;
  date: string;
  amount: number;
}

interface FeedingSchedule {
  id: string;
  feedType: string;
  frequency: string;
  amount: number;
}

interface MilkCow {
  id: string;
  name: string;
  tag: string;
}

interface MilkProductionRecord {
  id: string;
  cowId: string;
  date: string;
  morning: number;
  afternoon: number;
  evening: number;
  total: number;
  quality: {
    fat: number | undefined;
    protein: number | undefined;
  };
}

interface MilkIncident {
  id: string;
  cowId: string | null;
  date: string;
  description: string;
  type: 'mastitis' | 'injury' | 'other';
}

// Helper function to handle Firestore errors
const handleFirestoreError = (error: unknown, operation: string) => {
  console.error(`Error in ${operation}:`, error);
  if (error instanceof FirebaseError) {
    console.error("Código de error de Firebase:", error.code);
    console.error("Mensaje de error de Firebase:", error.message);
  }
  throw new Error(`Failed to ${operation}. Please try again.`);
};

// Funciones para el control de vacunas
export async function getVaccines(userId: string): Promise<Vaccine[]> {
  try {
    const vaccinesRef = collection(db, 'users', userId, 'vaccines');
    const vaccinesSnap = await getDocs(vaccinesRef);
    return vaccinesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vaccine));
  } catch (error) {
    handleFirestoreError(error as Error, 'get vaccines');
    return [];
  }
}

export async function addVaccine(userId: string, vaccineData: Omit<Vaccine, 'id'>): Promise<string> {
  try {
    const vaccinesRef = collection(db, 'users', userId, 'vaccines');
    const newVaccineRef = doc(vaccinesRef);
    await setDoc(newVaccineRef, vaccineData);
    return newVaccineRef.id;
  } catch (error) {
    handleFirestoreError(error as Error, 'add vaccine');
    return '';
  }
}

export async function updateVaccine(userId: string, vaccineId: string, vaccineData: Omit<Vaccine, 'id'>): Promise<void> {
  try {
    console.log('Iniciando updateVaccine');
    console.log('userId:', userId);
    console.log('vaccineId:', vaccineId);
    console.log('vaccineData:', vaccineData);
    
    const vaccineRef = doc(db, 'users', userId, 'vaccines', vaccineId);
    console.log('Referencia del documento creada:', vaccineRef.path);
    
    await updateDoc(vaccineRef, vaccineData);
    console.log('Documento de vacuna actualizado con éxito');
  } catch (error) {
    console.error("Error en updateVaccine:", error);
    if (error instanceof FirebaseError) {
      console.error("Código de error de Firebase:", error.code);
      console.error("Mensaje de error de Firebase:", error.message);
    }
    throw error;
  }
}

export async function deleteVaccine(userId: string, vaccineId: string): Promise<void> {
  try {
    const vaccineRef = doc(db, 'users', userId, 'vaccines', vaccineId);
    await deleteDoc(vaccineRef);
    console.log('Vaccine permanently deleted');
  } catch (error) {
    console.error("Error deleting vaccine:", error);
    throw error;
  }
}

// Funciones para el control de registros de vacunación
export async function getVaccinationRecords(userId: string): Promise<VaccinationRecord[]> {
  try {
    const recordsRef = collection(db, 'users', userId, 'vaccinationRecords');
    const recordsSnap = await getDocs(recordsRef);
    return recordsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as VaccinationRecord));
  } catch (error) {
    handleFirestoreError(error as Error, 'get vaccination records');
    return [];
  }
}

export async function addVaccinationRecord(userId: string, recordData: Omit<VaccinationRecord, 'id'>): Promise<string> {
  try {
    console.log('Iniciando addVaccinationRecord');
    console.log('userId:', userId);
    console.log('recordData:', recordData);
    
    const recordsRef = collection(db, 'users', userId, 'vaccinationRecords');
    console.log('Referencia de colección creada');
    
    const docRef = await addDoc(recordsRef, recordData);
    console.log('Documento añadido con ID:', docRef.id);
    
    return docRef.id;
  } catch (error: unknown) {
    console.error("Error en addVaccinationRecord:", error);
    if (error instanceof FirebaseError) {
      console.error("Código de error de Firebase:", error.code);
      console.error("Mensaje de error de Firebase:", error.message);
    }
    throw error;
  }
}

export async function updateVaccinationRecord(userId: string, recordId: string, recordData: Omit<VaccinationRecord, 'id'>): Promise<void> {
  try {
    console.log('Iniciando updateVaccinationRecord');
    console.log('userId:', userId);
    console.log('recordId:', recordId);
    console.log('recordData:', recordData);
    
    const recordRef = doc(db, 'users', userId, 'vaccinationRecords', recordId);
    console.log('Referencia del documento creada:', recordRef.path);
    
    await updateDoc(recordRef, recordData);
    console.log('Documento de registro de vacunación actualizado con éxito');
  } catch (error) {
    console.error("Error en updateVaccinationRecord:", error);
    if (error instanceof FirebaseError) {
      console.error("Código de error de Firebase:", error.code);
      console.error("Mensaje de error de Firebase:", error.message);
    }
    throw error;
  }
}

export async function deleteVaccinationRecord(userId: string, recordId: string): Promise<void> {
  try {
    const recordRef = doc(db, 'users', userId, 'vaccinationRecords', recordId);
    await deleteDoc(recordRef);
    console.log('Documento de registro de vacunación eliminado con éxito');
  } catch (error) {
    console.error("Error en deleteVaccinationRecord:", error);
    throw error;
  }
}

export async function updateOrCreateVaccinationRecord(userId: string, recordId: string, recordData: Omit<VaccinationRecord, 'id'>): Promise<void> {
  try {
    const recordRef = doc(db, 'users', userId, 'vaccinationRecords', recordId);
    const recordSnap = await getDoc(recordRef);

    if (recordSnap.exists()) {
      await updateDoc(recordRef, recordData);
    } else {
      await setDoc(recordRef, recordData);
    }
    console.log('Documento de registro de vacunación actualizado o creado con éxito');
  } catch (error) {
    console.error("Error en updateOrCreateVaccinationRecord:", error);
    throw error;
  }
}

// Funciones para el control de preñez

// Funciones para inseminaciones
export async function getInseminations(userId: string): Promise<Insemination[]> {
  try {
    const inseminationsRef = collection(db, 'users', userId, 'inseminations');
    const inseminationsSnap = await getDocs(inseminationsRef);
    return inseminationsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Insemination));
  } catch (error) {
    handleFirestoreError(error as Error, 'get inseminations');
    return [];
  }
}

export async function addInsemination(userId: string, inseminationData: Omit<Insemination, 'id'>): Promise<string> {
  try {
    console.log('Iniciando addInsemination');
    console.log('userId:', userId);
    console.log('inseminationData:', inseminationData);
    
    const inseminationsRef = collection(db, 'users', userId, 'inseminations');
    console.log('Referencia de colección creada');
    
    const docRef = await addDoc(inseminationsRef, inseminationData);
    console.log('Documento de inseminación añadido con ID:', docRef.id);
    
    return docRef.id;
  } catch (error: unknown) {
    console.error("Error en addInsemination:", error);
    if (error instanceof FirebaseError) {
      console.error("Código de error de Firebase:", error.code);
      console.error("Mensaje de error de Firebase:", error.message);
    }
    throw error;
  }
}

export async function updateInsemination(userId: string, inseminationId: string, inseminationData: Partial<Insemination>): Promise<void> {
  try {
    console.log('Iniciando updateInsemination');
    console.log('userId:', userId);
    console.log('inseminationId:', inseminationId);
    console.log('inseminationData:', inseminationData);
    
    const inseminationRef = doc(db, 'users', userId, 'inseminations', inseminationId);
    console.log('Referencia del documento creada:', inseminationRef.path);
    
    await updateDoc(inseminationRef, inseminationData);
    console.log('Documento de inseminación actualizado con éxito');
  } catch (error) {
    console.error("Error en updateInsemination:", error);
    if (error instanceof FirebaseError) {
      console.error("Código de error de Firebase:", error.code);
      console.error("Mensaje de error de Firebase:", error.message);
    }
    throw error;
  }
}

export async function deleteInsemination(userId: string, inseminationId: string): Promise<void> {
  try {
    const inseminationRef = doc(db, 'users', userId, 'inseminations', inseminationId);
    await deleteDoc(inseminationRef);
    console.log('Documento de inseminación eliminado con éxito');
  } catch (error) {
    console.error("Error en deleteInsemination:", error);
    throw error;
  }
}

// Funciones para chequeos
export async function getChecks(userId: string): Promise<Check[]> {
  try {
    const checksRef = collection(db, 'users', userId, 'checks');
    const checksSnap = await getDocs(checksRef);
    return checksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Check));
  } catch (error) {
    handleFirestoreError(error as Error, 'get checks');
    return [];
  }
}

export async function addCheck(userId: string, checkData: Omit<Check, 'id'>): Promise<string> {
  try {
    console.log('Iniciando addCheck');
    console.log('userId:', userId);
    console.log('checkData:', checkData);
    
    const checksRef = collection(db, 'users', userId, 'checks');
    console.log('Referencia de colección creada');
    
    const docRef = await addDoc(checksRef, checkData);
    console.log('Documento de chequeo añadido con ID:', docRef.id);
    
    return docRef.id;
  } catch (error: unknown) {
    console.error("Error en addCheck:", error);
    if (error instanceof FirebaseError) {
      console.error("Código de error de Firebase:", error.code);
      console.error("Mensaje de error de Firebase:", error.message);
    }
    throw error;
  }
}

export async function updateCheck(userId: string, checkId: string, checkData: Partial<Check>): Promise<void> {
  try {
    console.log('Iniciando updateCheck');
    console.log('userId:', userId);
    console.log('checkId:', checkId);
    console.log('checkData:', checkData);
    
    const checkRef = doc(db, 'users', userId, 'checks', checkId);
    console.log('Referencia del documento creada:', checkRef.path);
    
    await updateDoc(checkRef, checkData);
    console.log('Documento de chequeo actualizado con éxito');
  } catch (error) {
    console.error("Error en updateCheck:", error);
    if (error instanceof FirebaseError) {
      console.error("Código de error de Firebase:", error.code);
      console.error("Mensaje de error de Firebase:", error.message);
    }
    throw error;
  }
}

export async function deleteCheck(userId: string, checkId: string): Promise<void> {
  try {
    const checkRef = doc(db, 'users', userId, 'checks', checkId);
    await deleteDoc(checkRef);
    console.log('Documento de chequeo eliminado con éxito');
  } catch (error) {
    console.error("Error en deleteCheck:", error);
    throw error;
  }
}

// Funciones para el seguimiento de crías
export async function getCalves(userId: string): Promise<Calf[]> {
  try {
    const calvesRef = collection(db, 'users', userId, 'calves');
    const calvesSnap = await getDocs(calvesRef);
    const calves: Calf[] = [];

    for (const calfDoc of calvesSnap.docs) {
      const calfData = calfDoc.data() as Omit<Calf, 'id' | 'feedingRecords' | 'vaccinations' | 'growthMilestones' | 'notes'>;
      const calfId = calfDoc.id;

      // Fetch feeding records
      const feedingRecordsRef = collection(calfDoc.ref, 'feedingRecords');
      const feedingRecordsSnap = await getDocs(feedingRecordsRef);
      const feedingRecords = feedingRecordsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedingRecord));

      // Fetch vaccinations
      const vaccinationsRef = collection(calfDoc.ref, 'vaccinations');
      const vaccinationsSnap = await getDocs(vaccinationsRef);
      const vaccinations = vaccinationsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vaccination));

      // Fetch growth milestones
      const growthMilestonesRef = collection(calfDoc.ref, 'growthMilestones');
      const growthMilestonesSnap = await getDocs(growthMilestonesRef);
      const growthMilestones = growthMilestonesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as GrowthMilestone));

      // Fetch notes
      const notesRef = collection(calfDoc.ref, 'notes');
      const notesSnap = await getDocs(notesRef);
      const notes = notesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));

      calves.push({
        id: calfId,
        ...calfData,
        feedingRecords,
        vaccinations,
        growthMilestones,
        notes
      });
    }

    return calves;
  } catch (error) {
    console.error("Error fetching calves:", error);
    throw error;
  }
}

export async function addCalf(userId: string, calfData: Omit<Calf, 'id'>): Promise<string> {
  try {
    const calvesRef = collection(db, 'users', userId, 'calves');
    const newCalfRef = doc(calvesRef);
    const newCalfId = newCalfRef.id;
    const newCalf: Calf = { id: newCalfId, ...calfData };
    await setDoc(newCalfRef, newCalf);
    return newCalfId;
  } catch (error) {
    handleFirestoreError(error as Error, 'add calf');
    return '';
  }
}

export async function updateCalf(userId: string, calfId: string, calfData: Partial<Calf>): Promise<void>
 {
  try {
    const calfRef = doc(db, 'users', userId, 'calves', calfId);
    await updateDoc(calfRef, calfData);
  } catch (error) {
    handleFirestoreError(error as Error, 'update calf');
  }
}

export async function deleteCalf(userId: string, calfId: string): Promise<void> {
  try {
    const calfRef = doc(db, 'users', userId, 'calves', calfId);
    await deleteDoc(calfRef);
  } catch (error) {
    handleFirestoreError(error as Error, 'delete calf');
  }
}

export async function addFeedingRecord(userId: string, calfId: string, recordData: Omit<FeedingRecord, 'id'>): Promise<string> {
  try {
    const calfRef = doc(db, 'users', userId, 'calves', calfId);
    const feedingRecordsRef = collection(calfRef, 'feedingRecords');
    const newRecordRef = doc(feedingRecordsRef);
    const newRecordId = newRecordRef.id;
    const newRecord: FeedingRecord = { id: newRecordId, ...recordData };
    await setDoc(newRecordRef, newRecord);
    return newRecordId;
  } catch (error) {
    console.error("Error adding feeding record:", error);
    throw error;
  }
}

export async function addVaccination(userId: string, calfId: string, vaccinationData: Omit<Vaccination, 'id'>): Promise<string> {
  try {
    const calfRef = doc(db, 'users', userId, 'calves', calfId);
    const vaccinationsRef = collection(calfRef, 'vaccinations');
    const newVaccinationRef = doc(vaccinationsRef);
    const newVaccinationId = newVaccinationRef.id;
    const newVaccination: Vaccination = { id: newVaccinationId, ...vaccinationData };
    await setDoc(newVaccinationRef, newVaccination);
    return newVaccinationId;
  } catch (error) {
    console.error("Error adding vaccination:", error);
    throw error;
  }
}

export async function addGrowthMilestone(userId: string, calfId: string, milestoneData: Omit<GrowthMilestone, 'id'>): Promise<string> {
  try {
    const calfRef = doc(db, 'users', userId, 'calves', calfId);
    const milestonesRef = collection(calfRef, 'growthMilestones');
    const newMilestoneRef = doc(milestonesRef);
    const newMilestoneId = newMilestoneRef.id;
    const newMilestone: GrowthMilestone = { id: newMilestoneId, ...milestoneData };
    await setDoc(newMilestoneRef, newMilestone);
    return newMilestoneId;
  } catch (error) {
    console.error("Error adding growth milestone:", error);
    throw error;
  }
}

export async function updateCalfNotes(userId: string, calfId: string, notes: string): Promise<void> {
  try {
    const calfRef = doc(db, 'users', userId, 'calves', calfId);
    await updateDoc(calfRef, { notes });
  } catch (error) {
    console.error("Error updating calf notes:", error);
    throw error;
  }
}

export async function addNote(userId: string, calfId: string, note: Omit<Note, 'id'>): Promise<string> {
  const calfRef = doc(db, 'users', userId, 'calves', calfId);
  const notesRef = collection(calfRef, 'notes');
  const newNoteRef = await addDoc(notesRef, note);
  return newNoteRef.id;
}

export async function getPregnantCows(userId: string): Promise<PregnantCow[]> {
  try {
    const pregnantCowsRef = collection(db, 'users', userId, 'pregnantCows');
    const pregnantCowsSnap = await getDocs(pregnantCowsRef);
    return pregnantCowsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PregnantCow));
  } catch (error) {
    console.error("Error fetching pregnant cows:", error);
    throw error;
  }
}

export async function addPregnantCow(userId: string, cowData: Omit<PregnantCow, 'id'>): Promise<string> {
  try {
    const pregnantCowsRef = collection(db, 'users', userId, 'pregnantCows');
    const newCowRef = await addDoc(pregnantCowsRef, cowData);
    return newCowRef.id;
  } catch (error) {
    console.error("Error adding pregnant cow:", error);
    throw error;
  }
}

export async function updatePregnantCow(userId: string, cowId: string, cowData: Partial<PregnantCow>): Promise<void> {
  try {
    const cowRef = doc(db, 'users', userId, 'pregnantCows', cowId);
    await updateDoc(cowRef, cowData);
  } catch (error) {
    console.error("Error updating pregnant cow:", error);
    throw error;
  }
}

export async function deletePregnantCow(userId: string, cowId: string): Promise<void> {
  try {
    const cowRef = doc(db, 'users', userId, 'pregnantCows', cowId);
    await deleteDoc(cowRef);
  } catch (error) {
    console.error("Error deleting pregnant cow:", error);
    throw error;
  }
}

export async function addNoteToPregnantCow(userId: string, cowId: string, note: string): Promise<void> {
  try {
    const cowRef = doc(db, 'users', userId, 'pregnantCows', cowId);
    const cowDoc = await getDoc(cowRef);
    if (cowDoc.exists()) {
      const cowData = cowDoc.data() as PregnantCow;
      const updatedNotes = [...(cowData.notes || []), note];
      await updateDoc(cowRef, { notes: updatedNotes });
    } else {
      throw new Error("Pregnant cow not found");
    }
  } catch (error) {
    console.error("Error adding note to pregnant cow:", error);
    throw error;
  }
}

export async function getCows(userId: string): Promise<Cow[]> {
  try {
    const cowsRef = collection(db, 'users', userId, 'cows');
    const cowsSnap = await getDocs(cowsRef);
    return cowsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cow));
  } catch (error) {
    console.error("Error fetching cows:", error);
    throw error;
  }
}

export async function addCow(userId: string, cowData: Omit<Cow, 'id'>): Promise<string> {
  try {
    const cowsRef = collection(db, 'users', userId, 'cows');
    const newCowRef = await addDoc(cowsRef, cowData);
    return newCowRef.id;
  } catch (error) {
    console.error("Error adding cow:", error);
    throw error;
  }
}

export async function updateCow(userId: string, cowId: string, cowData: Partial<Cow>): Promise<void> {
  try {
    const cowRef = doc(db, 'users', userId, 'cows', cowId);
    await updateDoc(cowRef, cowData);
  } catch (error) {
    console.error("Error updating cow:", error);
    throw error;
  }
}

export async function deleteCow(userId: string, cowId: string): Promise<void> {
  try {
    const cowRef = doc(db, 'users', userId, 'cows', cowId);
    await deleteDoc(cowRef);
  } catch (error) {
    console.error("Error deleting cow:", error);
    throw error;
  }
}

export async function addVaccinationToCow(userId: string, cowId: string, vaccination: Omit<Vaccination, 'id'>): Promise<void> {
  try {
    const cowRef = doc(db, 'users', userId, 'cows', cowId);
    const cowDoc = await getDoc(cowRef);
    if (cowDoc.exists()) {
      const cowData = cowDoc.data() as Cow;
      const updatedVaccinations = [...(cowData.vaccinations || []), { ...vaccination, id: Date.now().toString() }];
      await updateDoc(cowRef, { vaccinations: updatedVaccinations });
    } else {
      throw new Error("Cow not found");
    }
  } catch (error) {
    console.error("Error adding vaccination to cow:", error);
    throw error;
  }
}

export async function addTreatmentToCow(userId: string, cowId: string, treatment: Omit<Treatment, 'id'>): Promise<void> {
  try {
    const cowRef = doc(db, 'users', userId, 'cows', cowId);
    const cowDoc = await getDoc(cowRef);
    if (cowDoc.exists()) {
      const cowData = cowDoc.data() as Cow;
      const updatedTreatments = [...(cowData.treatments || []), { ...treatment, id: Date.now().toString() }];
      await updateDoc(cowRef, { treatments: updatedTreatments });
    } else {
      throw new Error("Cow not found");
    }
  } catch (error) {
    console.error("Error adding treatment to cow:", error);
    throw error;
  }
}

export async function addMilkProductionToCow(userId: string, cowId: string, production: Omit<MilkProduction, 'id'>): Promise<void> {
  try {
    const cowRef = doc(db, 'users', userId, 'cows', cowId);
    const cowDoc = await getDoc(cowRef);
    if (cowDoc.exists()) {
      const cowData = cowDoc.data() as Cow;
      const updatedProduction = [...(cowData.milkProduction || []), { ...production, id: Date.now().toString() }];
      await updateDoc(cowRef, { milkProduction: updatedProduction });
    } else {
      throw new Error("Cow not found");
    }
  } catch (error) {
    console.error("Error adding milk production to cow:", error);
    throw error;
  }
}

export async function addFeedingScheduleToCow(userId: string, cowId: string, schedule: Omit<FeedingSchedule, 'id'>): Promise<void> {
  try {
    const cowRef = doc(db, 'users', userId, 'cows', cowId);
    const cowDoc = await getDoc(cowRef);
    if (cowDoc.exists()) {
      const cowData = cowDoc.data() as Cow;
      const updatedSchedule = [...(cowData.feedingSchedule || []), { ...schedule, id: Date.now().toString() }];
      await updateDoc(cowRef, { feedingSchedule: updatedSchedule });
    } else {
      throw new Error("Cow not found");
    }
  } catch (error) {
    console.error("Error adding feeding schedule to cow:", error);
    throw error;
  }
}

export async function addNoteToCow(userId: string, cowId: string, note: string): Promise<void> {
  try {
    const cowRef = doc(db, 'users', userId, 'cows', cowId);
    const cowDoc = await getDoc(cowRef);
    if (cowDoc.exists()) {
      const cowData = cowDoc.data() as Cow;
      const updatedNotes = [...(cowData.notes || []), note];
      await updateDoc(cowRef, { notes: updatedNotes });
    } else {
      throw new Error("Cow not found");
    }
  } catch (error) {
    console.error("Error adding note to cow:", error);
    throw error;
  }
}

// Helper function to handle Firestore errors
const handleMilkFirestoreError = (error: unknown, operation: string) => {
  console.error(`Error in ${operation}:`, error);
  if (error instanceof FirebaseError) {
    console.error("Firebase error code:", error.code);
    console.error("Firebase error message:", error.message);
  }
  throw new Error(`Failed to ${operation}. Please try again.`);
};

// Milk cow management functions
export async function getMilkCows(userId: string): Promise<MilkCow[]> {
  try {
    const cowsRef = collection(db, 'users', userId, 'milkCows');
    const cowsSnap = await getDocs(cowsRef);
    return cowsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MilkCow));
  } catch (error) {
    handleMilkFirestoreError(error, 'fetch milk cows');
    return [];
  }
}

export async function addMilkCow(userId: string, cowData: Omit<MilkCow, 'id'>): Promise<string> {
  try {
    const cowsRef = collection(db, 'users', userId, 'milkCows');
    const newCowRef = await addDoc(cowsRef, cowData);
    return newCowRef.id;
  } catch (error) {
    handleMilkFirestoreError(error, 'add milk cow');
    return '';
  }
}

export async function updateMilkCow(userId: string, cowId: string, cowData: Partial<MilkCow>): Promise<void> {
  try {
    const cowRef = doc(db, 'users', userId, 'milkCows', cowId);
    await updateDoc(cowRef, cowData);
  } catch (error) {
    handleMilkFirestoreError(error, 'update milk cow');
  }
}

export async function deleteMilkCow(userId: string, cowId: string): Promise<void> {
  try {
    const cowRef = doc(db, 'users', userId, 'milkCows', cowId);
    await deleteDoc(cowRef);
  } catch (error) {
    handleMilkFirestoreError(error, 'delete milk cow');
  }
}

// Milk production functions
export async function getMilkProductionRecords(userId: string): Promise<MilkProductionRecord[]> {
  try {
    const productionsRef = collection(db, 'users', userId, 'milkProductionRecords');
    const productionsSnap = await getDocs(productionsRef);
    return productionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MilkProductionRecord));
  } catch (error) {
    handleMilkFirestoreError(error, 'fetch milk production records');
    return [];
  }
}

export async function addMilkProductionRecord(userId: string, productionData: Omit<MilkProductionRecord, 'id'>): Promise<string> {
  try {
    const productionsRef = collection(db, 'users', userId, 'milkProductionRecords');
    const newProductionRef = await addDoc(productionsRef, productionData);
    return newProductionRef.id;
  } catch (error) {
    handleMilkFirestoreError(error, 'add milk production record');
    return '';
  }
}

export async function updateMilkProductionRecord(userId: string, productionId: string, productionData: Partial<MilkProductionRecord>): Promise<void> {
  try {
    const productionRef = doc(db, 'users', userId, 'milkProductionRecords', productionId);
    await updateDoc(productionRef, productionData);
  } catch (error) {
    handleMilkFirestoreError(error, 'update milk production record');
  }
}

export async function deleteMilkProductionRecord(userId: string, productionId: string): Promise<void> {
  try {
    const productionRef = doc(db, 'users', userId, 'milkProductionRecords', productionId);
    await deleteDoc(productionRef);
  } catch (error) {
    handleMilkFirestoreError(error, 'delete milk production record');
  }
}

// Milk incident functions
export async function getMilkIncidents(userId: string): Promise<MilkIncident[]> {
  try {
    const incidentsRef = collection(db, 'users', userId, 'milkIncidents');
    const incidentsSnap = await getDocs(incidentsRef);
    return incidentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MilkIncident));
  } catch (error) {
    handleMilkFirestoreError(error, 'fetch milk incidents');
    return [];
  }
}

export async function addMilkIncident(userId: string, incidentData: Omit<MilkIncident, 'id'>): Promise<string> {
  try {
    const incidentsRef = collection(db, 'users', userId, 'milkIncidents');
    const newIncidentRef = await addDoc(incidentsRef, incidentData);
    return newIncidentRef.id;
  } catch (error) {
    handleMilkFirestoreError(error, 'add milk incident');
    return '';
  }
}

export async function updateMilkIncident(userId: string, incidentId: string, incidentData: Partial<MilkIncident>): Promise<void> {
  try {
    const incidentRef = doc(db, 'users', userId, 'milkIncidents', incidentId);
    await updateDoc(incidentRef, incidentData);
  } catch (error) {
    handleMilkFirestoreError(error, 'update milk incident');
  }
}

export async function deleteMilkIncident(userId: string, incidentId: string): Promise<void> {
  try {
    const incidentRef = doc(db, 'users', userId, 'milkIncidents', incidentId);
    await deleteDoc(incidentRef);
  } catch (error) {
    handleMilkFirestoreError(error, 'delete milk incident');
  }
}

export type { Vaccine, VaccinationRecord, Insemination, Check, Calf, FeedingRecord, Vaccination, GrowthMilestone, Note, PregnantCow, FeedingSchedule, MilkProduction, Treatment, Cow,MilkCow, MilkProductionRecord, MilkIncident }; 