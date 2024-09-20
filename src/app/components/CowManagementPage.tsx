'use client'

import React, { useState, useEffect, useRef } from 'react'
import { PlusCircle, Search, Edit2, Save, X, Milk, Wheat, ArrowLeft, Trash2, Undo2, FileText } from 'lucide-react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Badge } from "./ui/badge"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import ProtectedRoute from './ProtectedRoute'
import { useUser } from "@clerk/nextjs"
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth'
import { getCows, addCow, updateCow, deleteCow, addVaccinationToCow, addTreatmentToCow, addMilkProductionToCow, addFeedingScheduleToCow, addNoteToCow, Cow, Vaccination, Treatment, MilkProduction, FeedingSchedule } from '@/firestore'

interface CowManagementPageProps {
  onBack: () => void
}

export default function CowManagementPage({ onBack }: CowManagementPageProps) {
  const [cows, setCows] = useState<Cow[]>([])
  const [newCow, setNewCow] = useState<Partial<Cow>>({})
  const [editingCowId, setEditingCowId] = useState<string | null>(null)
  const [expandedCowId, setExpandedCowId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [lastDeletedCow, setLastDeletedCow] = useState<Cow | null>(null)
  const [newNote, setNewNote] = useState('')

  const [newVaccination, setNewVaccination] = useState<Partial<Vaccination>>({})
  const [newTreatment, setNewTreatment] = useState<Partial<Treatment>>({})
  const [newMilkProduction, setNewMilkProduction] = useState<Partial<MilkProduction>>({})
  const [newFeedingSchedule, setNewFeedingSchedule] = useState<Partial<FeedingSchedule>>({})

  const cowRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const { user } = useUser()
  const { firebaseUser } = useFirebaseAuth()

  useEffect(() => {
    const loadCows = async () => {
      if (user && firebaseUser) {
        try {
          const loadedCows = await getCows(firebaseUser.uid)
          setCows(loadedCows)
        } catch (error) {
          console.error("Error loading cows:", error)
          showAlert('error', 'Error al cargar las vacas. Por favor, intente de nuevo.')
        }
      }
    }
    loadCows()
  }, [user, firebaseUser])

  useEffect(() => {
    // Check for medical alerts
    const today = new Date()
    cows.forEach(cow => {
      cow.vaccinations.forEach(vaccination => {
        const vaccinationDate = new Date(vaccination.date)
        if (vaccinationDate <= today) {
          showAlert('error', `Alerta: La vaca ${cow.name} (ID: ${cow.id}) necesita la vacuna ${vaccination.type}`)
        }
      })
    })
  }, [cows])

  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => {
        setAlertMessage(null)
      }, 8000)
      return () => clearTimeout(timer)
    }
  }, [alertMessage])

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlertMessage({ type, message })
  }

  const handleAddCow = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !firebaseUser) {
      showAlert('error', 'Debes iniciar sesión para realizar esta acción.')
      return
    }
    if (newCow.name && newCow.breed && newCow.birthDate) {
      const birthDate = new Date(newCow.birthDate)
      const today = new Date()
      if (birthDate > today) {
        showAlert('error', 'Error: La fecha de nacimiento no puede ser en el futuro')
        return
      }
      try {
        const cowToAdd: Omit<Cow, 'id'> = {
          ...newCow as Omit<Cow, 'id'>,
          vaccinations: [],
          treatments: [],
          milkProduction: [],
          feedingSchedule: [],
          notes: []
        }
        const newCowId = await addCow(firebaseUser.uid, cowToAdd)
        setCows([...cows, { ...cowToAdd, id: newCowId }])
        setNewCow({})
        showAlert('success', 'Vaca registrada exitosamente')
      } catch (error) {
        console.error("Error adding cow:", error)
        showAlert('error', 'Error al registrar la vaca. Por favor, intente de nuevo.')
      }
    } else {
      showAlert('error', 'Por favor, complete todos los campos requeridos')
    }
  }

  const handleEditCow = async (cow: Cow) => {
    if (!user || !firebaseUser) {
      showAlert('error', 'Debes iniciar sesión para realizar esta acción.')
      return
    }
    const birthDate = new Date(cow.birthDate)
    const today = new Date()
    if (birthDate > today) {
      showAlert('error', 'Error: La fecha de nacimiento no puede ser en el futuro')
      return
    }
    try {
      await updateCow(firebaseUser.uid, cow.id, cow)
      setCows(cows.map(c => c.id === cow.id ? cow : c))
      setEditingCowId(null)
      showAlert('success', 'Información de la vaca actualizada exitosamente')
    } catch (error) {
      console.error("Error updating cow:", error)
      showAlert('error', 'Error al actualizar la vaca. Por favor, intente de nuevo.')
    }
  }

  const handleDeleteCow = async (id: string) => {
    if (!user || !firebaseUser) {
      showAlert('error', 'Debes iniciar sesión para realizar esta acción.')
      return
    }
    try {
      await deleteCow(firebaseUser.uid, id)
      const cowToDelete = cows.find(cow => cow.id === id)
      if (cowToDelete) {
        setCows(cows.filter(cow => cow.id !== id))
        setLastDeletedCow(cowToDelete)
        showAlert('success', 'Vaca eliminada exitosamente')
      }
    } catch (error) {
      console.error("Error deleting cow:", error)
      showAlert('error', 'Error al eliminar la vaca. Por favor, intente de nuevo.')
    }
  }

  const handleUndoDelete = async () => {
    if (!user || !firebaseUser || !lastDeletedCow) {
      return
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...cowWithoutId } = lastDeletedCow
      const newCowId = await addCow(firebaseUser.uid, cowWithoutId)
      setCows([...cows, { ...lastDeletedCow, id: newCowId }])
      setLastDeletedCow(null)
      showAlert('success', 'Eliminación de vaca deshecha')
    } catch (error) {
      console.error("Error restoring cow:", error)
      showAlert('error', 'Error al restaurar la vaca. Por favor, intente de nuevo.')
    }
  }

  const handleAddNote = async (cowId: string) => {
    if (!user || !firebaseUser) {
      showAlert('error', 'Debes iniciar sesión para realizar esta acción.')
      return
    }
    if (newNote.trim()) {
      try {
        await addNoteToCow(firebaseUser.uid, cowId, newNote.trim())
        setCows(cows.map(cow => {
          if (cow.id === cowId) {
            return {
              ...cow,
              notes: [...cow.notes, newNote.trim()]
            }
          }
          return cow
        }))
        setNewNote('')
        showAlert('success', 'Nota agregada exitosamente')
      } catch (error) {
        console.error("Error adding note:", error)
        showAlert('error', 'Error al agregar la nota. Por favor, intente de nuevo.')
      }
    } else {
      showAlert('error', 'Por favor, ingrese una nota válida')
    }
  }

  const handleAddVaccination = async (cowId: string) => {
    if (!user || !firebaseUser) {
      showAlert('error', 'Debes iniciar sesión para realizar esta acción.')
      return
    }
    if (newVaccination.type && newVaccination.date) {
      try {
        await addVaccinationToCow(firebaseUser.uid, cowId, newVaccination as Omit<Vaccination, 'id'>)
        const updatedCows = cows.map(cow => {
          if (cow.id === cowId) {
            return {
              ...cow,
              vaccinations: [...cow.vaccinations, { ...newVaccination, id: Date.now().toString() } as Vaccination]
            }
          }
          return cow
        })
        setCows(updatedCows)
        setNewVaccination({})
        showAlert('success', 'Vacunación agregada exitosamente')
      } catch (error) {
        console.error("Error adding vaccination:", error)
        showAlert('error', 'Error al agregar la vacunación. Por favor, intente de nuevo.')
      }
    } else {
      showAlert('error', 'Por favor, complete todos los campos de la vacunación')
    }
  }

  const handleAddTreatment = async (cowId: string) => {
    if (!user || !firebaseUser) {
      showAlert('error', 'Debes iniciar sesión para realizar esta acción.')
      return
    }
    if (newTreatment.description && newTreatment.date && newTreatment.medication) {
      try {
        await addTreatmentToCow(firebaseUser.uid, cowId, newTreatment as Omit<Treatment, 'id'>)
        const updatedCows = cows.map(cow => {
          if (cow.id === cowId) {
            return {
              ...cow,
              treatments: [...cow.treatments, { ...newTreatment, id: Date.now().toString() } as Treatment]
            }
          }
          return cow
        })
        setCows(updatedCows)
        setNewTreatment({})
        showAlert('success', 'Tratamiento agregado exitosamente')
      } catch (error) {
        console.error("Error adding treatment:", error)
        showAlert('error', 'Error al agregar el tratamiento. Por favor, intente de nuevo.')
      }
    } else {
      showAlert('error', 'Por favor, complete todos los campos del tratamiento')
    }
  }

  const handleAddMilkProduction = async (cowId: string) => {
    if (!user || !firebaseUser) {
      showAlert('error', 'Debes iniciar sesión para realizar esta acción.')
      return
    }
    if (newMilkProduction.date && newMilkProduction.amount) {
      try {
        await addMilkProductionToCow(firebaseUser.uid, cowId, newMilkProduction as Omit<MilkProduction, 'id'>)
        const updatedCows = cows.map(cow => {
          if (cow.id === cowId) {
            return {
              ...cow,
              milkProduction: [...cow.milkProduction, { ...newMilkProduction, id: Date.now().toString() } as MilkProduction]
            }
          }
          return cow
        })
        setCows(updatedCows)
        setNewMilkProduction({})
        showAlert('success', 'Producción de leche registrada exitosamente')
      } catch (error) {
        console.error("Error adding milk production:", error)
        showAlert('error', 'Error al registrar la producción de leche. Por favor, intente de nuevo.')
      }
    } else {
      showAlert('error', 'Por favor, complete todos los campos de producción de leche')
    }
  }

  const handleAddFeedingSchedule = async (cowId: string) => {
    if (!user || !firebaseUser) {
      showAlert('error', 'Debes iniciar sesión para realizar esta acción.')
      return
    }
    if (newFeedingSchedule.feedType && newFeedingSchedule.frequency && newFeedingSchedule.amount) {
      try {
        await addFeedingScheduleToCow(firebaseUser.uid, cowId, newFeedingSchedule as Omit<FeedingSchedule, 'id'>)
        const updatedCows = cows.map(cow => {
          if (cow.id === cowId) {
            return {
              ...cow,
              feedingSchedule: [...cow.feedingSchedule, { ...newFeedingSchedule, id: Date.now().toString() } as FeedingSchedule]
            }
          }
          return cow
        })
        setCows(updatedCows)
        setNewFeedingSchedule({})
        showAlert('success', 'Horario de alimentación agregado exitosamente')
      } catch (error) {
        console.error("Error adding feeding schedule:", error)
        showAlert('error', 'Error al agregar el horario de alimentación. Por favor, intente de nuevo.')
      }
    } else {
      showAlert('error', 'Por favor, complete todos los campos del horario de alimentación')
    }
  }

  const handleSearch = () => {
    const foundCow = cows.find(cow => 
      cow.id.toLowerCase() === searchQuery.toLowerCase() || 
      cow.name.toLowerCase() === searchQuery.toLowerCase()
    )
    if (foundCow) {
      setExpandedCowId(foundCow.id)
      cowRefs.current[foundCow.id]?.scrollIntoView({ behavior: 'smooth' })
    } else {
      showAlert('error', 'No se encontró ninguna vaca con ese ID o nombre')
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-green-100 to-green-200 p-4 md:p-8">
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg p-4 md:p-8 border border-green-300">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <Image src="/images/vaca (11).png" alt="Icono de Vaca" width={40} height={40} className="mr-4" />
              <h2 className="text-2xl md:text-3xl font-bold text-green-800">Gestión de Vacas</h2>
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
                  <AlertTitle>{alertMessage.type === 'error' ? 'Error' : 'Éxito'}</AlertTitle>
                  <AlertDescription>{alertMessage.message}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="mb-6">
            <Label htmlFor="search" className="text-green-700">Buscar Vaca por ID o Nombre</Label>
            <div className="flex mt-1">
              <Input
                id="search"
                type="text"
                placeholder="Ingrese ID o nombre de la vaca"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-grow border-green-300 focus:border-green-500 focus:ring-green-500"
              />
              <Button onClick={handleSearch} className="ml-2 bg-green-600 hover:bg-green-700">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Card className="mb-8 bg-green-50 border-green-300">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-green-800">Registrar Nueva Vaca</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddCow} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-green-700">Nombre</Label>
                    <Input
                      id="name"
                      value={newCow.name || ''}
                      onChange={(e) => setNewCow({ ...newCow, name: e.target.value })}
                      className="border-green-300 focus:border-green-500 focus:ring-green-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="breed" className="text-green-700">Raza</Label>
                    <Input
                      id="breed"
                      value={newCow.breed || ''}
                      onChange={(e) => setNewCow({ ...newCow, breed: e.target.value })}
                      className="border-green-300 focus:border-green-500 focus:ring-green-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthDate" className="text-green-700">Fecha de Nacimiento</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={newCow.birthDate || ''}
                      onChange={(e) => setNewCow({ ...newCow, birthDate: e.target.value })}
                      className="border-green-300 focus:border-green-500 focus:ring-green-500"
                      required
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="geneticInfo" className="text-green-700">Información Genética</Label>
                    <Textarea
                      id="geneticInfo"
                      value={newCow.geneticInfo || ''}
                      onChange={(e) => setNewCow({ ...newCow, geneticInfo: e.target.value })}
                      className="border-green-300 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="healthHistory" className="text-green-700">Historial de Salud</Label>
                    <Textarea
                      id="healthHistory"
                      value={newCow.healthHistory || ''}
                      onChange={(e) => setNewCow({ ...newCow, healthHistory: e.target.value })}
                      className="border-green-300 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="uniqueTraits" className="text-green-700">Características Únicas</Label>
                    <Textarea
                      id="uniqueTraits"
                      value={newCow.uniqueTraits || ''}
                      onChange={(e) => setNewCow({ ...newCow, uniqueTraits: e.target.value })}
                      className="border-green-300 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Registrar Nueva Vaca
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {cows.map((cow) => (
              <Card 
                key={cow.id} 
                className="bg-white border-green-200" 
                ref={(el) => {
                  if (el) {
                    cowRefs.current[cow.id] = el
                  }
                }}
              >
                <CardHeader className="bg-green-50 flex flex-row items-center justify-between">
                  <CardTitle className="text-xl font-semibold text-green-800">
                    {cow.name} <Badge variant="outline" className="ml-2">ID: {cow.id}</Badge>
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => setEditingCowId(editingCowId === cow.id ? null : cow.id)}
                      variant="outline"
                      size="sm"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleDeleteCow(cow.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 hover:text-green-800"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px] bg-white">
                        <DialogHeader>
                          <DialogTitle className="text-xl font-semibold text-green-800 mb-4">Notas para {cow.name}</DialogTitle>
                        </DialogHeader>
                        <div className="mt-4 space-y-4">
                          <ul className="list-disc pl-5 space-y-2 max-h-60 overflow-y-auto">
                            {cow.notes.map((note, index) => (
                              <li key={index} className="text-green-700">{note}</li>
                            ))}
                          </ul>
                          <div className="flex space-x-2">
                            <Input
                              placeholder="Nueva nota"
                              value={newNote}
                              onChange={(e) => setNewNote(e.target.value)}
                              className="flex-grow border-green-300 focus:border-green-500 focus:ring-green-500"
                            />
                            <Button onClick={() => handleAddNote(cow.id)} className="bg-green-600 hover:bg-green-700 text-white">
                              Agregar
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      onClick={() => setExpandedCowId(expandedCowId === cow.id ? null : cow.id)}
                      variant="outline"
                      size="sm"
                      className="text-green-600 hover:text-green-800"
                    >
                      {expandedCowId === cow.id ? 'Ocultar' : 'Ver más'}
                    </Button>
                  </div>
                </CardHeader>
                {expandedCowId === cow.id && (
                  <CardContent className="pt-4">
                    {editingCowId === cow.id ? (
                      <form onSubmit={(e) => {
                        e.preventDefault()
                        handleEditCow(cow)
                      }} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`edit-name-${cow.id}`} className="text-green-700">Nombre</Label>
                            <Input
                              id={`edit-name-${cow.id}`}
                              value={cow.name}
                              onChange={(e) => setCows(cows.map(c => c.id === cow.id ? { ...c, name: e.target.value } : c))}
                              className="border-green-300 focus:border-green-500 focus:ring-green-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`edit-breed-${cow.id}`} className="text-green-700">Raza</Label>
                            <Input
                              id={`edit-breed-${cow.id}`}
                              value={cow.breed}
                              onChange={(e) => setCows(cows.map(c => c.id === cow.id ? { ...c, breed: e.target.value } : c))}
                              className="border-green-300 focus:border-green-500 focus:ring-green-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`edit-birthDate-${cow.id}`} className="text-green-700">Fecha de Nacimiento</Label>
                            <Input
                              id={`edit-birthDate-${cow.id}`}
                              type="date"
                              value={cow.birthDate}
                              onChange={(e) => setCows(cows.map(c => c.id === cow.id ? { ...c, birthDate: e.target.value } : c))}
                              className="border-green-300 focus:border-green-500 focus:ring-green-500"
                              max={new Date().toISOString().split('T')[0]}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`edit-geneticInfo-${cow.id}`} className="text-green-700">Información Genética</Label>
                            <Textarea
                              id={`edit-geneticInfo-${cow.id}`}
                              value={cow.geneticInfo}
                              onChange={(e) => setCows(cows.map(c => c.id === cow.id ? { ...c, geneticInfo: e.target.value } : c))}
                              className="border-green-300 focus:border-green-500 focus:ring-green-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`edit-healthHistory-${cow.id}`} className="text-green-700">Historial de Salud</Label>
                            <Textarea
                              id={`edit-healthHistory-${cow.id}`}
                              value={cow.healthHistory}
                              onChange={(e) => setCows(cows.map(c => c.id === cow.id ? { ...c, healthHistory: e.target.value } : c))}
                              className="border-green-300 focus:border-green-500 focus:ring-green-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`edit-uniqueTraits-${cow.id}`} className="text-green-700">Características Únicas</Label>
                            <Textarea
                              id={`edit-uniqueTraits-${cow.id}`}
                              value={cow.uniqueTraits}
                              onChange={(e) => setCows(cows.map(c => c.id === cow.id ? { ...c, uniqueTraits: e.target.value } : c))}
                              className="border-green-300 focus:border-green-500 focus:ring-green-500"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
                            <Save className="mr-2 h-4 w-4" /> Guardar Cambios
                          </Button>
                          <Button onClick={() => setEditingCowId(null)} variant="outline" className="border-green-300 text-green-600 hover:bg-green-100">
                            <X className="mr-2 h-4 w-4" /> Cancelar
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <p><strong>Raza:</strong> {cow.breed}</p>
                          <p><strong>Fecha de Nacimiento:</strong> {cow.birthDate}</p>
                          <p><strong>Información Genética:</strong> {cow.geneticInfo}</p>
                          <p><strong>Historial de Salud:</strong> {cow.healthHistory}</p>
                          <p><strong>Características Únicas:</strong> {cow.uniqueTraits}</p>
                        </div>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg font-semibold text-green-700">Vacunaciones y Tratamientos</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-semibold mb-2">Vacunaciones</h4>
                                <ul className="list-disc pl-5 space-y-1">
                                  {cow.vaccinations.map((vaccination) => (
                                    <li key={vaccination.id}>
                                      {vaccination.date}: {vaccination.type}
                                    </li>
                                  ))}
                                </ul>
                                <form onSubmit={(e) => {
                                  e.preventDefault()
                                  handleAddVaccination(cow.id)
                                }} className="mt-2 space-y-2">
                                  <Input
                                    type="date"
                                    value={newVaccination.date || ''}
                                    onChange={(e) => setNewVaccination({ ...newVaccination, date: e.target.value })}
                                    className="border-green-300 focus:border-green-500 focus:ring-green-500"
                                    placeholder="Fecha de vacunación"
                                    required
                                  />
                                  <Input
                                    type="text"
                                    value={newVaccination.type || ''}
                                    onChange={(e) => setNewVaccination({ ...newVaccination, type: e.target.value })}
                                    className="border-green-300 focus:border-green-500 focus:ring-green-500"
                                    placeholder="Tipo de vacuna"
                                    required
                                  />
                                  <Button type="submit" className="w-full bg-blue-500 text-white hover:bg-blue-600">
                                    Agregar Vacunación
                                  </Button>
                                </form>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">Tratamientos</h4>
                                <ul className="list-disc pl-5 space-y-1">
                                  {cow.treatments.map((treatment) => (
                                    <li key={treatment.id}>
                                      {treatment.date}: {treatment.description} (Medicamento: {treatment.medication})
                                    </li>
                                  ))}
                                </ul>
                                <form onSubmit={(e) => {
                                  e.preventDefault()
                                  handleAddTreatment(cow.id)
                                }} className="mt-2 space-y-2">
                                  <Input
                                    type="date"
                                    value={newTreatment.date || ''}
                                    onChange={(e) => setNewTreatment({ ...newTreatment, date: e.target.value })}
                                    className="border-green-300 focus:border-green-500 focus:ring-green-500"
                                    placeholder="Fecha del tratamiento"
                                    required
                                  />
                                  <Input
                                    type="text"
                                    value={newTreatment.description || ''}
                                    onChange={(e) => setNewTreatment({ ...newTreatment, description: e.target.value })}
                                    className="border-green-300 focus:border-green-500 focus:ring-green-500"
                                    placeholder="Descripción del tratamiento"
                                    required
                                  />
                                  <Input
                                    type="text"
                                    value={newTreatment.medication || ''}
                                    onChange={(e) => setNewTreatment({ ...newTreatment, medication: e.target.value })}
                                    className="border-green-300 focus:border-green-500 focus:ring-green-500"
                                    placeholder="Medicamento"
                                    required
                                  />
                                  <Button type="submit" className="w-full bg-blue-500 text-white hover:bg-blue-600">
                                    Agregar Tratamiento
                                  </Button>
                                </form>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg font-semibold text-green-700">Producción de Leche</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <ul className="list-disc pl-5 space-y-1">
                                {cow.milkProduction.map((production) => (
                                  <li key={production.id}>
                                    {production.date}: {production.amount} litros
                                  </li>
                                ))}
                              </ul>
                              <form onSubmit={(e) => {
                                e.preventDefault()
                                handleAddMilkProduction(cow.id)
                              }} className="space-y-2">
                                <Input
                                  type="date"
                                  value={newMilkProduction.date || ''}
                                  onChange={(e) => setNewMilkProduction({ ...newMilkProduction, date: e.target.value })}
                                  className="border-green-300 focus:border-green-500 focus:ring-green-500"
                                  placeholder="Fecha de producción"
                                  required
                                />
                                <Input
                                  type="number"
                                  value={newMilkProduction.amount || ''}
                                  onChange={(e) => setNewMilkProduction({ ...newMilkProduction, amount: parseFloat(e.target.value) })}
                                  className="border-green-300 focus:border-green-500 focus:ring-green-500"
                                  placeholder="Cantidad en litros"
                                  step="0.1"
                                  required
                                />
                                <Button type="submit" className="w-full bg-blue-500 text-white hover:bg-blue-600">
                                  <Milk className="mr-2 h-4 w-4" />
                                  Registrar Producción
                                </Button>
                              </form>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg font-semibold text-green-700">Horario de Alimentación</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <ul className="list-disc pl-5 space-y-1">
                                {cow.feedingSchedule.map((schedule) => (
                                  <li key={schedule.id}>
                                    {schedule.feedType}: {schedule.amount} kg, {schedule.frequency}
                                  </li>
                                ))}
                              </ul>
                              <form onSubmit={(e) => {
                                e.preventDefault()
                                handleAddFeedingSchedule(cow.id)
                              }} className="space-y-2">
                                <Input
                                  type="text"
                                  value={newFeedingSchedule.feedType || ''}
                                  onChange={(e) => setNewFeedingSchedule({ ...newFeedingSchedule, feedType: e.target.value })}
                                  className="border-green-300 focus:border-green-500 focus:ring-green-500"
                                  placeholder="Tipo de alimento"
                                  required
                                />
                                <Input
                                  type="text"
                                  value={newFeedingSchedule.frequency || ''}
                                  onChange={(e) => setNewFeedingSchedule({ ...newFeedingSchedule, frequency: e.target.value })}
                                  className="border-green-300 focus:border-green-500 focus:ring-green-500"
                                  placeholder="Frecuencia (ej: 2 veces al día)"
                                  required
                                />
                                <Input
                                  type="number"
                                  value={newFeedingSchedule.amount || ''}
                                  onChange={(e) => setNewFeedingSchedule({ ...newFeedingSchedule, amount: parseFloat(e.target.value) })}
                                  className="border-green-300 focus:border-green-500 focus:ring-green-500"
                                  placeholder="Cantidad en kg"
                                  step="0.1"
                                  required
                                />
                                <Button type="submit" className="w-full bg-blue-500 text-white hover:bg-blue-600">
                                  <Wheat className="mr-2 h-4 w-4" />
                                  Agregar Horario de Alimentación
                                </Button>
                              </form>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
          {lastDeletedCow && (
            <Button onClick={handleUndoDelete} className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-white">
              <Undo2 className="mr-2 h-4 w-4" />
              Deshacer Eliminación
            </Button>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}