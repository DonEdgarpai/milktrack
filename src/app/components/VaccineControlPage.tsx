'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Plus, Edit, Trash, Check, Undo2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog"
import { Badge } from "./ui/badge"
import { Switch } from "./ui/switch"
import { Checkbox } from "./ui/checkbox"
import ProtectedRoute from './ProtectedRoute'
import { useUser } from "@clerk/nextjs"
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth'
import { getVaccines, addVaccine, updateVaccine, deleteVaccine, getVaccinationRecords, addVaccinationRecord, updateVaccinationRecord, deleteVaccinationRecord, updateOrCreateVaccinationRecord } from '@/firestore'

interface Vaccine {
  id?: string
  name: string
  description: string
  recommendedAge: number
  recommendedSituation: string
  frequency: string
}

interface VaccinationRecord {
  id?: string
  cowId: string
  vaccineIds: string[]
  date: string
  lot: string
  administrator: string
  notes: string
  sideEffects: string | null
}

interface VaccineControlPageProps {
  onBack: () => void
}

export default function VaccineControlPage({ onBack }: VaccineControlPageProps) {
  const { user } = useUser()
  const { firebaseUser } = useFirebaseAuth()
  const [vaccines, setVaccines] = useState<Vaccine[]>([])
  const [vaccinationRecords, setVaccinationRecords] = useState<VaccinationRecord[]>([])
  const [selectedCow, setSelectedCow] = useState('')
  const [selectedVaccines, setSelectedVaccines] = useState<string[]>([])
  const [newVaccinationDate, setNewVaccinationDate] = useState('')
  const [newVaccinationLot, setNewVaccinationLot] = useState('')
  const [newVaccinationAdministrator, setNewVaccinationAdministrator] = useState('')
  const [newVaccinationNotes, setNewVaccinationNotes] = useState('')
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error' | 'warning', message: string } | null>(null)
  const [isAddingVaccine, setIsAddingVaccine] = useState(false)
  const [newVaccine, setNewVaccine] = useState<Partial<Vaccine>>({})
  const [isEditingVaccine, setIsEditingVaccine] = useState<string | null>(null)
  const [showSideEffectsDialog, setShowSideEffectsDialog] = useState(false)
  const [currentSideEffects, setCurrentSideEffects] = useState('')
  const [currentVaccinationId, setCurrentVaccinationId] = useState<string | null>(null)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(false)
  const [appNotifications, setAppNotifications] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [editingRecord, setEditingRecord] = useState<VaccinationRecord | null>(null)
  const [lastDeletedVaccine, setLastDeletedVaccine] = useState<Vaccine | null>(null)
  const [lastDeletedVaccinationRecord, setLastDeletedVaccinationRecord] = useState<VaccinationRecord | null>(null)
  const [deletedVaccines, setDeletedVaccines] = useState<Vaccine[]>([])

  const loadVaccines = useCallback(async () => {
    if (user && firebaseUser) {
      setIsLoading(true)
      try {
        const loadedVaccines = await getVaccines(firebaseUser.uid)
        setVaccines(loadedVaccines.filter((v): v is Vaccine & { id: string } => v.id !== undefined))
      } catch (error) {
        console.error("Error loading vaccines:", error)
        setAlertMessage({ type: 'error', message: 'Error al cargar las vacunas. Por favor, intenta de nuevo.' })
      } finally {
        setIsLoading(false)
      }
    }
  }, [user, firebaseUser])

const loadVaccinationRecords = useCallback(async () => {
    if (user && firebaseUser) {
      setIsLoading(true)
      try {
        const loadedRecords = await getVaccinationRecords(firebaseUser.uid)
        setVaccinationRecords(loadedRecords.filter((r): r is VaccinationRecord & { id: string } => r.id !== undefined))
      } catch (error) {
        console.error("Error loading vaccination records:", error)
        setAlertMessage({ type: 'error', message: 'Error al cargar los registros de vacunación. Por favor, intenta de nuevo.' })
      } finally {
        setIsLoading(false)
      }
    }
  }, [user, firebaseUser])

  useEffect(() => {
    if (user && firebaseUser) {
      loadVaccines()
      loadVaccinationRecords()
    }
  }, [user, firebaseUser, loadVaccines, loadVaccinationRecords])

  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => setAlertMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [alertMessage])

  const handleAddVaccination = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !firebaseUser) {
      setAlertMessage({ type: 'error', message: 'Debes iniciar sesión para realizar esta acción.' })
      return
    }

    if (!selectedCow || selectedVaccines.length === 0 || !newVaccinationDate || !newVaccinationLot || !newVaccinationAdministrator) {
      setAlertMessage({ type: 'error', message: 'Por favor, complete todos los campos requeridos.' })
      return
    }

    const currentDate = new Date()
    const selectedDate = new Date(newVaccinationDate)

    if (selectedDate > currentDate) {
      setAlertMessage({ type: 'error', message: 'La fecha de vacunación no puede ser superior a la fecha actual.' })
      return
    }

    const newRecord: Omit<VaccinationRecord, 'id'> = {
      cowId: selectedCow,
      vaccineIds: selectedVaccines,
      date: newVaccinationDate,
      lot: newVaccinationLot,
      administrator: newVaccinationAdministrator,
      notes: newVaccinationNotes,
      sideEffects: null
    }

    setIsLoading(true)
    try {
      const newRecordId = await addVaccinationRecord(firebaseUser.uid, newRecord)
      if (newRecordId) {
        setVaccinationRecords(prev => [...prev, { ...newRecord, id: newRecordId }])
        setAlertMessage({ type: 'success', message: 'Registro de vacunación añadido exitosamente.' })
        resetVaccinationForm()
      } else {
        throw new Error('No se pudo obtener el ID del nuevo registro')
      }
    } catch (error) {
      console.error("Error al añadir el registro de vacunación:", error)
      setAlertMessage({ type: 'error', message: `Error al añadir el registro de vacunación: ${error instanceof Error ? error.message : 'Error desconocido'}` })
    } finally {
      setIsLoading(false)
    }
  }

  const resetVaccinationForm = () => {
    setSelectedCow('')
    setSelectedVaccines([])
    setNewVaccinationDate('')
    setNewVaccinationLot('')
    setNewVaccinationAdministrator('')
    setNewVaccinationNotes('')
  }

  const handleEditVaccinationRecord = (record: VaccinationRecord) => {
    setEditingRecord(record)
    setSelectedCow(record.cowId)
    setSelectedVaccines(record.vaccineIds)
    setNewVaccinationDate(record.date)
    setNewVaccinationLot(record.lot)
    setNewVaccinationAdministrator(record.administrator)
    setNewVaccinationNotes(record.notes)
  }

  const handleUpdateVaccinationRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firebaseUser || !editingRecord) {
      setAlertMessage({ type: 'error', message: 'Debes iniciar sesión para realizar esta acción.' });
      return;
    }
  
    if (!selectedCow || selectedVaccines.length === 0 || !newVaccinationDate || !newVaccinationLot || !newVaccinationAdministrator) {
      setAlertMessage({ type: 'error', message: 'Por favor, complete todos los campos requeridos.' });
      return;
    }
  
    const updatedRecord: Omit<VaccinationRecord, 'id'> = {
      cowId: selectedCow,
      vaccineIds: selectedVaccines,
      date: newVaccinationDate,
      lot: newVaccinationLot,
      administrator: newVaccinationAdministrator,
      notes: newVaccinationNotes,
      sideEffects: editingRecord.sideEffects
    };
  
    setIsLoading(true);
    try {
      console.log('Actualizando registro de vacunación:', updatedRecord);
      console.log('ID de usuario:', firebaseUser.uid);
      console.log('ID de registro:', editingRecord.id);
      
      await updateOrCreateVaccinationRecord(firebaseUser.uid, editingRecord.id!, updatedRecord);
      
      setVaccinationRecords(prev => prev.map(r => r.id === editingRecord.id ? { ...updatedRecord, id: editingRecord.id! } : r));
      setAlertMessage({ type: 'success', message: 'Registro de vacunación actualizado exitosamente.' });
      setEditingRecord(null);
      resetVaccinationForm();
    } catch (error) {
      console.error("Error al actualizar el registro de vacunación:", error);
      setAlertMessage({ 
        type: 'error', 
        message: `Error al actualizar el registro de vacunación: ${error instanceof Error ? error.message : 'Error desconocido'}. Por favor, intenta de nuevo.`
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleDeleteVaccinationRecord = async (id: string) => {
    if (!user || !firebaseUser) {
      setAlertMessage({ type: 'error', message: 'Debes iniciar sesión para realizar esta acción.' });
      return;
    }

    setIsLoading(true);
    try {
      const recordToDelete = vaccinationRecords.find(r => r.id === id);
      if (recordToDelete) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: _, ...recordWithoutId } = recordToDelete;
        setLastDeletedVaccinationRecord(recordWithoutId);
      }

      await deleteVaccinationRecord(firebaseUser.uid, id);
      setVaccinationRecords(prev => prev.filter(r => r.id !== id));
      setAlertMessage({ type: 'success', message: 'Registro de vacunación eliminado exitosamente.' });
    } catch (error) {
      console.error("Error al eliminar el registro de vacunación:", error);
      setAlertMessage({ 
        type: 'error', 
        message: `Error al eliminar el registro de vacunación: ${error instanceof Error ? error.message : 'Error desconocido'}. Por favor, intenta de nuevo.`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUndoDeleteVaccinationRecord = async () => {
    if (!user || !firebaseUser || !lastDeletedVaccinationRecord) {
      return;
    }

    setIsLoading(true);
    try {
      const newRecordId = await addVaccinationRecord(firebaseUser.uid, lastDeletedVaccinationRecord);
      setVaccinationRecords(prev => [...prev, { ...lastDeletedVaccinationRecord, id: newRecordId }]);
      setAlertMessage({ type: 'success', message: 'Registro de vacunación restaurado exitosamente.' });
      setLastDeletedVaccinationRecord(null);
    } catch (error) {
      console.error("Error al restaurar el registro de vacunación:", error);
      setAlertMessage({ 
        type: 'error', 
        message: `Error al restaurar el registro de vacunación: ${error instanceof Error ? error.message : 'Error desconocido'}. Por favor, intenta de nuevo.`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddVaccine = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !firebaseUser) {
      setAlertMessage({ type: 'error', message: 'Debes iniciar sesión para realizar esta acción.' })
      return
    }

    if (!newVaccine.name || !newVaccine.description || !newVaccine.recommendedAge || !newVaccine.recommendedSituation || !newVaccine.frequency) {
      setAlertMessage({ type: 'error', message: 'Por favor, complete todos los campos de la nueva vacuna.' })
      return
    }

    setIsLoading(true)
    try {
      const newVaccineId = await addVaccine(firebaseUser.uid, newVaccine as Omit<Vaccine, 'id'>)
      setVaccines(prev => [...prev, { ...newVaccine, id: newVaccineId } as Vaccine])
      setAlertMessage({ type: 'success', message: 'Nueva vacuna añadida exitosamente.' })
      setIsAddingVaccine(false)
      setNewVaccine({})
    } catch (error) {
      console.error("Error adding vaccine:", error)
      setAlertMessage({ type: 'error', message: 'Error al añadir la nueva vacuna. Por favor, intenta de nuevo.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditVaccine = (id: string) => {
    const vaccineToEdit = vaccines.find(v => v.id === id)
    if (vaccineToEdit) {
      setNewVaccine(vaccineToEdit)
      setIsEditingVaccine(id)
    }
  }

  const handleUpdateVaccine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firebaseUser || !isEditingVaccine) {
      setAlertMessage({ type: 'error', message: 'Debes iniciar sesión para realizar esta acción.' });
      return;
    }
  
    if (!newVaccine.name || !newVaccine.description || !newVaccine.recommendedAge || !newVaccine.recommendedSituation || !newVaccine.frequency) {
      setAlertMessage({ type: 'error', message: 'Por favor, complete todos los campos de la vacuna.' });
      return;
    }
  
    setIsLoading(true);
    try {
      console.log('Actualizando vacuna:', newVaccine);
      console.log('ID de usuario:', firebaseUser.uid);
      console.log('ID de vacuna:', isEditingVaccine);
  
      await updateVaccine(firebaseUser.uid, isEditingVaccine, newVaccine as Omit<Vaccine, 'id'>);
      
      setVaccines(prev => prev.map(v => v.id === isEditingVaccine ? { ...newVaccine, id: isEditingVaccine } as Vaccine : v));
      setAlertMessage({ type: 'success', message: 'Vacuna actualizada exitosamente.' });
      setIsEditingVaccine(null);
      setNewVaccine({});
    } catch (error) {
      console.error("Error al actualizar la vacuna:", error);
      setAlertMessage({ 
        type: 'error', 
        message: `Error al actualizar la vacuna: ${error instanceof Error ? error.message : 'Error desconocido'}. Por favor, intenta de nuevo.`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteVaccine = async (id: string) => {
    if (!user || !firebaseUser) {
      setAlertMessage({ type: 'error', message: 'Debes iniciar sesión para realizar esta acción.' })
      return
    }
  
    setIsLoading(true)
    try {
      await deleteVaccine(firebaseUser.uid, id)
      setVaccines(prev => prev.filter(v => v.id !== id))
      setAlertMessage({ type: 'success', message: 'Vacuna eliminada permanentemente del catálogo.' })
    } catch (error) {
      console.error("Error deleting vaccine:", error)
      setAlertMessage({ type: 'error', message: 'Error al eliminar la vacuna del catálogo. Por favor, intenta de nuevo.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUndoDeleteVaccine = async () => {
    if (!user || !firebaseUser || !lastDeletedVaccine) {
      return
    }

    setIsLoading(true)
    try {
      const newVaccineId = await addVaccine(firebaseUser.uid, lastDeletedVaccine)
      setVaccines(prev => [...prev, { ...lastDeletedVaccine, id: newVaccineId }])
      setDeletedVaccines(prev => prev.filter(v => v.id !== lastDeletedVaccine.id))
      setAlertMessage({ type: 'success', message: 'Vacuna restaurada exitosamente.' })
      setLastDeletedVaccine(null)
    } catch (error) {
      console.error("Error restoring vaccine:", error)
      setAlertMessage({ type: 'error', message: 'Error al restaurar la vacuna. Por favor, intenta de nuevo.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSideEffectsSubmit = async () => {
    if (!user || !firebaseUser || !currentVaccinationId) {
      setAlertMessage({ type: 'error', message: 'Debes iniciar sesión para realizar esta acción.' });
      return;
    }

    setIsLoading(true);
    try {
      const updatedRecord = vaccinationRecords.find(r => r.id === currentVaccinationId);
      if (!updatedRecord) {
        throw new Error('No se encontró el registro de vacunación');
      }

      const recordToUpdate: Omit<VaccinationRecord, 'id'> = {
        ...updatedRecord,
        sideEffects: currentSideEffects
      };

      await updateVaccinationRecord(firebaseUser.uid, currentVaccinationId, recordToUpdate);
      setVaccinationRecords(prev => prev.map(r => r.id === currentVaccinationId ? { ...r, sideEffects: currentSideEffects } : r));
      setAlertMessage({ type: 'success', message: 'Efectos secundarios registrados exitosamente.' });
      setShowSideEffectsDialog(false);
      setCurrentSideEffects('');
      setCurrentVaccinationId(null);
    } catch (error) {
      console.error("Error al actualizar los efectos secundarios:", error);
      setAlertMessage({ 
        type: 'error', 
        message: `Error al registrar los efectos secundarios: ${error instanceof Error ? error.message : 'Error desconocido'}. Por favor, intenta de nuevo.`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getUpcomingVaccinations = () => {
    const today = new Date()
    return vaccinationRecords.flatMap(record => {
      return record.vaccineIds.map(vaccineId => {
        const vaccine = vaccines.find(v => v.id === vaccineId) || deletedVaccines.find(v => v.id === vaccineId)
        if (!vaccine) return null

        const lastVaccinationDate = new Date(record.date)
        const nextVaccinationDate = new Date(lastVaccinationDate)

        switch (vaccine.frequency.toLowerCase()) {
          case 'anual':
            nextVaccinationDate.setFullYear(nextVaccinationDate.getFullYear() + 1)
            break
          case 'semestral':
            nextVaccinationDate.setMonth(nextVaccinationDate.getMonth() + 6)
            break
          // Agregar más casos según sea necesario
        }

        if (nextVaccinationDate > today) {
          return {
            id: record.id,
            cowId: record.cowId,
            vaccineName: vaccine.name,
            nextDate: nextVaccinationDate.toISOString().split('T')[0]
          }
        }
        return null
      }).filter((v): v is NonNullable<typeof v> => v !== null)
    })
  }

  const getOverdueVaccinations = () => {
    const today = new Date()
    return vaccinationRecords.flatMap(record => {
      return record.vaccineIds.map(vaccineId => {
        const vaccine = vaccines.find(v => v.id === vaccineId) || deletedVaccines.find(v => v.id === vaccineId)
        if (!vaccine) return null

        const lastVaccinationDate = new Date(record.date)
        const nextVaccinationDate = new Date(lastVaccinationDate)

        switch (vaccine.frequency.toLowerCase()) {
          case 'anual':
            nextVaccinationDate.setFullYear(nextVaccinationDate.getFullYear() + 1)
            break
          case 'semestral':
            nextVaccinationDate.setMonth(nextVaccinationDate.getMonth() + 6)
            break
          // Agregar más casos según sea necesario
        }

        if (nextVaccinationDate < today) {
          return {
            id: record.id,
            cowId: record.cowId,
            vaccineName: vaccine.name,
            dueDate: nextVaccinationDate.toISOString().split('T')[0]
          }
        }
        return null
      }).filter((v): v is NonNullable<typeof v> => v !== null)
    })
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-green-100 to-green-200 p-4 md:p-8">
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg p-4 md:p-8 border border-green-300">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <Image src="/images/vacuna.png" alt="Icono de Vacuna" width={40} height={40} className="mr-4" />
              <h2 className="text-2xl md:text-3xl font-bold text-green-800">Control de Vacunas</h2>
            </div>
            <Button onClick={onBack} variant="outline" className="flex items-center border-green-500 text-green-900 hover:bg-green-100 bg-green-300">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </div>

          <AnimatePresence>
            {alertMessage && (
              <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.5 }}
                className="mb-4"
              >
                <Alert variant={alertMessage.type === 'error' ? 'destructive' : 'default'}>
                  <AlertTitle>{alertMessage.type === 'error' ? 'Error' : alertMessage.type === 'warning' ? 'Advertencia' : 'Éxito'}</AlertTitle>
                  <AlertDescription>{alertMessage.message}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <Card className="mb-8 bg-green-50 border-green-200">
            <CardHeader className="bg-green-100">
              <CardTitle className="text-green-800">
                {editingRecord ? 'Editar Registro de Vacunación' : 'Registrar Nueva Vacunación'}
              </CardTitle>
              <CardDescription>
                {editingRecord ? 'Modifique los detalles del registro de vacunación' : 'Ingrese los detalles de la nueva vacunación'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={editingRecord ? handleUpdateVaccinationRecord : handleAddVaccination} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cow" className="text-green-700">Nombre de la Vaca o ID</Label>
                    <Input
                      id="cow"
                      value={selectedCow}
                      onChange={(e) => setSelectedCow(e.target.value)}
                      placeholder="Ingrese el nombre o ID de la vaca"
                      className="border-green-300 focus:border-green-500 focus:ring-green-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vaccines" className="text-green-700">Vacunas</Label>
                    <div className="space-y-2">
                      {vaccines.map((vaccine) => (
                        <div key={vaccine.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`vaccine-${vaccine.id}`}
                            checked={selectedVaccines.includes(vaccine.id!)}
                            onCheckedChange={(checked) => {
                              if (checked && vaccine.id) {
                                setSelectedVaccines(prev => [...prev, vaccine.id!])
                              } else {
                                setSelectedVaccines(prev => prev.filter(id => id !== vaccine.id))
                              }
                            }}
                          />
                          <Label htmlFor={`vaccine-${vaccine.id}`} className="flex items-center">
                            {vaccine.name}
                            {selectedVaccines.includes(vaccine.id!) && (
                              <Check className="ml-2 h-4 w-4 text-green-500" />
                            )}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-green-700">Fecha de Vacunación</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newVaccinationDate}
                      onChange={(e) => setNewVaccinationDate(e.target.value)}
                      className="border-green-300 focus:border-green-500 focus:ring-green-500"
                      max={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lot" className="text-green-700">Lote de la Vacuna</Label>
                    <Input
                      id="lot"
                      value={newVaccinationLot}
                      onChange={(e) => setNewVaccinationLot(e.target.value)}
                      placeholder="Ej. L123456"
                      className="border-green-300 focus:border-green-500 focus:ring-green-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="administrator" className="text-green-700">Administrador</Label>
                    <Input
                      id="administrator"
                      value={newVaccinationAdministrator}
                      onChange={(e) => setNewVaccinationAdministrator(e.target.value)}
                      placeholder="Nombre del veterinario o responsable"
                      className="border-green-300 focus:border-green-500 focus:ring-green-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-green-700">Notas</Label>
                    <Textarea
                      id="notes"
                      value={newVaccinationNotes}
                      onChange={(e) => setNewVaccinationNotes(e.target.value)}
                      placeholder="Observaciones adicionales"
                      className="border-green-300 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white" disabled={isLoading}>
                  {isLoading ? 'Procesando...' : editingRecord ? 'Actualizar Registro' : 'Registrar Vacunación'}
                </Button>
                {editingRecord && (
                  <Button type="button" onClick={() => {
                    setEditingRecord(null)
                    resetVaccinationForm()
                  }} className="w-full mt-2 bg-gray-200 hover:bg-gray-300 text-gray-800">
                    Cancelar Edición
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>

          <Card className="mb-8 border-green-200">
            <CardHeader className="bg-green-50">
              <CardTitle className="text-green-800">Gestión de Vacunas</CardTitle>
              <CardDescription>Administre el catálogo de vacunas disponibles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isAddingVaccine || isEditingVaccine ? (
                  <form onSubmit={isEditingVaccine ? handleUpdateVaccine : handleAddVaccine} className="space-y-4">
                    <Input
                      placeholder="Nombre de la vacuna"
                      value={newVaccine.name || ''}
                      onChange={(e) => setNewVaccine({ ...newVaccine, name: e.target.value })}
                      className="border-green-300 focus:border-green-500 focus:ring-green-500"
                      required
                    />
                    <Input
                      placeholder="Descripción"
                      value={newVaccine.description || ''}
                      onChange={(e) => setNewVaccine({ ...newVaccine, description: e.target.value })}
                      className="border-green-300 focus:border-green-500 focus:ring-green-500"
                      required
                    />
                    <Input
                      type="number"
                      placeholder="Edad recomendada (meses)"
                      value={newVaccine.recommendedAge || ''}
                      onChange={(e) => setNewVaccine({ ...newVaccine, recommendedAge: parseInt(e.target.value) })}
                      className="border-green-300 focus:border-green-500 focus:ring-green-500"
                      required
                    />
                    <Input
                      placeholder="Situación recomendada"
                      value={newVaccine.recommendedSituation || ''}
                      onChange={(e) => setNewVaccine({ ...newVaccine, recommendedSituation: e.target.value })}
                      className="border-green-300 focus:border-green-500 focus:ring-green-500"
                      required
                    />
                    <Input
                      placeholder="Frecuencia (ej. Anual, Semestral)"
                      value={newVaccine.frequency || ''}
                      onChange={(e) => setNewVaccine({ ...newVaccine, frequency: e.target.value })}
                      className="border-green-300 focus:border-green-500 focus:ring-green-500"
                      required
                    />
                    <div className="flex space-x-2">
                      <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white" disabled={isLoading}>
                        {isLoading ? 'Procesando...' : isEditingVaccine ? 'Actualizar' : 'Agregar'} Vacuna
                      </Button>
                      <Button type="button" variant="outline" onClick={() => {
                        setIsAddingVaccine(false)
                        setIsEditingVaccine(null)
                        setNewVaccine({})
                      }} className="border-green-300 text-green-600 hover:bg-green-100">
                        Cancelar
                      </Button>
                    </div>
                  </form>
                ) : (
                  <Button onClick={() => setIsAddingVaccine(true)} className="bg-green-600 hover:bg-green-700 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Nueva Vacuna
                  </Button>
                )}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Edad Recomendada</TableHead>
                      <TableHead>Situación Recomendada</TableHead>
                      <TableHead>Frecuencia</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vaccines.map((vaccine) => (
                      <TableRow key={vaccine.id}>
                        <TableCell>{vaccine.name}</TableCell>
                        <TableCell>{vaccine.description}</TableCell>
                        <TableCell>{vaccine.recommendedAge} meses</TableCell>
                        <TableCell>{vaccine.recommendedSituation}</TableCell>
                        <TableCell>{vaccine.frequency}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditVaccine(vaccine.id!)} className="border-green-300 text-green-600 hover:bg-green-100">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDeleteVaccine(vaccine.id!)} className="border-red-300 text-red-600 hover:bg-red-100">
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {lastDeletedVaccine && (
                  <Button onClick={handleUndoDeleteVaccine} className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-white">
                    <Undo2 className="mr-2 h-4 w-4" />
                    Deshacer Eliminación
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8 border-green-200">
            <CardHeader className="bg-green-50">
              <CardTitle className="text-green-800">Historial de Vacunación</CardTitle>
              <CardDescription>Registro de todas las vacunas administradas</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Vaca</TableHead>
                    <TableHead>Vacunas</TableHead>
                    <TableHead>Lote</TableHead>
                    <TableHead>Administrador</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vaccinationRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.date}</TableCell>
                      <TableCell>{record.cowId}</TableCell>
                      <TableCell>{record.vaccineIds.map(id => {
                        const vaccine = vaccines.find(v => v.id === id)
                        return vaccine ? vaccine.name : 'Vacuna eliminada'
                      }).join(', ')}</TableCell>
                      <TableCell>{record.lot}</TableCell>
                      <TableCell>{record.administrator}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditVaccinationRecord(record)}
                            className="border-green-300 text-green-600 hover:bg-green-100"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => record.id && handleDeleteVaccinationRecord(record.id)}
                            className="border-red-300 text-red-600 hover:bg-red-100"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCurrentVaccinationId(record.id!)
                              setCurrentSideEffects(record.sideEffects || '')
                              setShowSideEffectsDialog(true)
                            }}
                            className="border-blue-300 text-blue-600 hover:bg-blue-100"
                          >
                            {record.sideEffects ? 'Editar' : 'Agregar'} Efectos
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {lastDeletedVaccinationRecord && (
                <Button onClick={handleUndoDeleteVaccinationRecord} className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-white">
                  <Undo2 className="mr-2 h-4 w-4" />
                  Deshacer Eliminación
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="mb-8 border-green-200">
            <CardHeader className="bg-green-50">
              <CardTitle className="text-green-800">Próximas Vacunaciones</CardTitle>
              <CardDescription>Vacunas programadas para los próximos días</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vaca</TableHead>
                    <TableHead>Vacuna</TableHead>
                    <TableHead>Fecha Programada</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getUpcomingVaccinations().map((vaccination, index) => (
                    <TableRow key={index}>
                      <TableCell>{vaccination.cowId}</TableCell>
                      <TableCell>{vaccination.vaccineName}</TableCell>
                      <TableCell>{vaccination.nextDate}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => vaccination.id && handleDeleteVaccinationRecord(vaccination.id)}
                          className="border-red-300 text-red-600 hover:bg-red-100"
                          disabled={!vaccination.id}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="mb-8 border-green-200">
            <CardHeader className="bg-green-50">
              <CardTitle className="text-green-800">Vacunaciones Atrasadas</CardTitle>
              <CardDescription>Vacunaciones que no se han realizado a tiempo</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vaca</TableHead>
                    <TableHead>Vacuna</TableHead>
                    <TableHead>Fecha Programada</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getOverdueVaccinations().map((vaccination, index) => (
                    <TableRow key={index}>
                      <TableCell>{vaccination.cowId}</TableCell>
                      <TableCell>{vaccination.vaccineName}</TableCell>
                      <TableCell>{vaccination.dueDate}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">Atrasada</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="mb-8 border-green-200">
            <CardHeader className="bg-green-50">
              <CardTitle className="text-green-800">Configuración de Notificaciones</CardTitle>
              <CardDescription>Administre sus preferencias de notificación</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">Notificaciones por Email</Label>
                    <p className="text-sm text-muted-foreground">Reciba recordatorios de vacunación por correo electrónico</p>
                  </div>
                  <Switch
                    id="email-notifications"
                    className={`relative inline-flex items-center h-6 rounded-full w-11 
                      ${emailNotifications ? 'bg-green-500' : 'bg-black'} 
                      before:content-[''] before:absolute before:bg-white before:rounded-full before:w-4 before:h-4 before:transition-transform before:duration-200
                      ${emailNotifications ? 'before:translate-x-6' : 'before:translate-x-1'}`}                    
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                    
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sms-notifications">Notificaciones por SMS</Label>
                    <p className="text-sm text-muted-foreground">Reciba recordatorios de vacunación por mensaje de texto</p>
                  </div>
                  <Switch
                    id="sms-notifications"
                    className={`relative inline-flex items-center h-6 rounded-full w-11 
                      ${smsNotifications ? 'bg-green-500' : 'bg-black'} 
                      before:content-[''] before:absolute before:bg-white before:rounded-full before:w-4 before:h-4 before:transition-transform before:duration-200
                      ${smsNotifications? 'before:translate-x-6' : 'before:translate-x-1'}`}  
                    checked={smsNotifications}
                    onCheckedChange={setSmsNotifications}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="app-notifications">Notificaciones en la App</Label>
                    <p className="text-sm text-muted-foreground">Reciba recordatorios de vacunación dentro de la aplicación</p>
                  </div>
                  <Switch
                    id="app-notifications"
                    className={`relative inline-flex items-center h-6 rounded-full w-11 
                      ${appNotifications ? 'bg-green-500' : 'bg-black'} 
                      before:content-[''] before:absolute before:bg-white before:rounded-full before:w-4 before:h-4 before:transition-transform before:duration-200
                      ${appNotifications? 'before:translate-x-6' : 'before:translate-x-1'}`}  
                    checked={appNotifications}
                    onCheckedChange={setAppNotifications}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Dialog open={showSideEffectsDialog} onOpenChange={setShowSideEffectsDialog} >
            <DialogContent className='bg-white'>
              <DialogHeader>
                <DialogTitle>Registrar Efectos Secundarios</DialogTitle>
                <DialogDescription>
                  Ingrese los efectos secundarios observados después de la vacunación.
                </DialogDescription>
              </DialogHeader>
              <Textarea
                value={currentSideEffects}
                onChange={(e) => setCurrentSideEffects(e.target.value)}
                placeholder="Describa los efectos secundarios observados..."
                className="min-h-[100px]"
              />
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setShowSideEffectsDialog(false)} className='bg-black'>
                  Cancelar
                </Button>
                <Button type="button" onClick={handleSideEffectsSubmit} disabled={isLoading} className='bg-black'>
                  {isLoading ? 'Guardando...' : 'Guardar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </ProtectedRoute>
  )
}