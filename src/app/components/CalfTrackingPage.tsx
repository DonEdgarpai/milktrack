'use client'

import { useState, useEffect, useCallback } from 'react'
import { PlusCircle, Trash2, Edit2, Save, X, ChevronDown, ChevronUp, ArrowLeft, Undo2, FileText } from 'lucide-react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { Textarea } from "./ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { motion, AnimatePresence } from 'framer-motion'
import ProtectedRoute from './ProtectedRoute'
import { useUser } from "@clerk/nextjs"
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth'
import { getCalves, addCalf, updateCalf, deleteCalf, addFeedingRecord, addVaccination, addGrowthMilestone, addNote, Calf, FeedingRecord, Vaccination, GrowthMilestone, Note } from '@/firestore'

interface CalfTrackingPageProps {
  onBack: () => void
}

const feedingOptions = [
  'Leche materna',
  'Leche en polvo',
  'Concentrado inicial',
  'Heno',
  'Ensilaje',
  'Pasto fresco',
  'Suplemento vitamínico',
  'Suplemento mineral',
  'Probióticos',
  'Electrolitos',
  'Otro'
]

const vaccinationOptions = [
  'Vacuna contra la diarrea viral bovina',
  'Vacuna contra la rinotraqueítis infecciosa bovina',
  'Vacuna contra la parainfluenza-3',
  'Vacuna contra el rotavirus',
  'Vacuna contra el coronavirus',
  'Vacuna contra la leptospirosis',
  'Vacuna contra la clostridiosis',
  'Vacuna contra la neumonía',
  'Vacuna contra la pasteurelosis',
  'Vacuna contra la salmonelosis',
  'Otra'
]

const milestoneOptions = [
  'Primer peso',
  'Destete',
  'Primer celo',
  'Primera inseminación',
  'Primer parto',
  'Inicio de producción de leche',
  'Pico de lactancia',
  'Vacunación completa',
  'Cambio de dieta',
  'Traslado a nuevo corral',
  'Otro'
]

export default function CalfTrackingPage({ onBack }: CalfTrackingPageProps) {
  const { user } = useUser()
  const { firebaseUser } = useFirebaseAuth()
  const [calves, setCalves] = useState<Calf[]>([])
  const [newCalf, setNewCalf] = useState<Omit<Calf, 'id' | 'feedingRecords' | 'vaccinations' | 'growthMilestones' | 'notes'>>({
    name: '',
    birthDate: '',
    motherCowId: '',
    gender: 'male',
    weight: 0
  })
  const [editingCalfId, setEditingCalfId] = useState<string | null>(null)
  const [expandedCalfId, setExpandedCalfId] = useState<string | null>(null)
  const [newFeeding, setNewFeeding] = useState<Omit<FeedingRecord, 'id'>>({ date: '', type: '', amount: 0, unit: 'litros' })
  const [newVaccination, setNewVaccination] = useState<Omit<Vaccination, 'id'>>({ date: '', type: '' })
  const [newMilestone, setNewMilestone] = useState<Omit<GrowthMilestone, 'id'>>({ date: '', description: '' })
  const [newNote, setNewNote] = useState<Omit<Note, 'id'>>({ date: '', content: '' })
  const [isOtherFeeding, setIsOtherFeeding] = useState(false)
  const [isOtherVaccination, setIsOtherVaccination] = useState(false)
  const [isOtherMilestone, setIsOtherMilestone] = useState(false)
  const [lastDeletedCalf, setLastDeletedCalf] = useState<Calf | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error' | 'warning', message: string } | null>(null)

  const loadCalves = useCallback(async () => {
    if (user && firebaseUser) {
      setIsLoading(true)
      try {
        const loadedCalves = await getCalves(firebaseUser.uid)
        console.log('Loaded calves:', loadedCalves) // For debugging
        setCalves(loadedCalves)
      } catch (error) {
        console.error("Error loading calves:", error)
        setAlertMessage({ type: 'error', message: 'Error al cargar las crías. Por favor, intenta de nuevo.' })
      } finally {
        setIsLoading(false)
      }
    }
  }, [user, firebaseUser])

  useEffect(() => {
    if (user && firebaseUser) {
      loadCalves()
    }
  }, [user, firebaseUser, loadCalves])

  const handleAddCalf = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !firebaseUser) {
      setAlertMessage({ type: 'error', message: 'Debes iniciar sesión para realizar esta acción.' })
      return
    }
    setIsLoading(true)
    try {
      const calfToAdd: Omit<Calf, 'id'> = {
        ...newCalf,
        feedingRecords: [],
        vaccinations: [],
        growthMilestones: [],
        notes: []
      }
      const newCalfId = await addCalf(firebaseUser.uid, calfToAdd)
      setCalves(prevCalves => [...prevCalves, { ...calfToAdd, id: newCalfId }])
      setNewCalf({ name: '', birthDate: '', motherCowId: '', gender: 'male', weight: 0 })
      setAlertMessage({ type: 'success', message: 'Cría agregada exitosamente.' })
      await loadCalves()
    } catch (error) {
      console.error("Error adding calf:", error)
      setAlertMessage({ type: 'error', message: 'Error al agregar la cría. Por favor, intenta de nuevo.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditCalf = async (calf: Calf) => {
    if (!user || !firebaseUser) {
      setAlertMessage({ type: 'error', message: 'Debes iniciar sesión para realizar esta acción.' })
      return
    }
    setIsLoading(true)
    try {
      await updateCalf(firebaseUser.uid, calf.id, calf)
      setCalves(prevCalves => prevCalves.map(c => c.id === calf.id ? calf : c))
      setEditingCalfId(null)
      setAlertMessage({ type: 'success', message: 'Cría actualizada exitosamente.' })
      await loadCalves()
    } catch (error) {
      console.error("Error updating calf:", error)
      setAlertMessage({ type: 'error', message: 'Error al actualizar la cría. Por favor, intenta de nuevo.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteCalf = async (id: string) => {
    if (!user || !firebaseUser) {
      setAlertMessage({ type: 'error', message: 'Debes iniciar sesión para realizar esta acción.' })
      return
    }
    const calfToDelete = calves.find(calf => calf.id === id)
    if (calfToDelete) {
      setIsLoading(true)
      try {
        await deleteCalf(firebaseUser.uid, id)
        setLastDeletedCalf(calfToDelete)
        setCalves(prevCalves => prevCalves.filter(calf => calf.id !== id))
        setAlertMessage({ type: 'success', message: 'Cría eliminada exitosamente.' })
        await loadCalves()
      } catch (error) {
        console.error("Error deleting calf:", error)
        setAlertMessage({ type: 'error', message: 'Error al eliminar la cría. Por favor, intenta de nuevo.' })
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleUndoDelete = async () => {
    if (!user || !firebaseUser || !lastDeletedCalf) {
      return
    }
    setIsLoading(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...calfWithoutId } = lastDeletedCalf
      const newCalfId = await addCalf(firebaseUser.uid, calfWithoutId)
      setCalves(prevCalves => [...prevCalves, { ...lastDeletedCalf, id: newCalfId }])
      setLastDeletedCalf(null)
      setAlertMessage({ type: 'success', message: 'Cría restaurada exitosamente.' })
      await loadCalves()
    } catch (error) {
      console.error("Error restoring calf:", error)
      setAlertMessage({ type: 'error', message: 'Error al restaurar la cría. Por favor, intenta de nuevo.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddRecord = async (calfId: string, recordType: 'feeding' | 'vaccination' | 'milestone') => {
    if (!user || !firebaseUser) {
      setAlertMessage({ type: 'error', message: 'Debes iniciar sesión para realizar esta acción.' })
      return
    }
    const calf = calves.find(c => c.id === calfId)
    if (!calf) return

    setIsLoading(true)
    try {
      let newRecordId: string
      switch (recordType) {
        case 'feeding':
          if (isNaN(newFeeding.amount)) {
            throw new Error('La cantidad debe ser un número válido')
          }
          newRecordId = await addFeedingRecord(firebaseUser.uid, calfId, newFeeding)
          setCalves(prevCalves => prevCalves.map(c => c.id === calfId ? { ...c, feedingRecords: [...c.feedingRecords, { ...newFeeding, id: newRecordId }] } : c))
          setNewFeeding({ date: '', type: '', amount: 0, unit: 'litros' })
          setIsOtherFeeding(false)
          break
        case 'vaccination':
          newRecordId = await addVaccination(firebaseUser.uid, calfId, newVaccination)
          setCalves(prevCalves => prevCalves.map(c => c.id === calfId ? { ...c, vaccinations: [...c.vaccinations, { ...newVaccination, id: newRecordId }] } : c))
          setNewVaccination({ date: '', type: '' })
          setIsOtherVaccination(false)
          break
        case 'milestone':
          newRecordId = await addGrowthMilestone(firebaseUser.uid, calfId, newMilestone)
          setCalves(prevCalves => prevCalves.map(c => c.id === calfId ? { ...c, growthMilestones: [...c.growthMilestones, { ...newMilestone, id: newRecordId }] } : c))
          setNewMilestone({ date: '', description: '' })
          setIsOtherMilestone(false)
          break
      }
      setAlertMessage({ type: 'success', message: 'Registro agregado exitosamente.' })
      await loadCalves()
    } catch (error) {
      console.error(`Error adding ${recordType} record:`, error)
      setAlertMessage({ type: 'error', message: `Error al agregar el registro de ${recordType}. ${error instanceof Error ? error.message : 'Por favor, intenta de nuevo.'}` })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddNote = async (calfId: string) => {
    if (!user || !firebaseUser) {
      setAlertMessage({ type: 'error', message: 'Debes iniciar sesión para realizar esta acción.' })
      return
    }
    setIsLoading(true)
    try {
      const newNoteId = await addNote(firebaseUser.uid, calfId, newNote)
      setCalves(prevCalves => prevCalves.map(c => c.id === calfId ? { ...c, notes: [...(c.notes || []), { ...newNote, id: newNoteId }] } : c))
      setNewNote({ date: '', content: '' })
      setAlertMessage({ type: 'success', message: 'Nota agregada exitosamente.' })
      await loadCalves()
    } catch (error) {
      console.error("Error adding note:", error)
      setAlertMessage({ type: 'error', message: 'Error al agregar la nota. Por favor, intenta de nuevo.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFeedingChange = (value: string) => {
    if (value === 'Otro') {
      setIsOtherFeeding(true)
      setNewFeeding({ ...newFeeding, type: '' })
    } else {
      setIsOtherFeeding(false)
      setNewFeeding({ ...newFeeding, type: value })
    }
  }

  const handleVaccinationChange = (value: string) => {
    if (value === 'Otra') {
      setIsOtherVaccination(true)
      setNewVaccination({ ...newVaccination, type: '' })
    } else {
      setIsOtherVaccination(false)
      setNewVaccination({ ...newVaccination, type: value })
    }
  }

  const handleMilestoneChange = (value: string) => {
    if (value === 'Otro') {
      setIsOtherMilestone(true)
      setNewMilestone({ ...newMilestone, description: '' })
    } else {
      setIsOtherMilestone(false)
      setNewMilestone({ ...newMilestone, description: value })
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-green-100 p-4 md:p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-4 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <Image src="/images/vaca (10).png" alt="Logo de Seguimiento de Crías" width={40} height={40} className="mr-4" />
              <h2 className="text-2xl md:text-3xl font-bold text-green-800">Seguimiento de Crías</h2>
            </div>
            <Button onClick={onBack} variant="outline" size="sm" className="flex items-center border-green-500 text-green-900 hover:bg-green-100 bg-green-300">
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver
            </Button>
          </div>
          <p className="text-base md:text-lg text-green-700 mb-6">
            Monitoreo completo del crecimiento y desarrollo de las crías, incluyendo registros de alimentación, vacunación y hitos de crecimiento.
          </p>

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

          <Card className="mb-8 bg-green-50 border-green-300">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-green-800">Agregar Nueva Cría</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddCalf} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-green-700">Nombre</Label>
                    <Input
                      id="name"
                      value={newCalf.name}
                      onChange={(e) => setNewCalf({ ...newCalf, name: e.target.value })}
                      className="border-green-300 focus:border-green-500 focus:ring-green-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthDate" className="text-green-700">Fecha de Nacimiento</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={newCalf.birthDate}
                      onChange={(e) => setNewCalf({ ...newCalf, birthDate: e.target.value })}
                      className="border-green-300 focus:border-green-500 focus:ring-green-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="motherCowId" className="text-green-700">ID de la Madre</Label>
                    <Input
                      id="motherCowId"
                      value={newCalf.motherCowId}
                      onChange={(e) => setNewCalf({ ...newCalf, motherCowId: e.target.value })}
                      className="border-green-300 focus:border-green-500 focus:ring-green-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-green-700">Género</Label>
                    <Select onValueChange={(value: 'male' | 'female') => setNewCalf({ ...newCalf, gender: value })}>
                      <SelectTrigger className="w-full bg-white border-green-300 focus:border-green-500 focus:ring-green-500 hover:bg-gray-100">
                        <SelectValue placeholder="Seleccionar Género" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="male" className="hover:bg-gray-100">Macho</SelectItem>
                        <SelectItem value="female" className="hover:bg-gray-100">Hembra</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight" className="text-green-700">Peso (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      value={newCalf.weight}
                      onChange={(e) => setNewCalf({ ...newCalf, weight: parseFloat(e.target.value) })}
                      className="border-green-300 focus:border-green-500 focus:ring-green-500"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white" disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Agregando...
                    </span>
                  ) : (
                    <>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Agregar Cría
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {calves.map((calf) => (
              <Card key={calf.id} className="bg-white border-green-200">
                <CardHeader className="bg-green-50 flex flex-row items-center justify-between">
                  <CardTitle className="text-xl font-semibold text-green-800">{calf.name}</CardTitle>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => setEditingCalfId(calf.id)}
                      variant="outline"
                      size="sm"
                      className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleDeleteCalf(calf.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-800 hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => setExpandedCalfId(expandedCalfId === calf.id ? null : calf.id)}
                      variant="outline"
                      size="sm"
                      className="text-green-600 hover:text-green-800 hover:bg-green-100"
                    >
                      {expandedCalfId === calf.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      <span className="ml-1 text-sm hidden md:inline">
                        {expandedCalfId === calf.id ? 'Ocultar información' : 'Ver información de tu cría'}
                      </span>
                    </Button>
                  </div>
                </CardHeader>
                {expandedCalfId === calf.id && (
                  <CardContent className="pt-4">
                    {editingCalfId === calf.id ? (
                      <form onSubmit={(e) => {
                        e.preventDefault()
                        handleEditCalf(calf)
                      }} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`edit-name-${calf.id}`} className="text-green-700">Nombre</Label>
                            <Input
                              id={`edit-name-${calf.id}`}
                              value={calf.name}
                              onChange={(e) => setCalves(prevCalves => prevCalves.map(c => c.id === calf.id ? { ...c, name: e.target.value } : c))}
                              className="border-green-300 focus:border-green-500 focus:ring-green-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`edit-birthDate-${calf.id}`} className="text-green-700">Fecha de Nacimiento</Label>
                            <Input
                              id={`edit-birthDate-${calf.id}`}
                              type="date"
                              value={calf.birthDate}
                              onChange={(e) => setCalves(prevCalves => prevCalves.map(c => c.id === calf.id ? { ...c, birthDate: e.target.value } : c))}
                              className="border-green-300 focus:border-green-500 focus:ring-green-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`edit-motherCowId-${calf.id}`} className="text-green-700">ID de la Madre</Label>
                            <Input
                              id={`edit-motherCowId-${calf.id}`}
                              value={calf.motherCowId}
                              onChange={(e) => setCalves(prevCalves => prevCalves.map(c => c.id === calf.id ? { ...c, motherCowId: e.target.value } : c))}
                              className="border-green-300 focus:border-green-500 focus:ring-green-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`edit-gender-${calf.id}`} className="text-green-700">Género</Label>
                            <Select 
                              onValueChange={(value: 'male' | 'female') => setCalves(prevCalves => prevCalves.map(c => c.id === calf.id ? { ...c, gender: value } : c))}
                              defaultValue={calf.gender}
                            >
                              <SelectTrigger className="w-full bg-white border-green-300 focus:border-green-500 focus:ring-green-500 hover:bg-gray-100">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white">
                                <SelectItem value="male" className="hover:bg-gray-100">Macho</SelectItem>
                                <SelectItem value="female" className="hover:bg-gray-100">Hembra</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`edit-weight-${calf.id}`} className="text-green-700">Peso (kg)</Label>
                            <Input
                              id={`edit-weight-${calf.id}`}
                              type="number"
                              value={calf.weight}
                              onChange={(e) => setCalves(prevCalves => prevCalves.map(c => c.id === calf.id ? { ...c, weight: parseFloat(e.target.value) } : c))}
                              className="border-green-300 focus:border-green-500 focus:ring-green-500"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white" disabled={isLoading}>
                            {isLoading ? (
                              <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Guardando...
                              </span>
                            ) : (
                              <>
                                <Save className="mr-2 h-4 w-4" /> Guardar Cambios
                              </>
                            )}
                          </Button>
                          <Button onClick={() => setEditingCalfId(null)} variant="outline" className="border-green-300 text-green-600 hover:bg-green-100">
                            <X className="mr-2 h-4 w-4" /> Cancelar
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-2">
                        <p><strong>Fecha de Nacimiento:</strong> {calf.birthDate}</p>
                        <p><strong>ID de la Madre:</strong> {calf.motherCowId}</p>
                        <p><strong>Género:</strong> {calf.gender === 'male' ? 'Macho' : 'Hembra'}</p>
                        <p><strong>Peso:</strong> {calf.weight} kg</p>
                      </div>
                    )}

                    <div className="mt-4 space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg font-semibold text-green-700">Registros de Alimentación</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="list-disc pl-5 space-y-1 mb-4">
                            {calf.feedingRecords.map((record) => (
                              <li key={record.id}>{record.date}: {record.type} - {record.amount} {record.unit}</li>
                            ))}
                          </ul>
                          <form onSubmit={(e) => {
                            e.preventDefault()
                            handleAddRecord(calf.id, 'feeding')
                          }} className="space-y-4">
                            <Select onValueChange={handleFeedingChange}>
                              <SelectTrigger className="w-full bg-white border-green-300 focus:border-green-500 focus:ring-green-500 hover:bg-gray-100">
                                <SelectValue placeholder="Seleccionar tipo de alimentación" />
                              </SelectTrigger>
                              <SelectContent className="bg-white max-h-[200px] overflow-y-auto">
                                {feedingOptions.map(option => (
                                  <SelectItem key={option} value={option} className="hover:bg-gray-100">{option}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {isOtherFeeding && (
                              <Input
                                placeholder="Especificar otro tipo de alimentación"
                                value={newFeeding.type}
                                onChange={(e) => setNewFeeding({ ...newFeeding, type: e.target.value })}
                                className="border-green-300 focus:border-green-500 focus:ring-green-500"
                                required
                              />
                            )}
                            <div className="flex space-x-2">
                              <Input
                                type="number"
                                placeholder="Cantidad"
                                value={newFeeding.amount}
                                onChange={(e) => setNewFeeding({ ...newFeeding, amount: parseFloat(e.target.value) || 0 })}
                                className="border-green-300 focus:border-green-500 focus:ring-green-500"
                                required
                                step="0.01"
                              />
                              <Select onValueChange={(value: 'litros' | 'kilos') => setNewFeeding({ ...newFeeding, unit: value })}>
                                <SelectTrigger className="w-full bg-white border-green-300 focus:border-green-500 focus:ring-green-500 hover:bg-gray-100">
                                  <SelectValue placeholder="Unidad" />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                  <SelectItem value="litros" className="hover:bg-gray-100">Litros</SelectItem>
                                  <SelectItem value="kilos" className="hover:bg-gray-100">Kilos</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <Input
                              type="date"
                              value={newFeeding.date}
                              onChange={(e) => setNewFeeding({ ...newFeeding, date: e.target.value })}
                              className="border-green-300 focus:border-green-500 focus:ring-green-500"
                              required
                            />
                            <Button type="submit" className="w-full bg-blue-500 text-white hover:bg-blue-600" disabled={isLoading}>
                              {isLoading ? 'Agregando...' : 'Agregar Alimentación'}
                            </Button>
                          </form>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg font-semibold text-green-700">Vacunaciones</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="list-disc pl-5 space-y-1 mb-4">
                            {calf.vaccinations.map((vaccination) => (
                              <li key={vaccination.id}>{vaccination.date}: {vaccination.type}</li>
                            ))}
                          </ul>
                          <form onSubmit={(e) => {
                            e.preventDefault()
                            handleAddRecord(calf.id, 'vaccination')
                          }} className="space-y-4">
                            <Select onValueChange={handleVaccinationChange}>
                              <SelectTrigger className="w-full bg-white border-green-300 focus:border-green-500 focus:ring-green-500 hover:bg-gray-100">
                                <SelectValue placeholder="Seleccionar tipo de vacuna" />
                              </SelectTrigger>
                              <SelectContent className="bg-white max-h-[200px] overflow-y-auto">
                                {vaccinationOptions.map(option => (
                                  <SelectItem key={option} value={option} className="hover:bg-gray-100">{option}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {isOtherVaccination && (
                              <Input
                                placeholder="Especificar otro tipo de vacuna"
                                value={newVaccination.type}
                                onChange={(e) => setNewVaccination({ ...newVaccination, type: e.target.value })}
                                className="border-green-300 focus:border-green-500 focus:ring-green-500"
                                required
                              />
                            )}
                            <Input
                              type="date"
                              value={newVaccination.date}
                              onChange={(e) => setNewVaccination({ ...newVaccination, date: e.target.value })}
                              className="border-green-300 focus:border-green-500 focus:ring-green-500"
                              required
                            />
                            <Button type="submit" className="w-full bg-blue-500 text-white hover:bg-blue-600" disabled={isLoading}>
                              {isLoading ? 'Agregando...' : 'Agregar Vacunación'}
                            </Button>
                          </form>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg font-semibold text-green-700">Hitos de Crecimiento</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="list-disc pl-5 space-y-1 mb-4">
                            {calf.growthMilestones.map((milestone) => (
                              <li key={milestone.id}>{milestone.date}: {milestone.description}</li>
                            ))}
                          </ul>
                          <form onSubmit={(e) => {
                            e.preventDefault()
                            handleAddRecord(calf.id, 'milestone')
                          }} className="space-y-4">
                            <Select onValueChange={handleMilestoneChange}>
                              <SelectTrigger className="w-full bg-white border-green-300 focus:border-green-500 focus:ring-green-500 hover:bg-gray-100">
                                <SelectValue placeholder="Seleccionar tipo de hito" />
                              </SelectTrigger>
                              <SelectContent className="bg-white max-h-[200px] overflow-y-auto">
                                {milestoneOptions.map(option => (
                                  <SelectItem key={option} value={option} className="hover:bg-gray-100">{option}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {isOtherMilestone && (
                              <Input
                                placeholder="Descripción del hito"
                                value={newMilestone.description}
                                onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                                className="border-green-300 focus:border-green-500 focus:ring-green-500"
                                required
                              />
                            )}
                            <Input
                              type="date"
                              value={newMilestone.date}
                              onChange={(e) => setNewMilestone({ ...newMilestone, date: e.target.value })}
                              className="border-green-300 focus:border-green-500 focus:ring-green-500"
                              required
                            />
                            <Button type="submit" className="w-full bg-blue-500 text-white hover:bg-blue-600" disabled={isLoading}>
                              {isLoading ? 'Agregando...' : 'Agregar Hito'}
                            </Button>
                          </form>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg font-semibold text-green-700">Notas</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="list-disc pl-5 space-y-1 mb-4">
                            {calf.notes && calf.notes.map((note) => (
                              <li key={note.id}>{note.date}: {note.content}</li>
                            ))}
                          </ul>
                          <Dialog>
                            <DialogTrigger asChild className=''>
                              <Button className="w-full bg-blue-500 text-white hover:bg-blue-600">
                                <FileText className="mr-2 h-4 w-4" />
                                Agregar Nota
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px] bg-black">
                              <DialogHeader>
                                <DialogTitle className='text-white'>Agregar Nota</DialogTitle>
                              </DialogHeader>
                              <form onSubmit={(e) => {
                                e.preventDefault()
                                handleAddNote(calf.id)
                              }} className="space-y-4">
                                <Input
                                  type="date"
                                  value={newNote.date}
                                  onChange={(e) => setNewNote({ ...newNote, date: e.target.value })}
                                  className="border-green-300 focus:border-green-500 focus:ring-green-500"
                                  required
                                />
                                <Textarea
                                  placeholder="Escribe tu nota aquí"
                                  value={newNote.content}
                                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                                  className="border-green-300 focus:border-green-500 focus:ring-green-500"
                                  required
                                />
                                <Button type="submit" className="w-full bg-blue-500 text-white hover:bg-blue-600" disabled={isLoading}>
                                  {isLoading ? 'Agregando...' : 'Agregar Nota'}
                                </Button>
                              </form>
                            </DialogContent>
                          </Dialog>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
          {lastDeletedCalf && (
            <Button onClick={handleUndoDelete} className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-white" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deshaciendo...
                </span>
              ) : (
                <>
                  <Undo2 className="mr-2 h-4 w-4" />
                  Deshacer Eliminación
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}