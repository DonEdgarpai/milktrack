'use client'

import { useReducer, useCallback, useState, useEffect } from 'react'
import { PlusCircle, AlertTriangle, Activity, Edit2, Save, X, ArrowLeft, Trash2, FileText, Undo2, ChevronDown, ChevronUp } from 'lucide-react'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Progress } from "./ui/progress"
import { useToast } from "./ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import ProtectedRoute from './ProtectedRoute'
import { useUser } from "@clerk/nextjs"
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth'
import { getPregnantCows, addPregnantCow, updatePregnantCow, deletePregnantCow, addNoteToPregnantCow, PregnantCow } from '@/firestore'

interface PregnancyTrackingPageProps {
  onBack: () => void
}

type State = {
  pregnantCows: PregnantCow[]
  newCow: Partial<PregnantCow>
  expandedCowId: string | null
  editingCowId: string | null
  lastDeletedCow: PregnantCow | null
}

type Action =
  | { type: 'SET_PREGNANT_COWS'; payload: PregnantCow[] }
  | { type: 'ADD_COW'; payload: PregnantCow }
  | { type: 'UPDATE_NEW_COW'; field: keyof PregnantCow; value: string | number }
  | { type: 'RESET_NEW_COW' }
  | { type: 'SET_EXPANDED_COW'; id: string | null }
  | { type: 'SET_EDITING_COW'; id: string | null }
  | { type: 'UPDATE_COW'; payload: PregnantCow }
  | { type: 'DELETE_COW'; id: string }
  | { type: 'UNDO_DELETE' }
  | { type: 'ADD_NOTE'; payload: { cowId: string; note: string } }

const initialState: State = {
  pregnantCows: [],
  newCow: {},
  expandedCowId: null,
  editingCowId: null,
  lastDeletedCow: null,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_PREGNANT_COWS':
      return { ...state, pregnantCows: action.payload }
    case 'ADD_COW':
      return { ...state, pregnantCows: [...state.pregnantCows, action.payload] }
    case 'UPDATE_NEW_COW':
      return { ...state, newCow: { ...state.newCow, [action.field]: action.value } }
    case 'RESET_NEW_COW':
      return { ...state, newCow: {} }
    case 'SET_EXPANDED_COW':
      return { ...state, expandedCowId: action.id }
    case 'SET_EDITING_COW':
      return { ...state, editingCowId: action.id }
    case 'UPDATE_COW':
      return {
        ...state,
        pregnantCows: state.pregnantCows.map(cow =>
          cow.id === action.payload.id ? action.payload : cow
        ),
      }
    case 'DELETE_COW':
      const cowToDelete = state.pregnantCows.find(cow => cow.id === action.id)
      return {
        ...state,
        pregnantCows: state.pregnantCows.filter(cow => cow.id !== action.id),
        lastDeletedCow: cowToDelete || null,
      }
    case 'UNDO_DELETE':
      return state.lastDeletedCow
        ? {
            ...state,
            pregnantCows: [...state.pregnantCows, state.lastDeletedCow],
            lastDeletedCow: null,
          }
        : state
    case 'ADD_NOTE':
      return {
        ...state,
        pregnantCows: state.pregnantCows.map(cow =>
          cow.id === action.payload.cowId
            ? { ...cow, notes: [...(cow.notes || []), action.payload.note] }
            : cow
        ),
      }
    default:
      return state
  }
}

export default function PregnancyTrackingPage({ onBack }: PregnancyTrackingPageProps) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newNote, setNewNote] = useState('')
  const { toast } = useToast()
  const { user } = useUser()
  const { firebaseUser } = useFirebaseAuth()

  const calculateDueDate = useCallback((breedingDate: string) => {
    const date = new Date(breedingDate)
    date.setDate(date.getDate() + 280) // Aproximadamente 280 días de gestación
    return date.toISOString().split('T')[0]
  }, [])

  const loadPregnantCows = useCallback(async () => {
    if (user && firebaseUser) {
      try {
        const cows = await getPregnantCows(firebaseUser.uid)
        dispatch({ type: 'SET_PREGNANT_COWS', payload: cows })
      } catch (error) {
        console.error("Error loading pregnant cows:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar las vacas preñadas. Por favor, intenta de nuevo.",
          variant: "destructive",
        })
      }
    }
  }, [user, firebaseUser, toast])

  useEffect(() => {
    loadPregnantCows()
  }, [loadPregnantCows])

  const handleAddCow = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !firebaseUser) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para realizar esta acción.",
        variant: "destructive",
      })
      return
    }
    setIsSubmitting(true)
    const { name, breedingDate, weight, health, activity } = state.newCow

    let hasError = false

    if (!name) {
      toast({
        title: "Error",
        description: "El nombre de la vaca es requerido.",
        variant: "destructive",
      })
      hasError = true
    }

    if (!breedingDate) {
      toast({
        title: "Error",
        description: "La fecha de inseminación es requerida.",
        variant: "destructive",
      })
      hasError = true
    } else if (new Date(breedingDate) > new Date()) {
      toast({
        title: "Error",
        description: "La fecha de inseminación no puede ser futura.",
        variant: "destructive",
      })
      hasError = true
    }

    if (!weight) {
      toast({
        title: "Error",
        description: "El peso de la vaca es requerido.",
        variant: "destructive",
      })
      hasError = true
    } else if (typeof weight === 'number' && weight <= 0) {
      toast({
        title: "Error",
        description: "El peso debe ser un valor positivo.",
        variant: "destructive",
      })
      hasError = true
    }

    if (!health) {
      toast({
        title: "Error",
        description: "El estado de salud es requerido.",
        variant: "destructive",
      })
      hasError = true
    }

    if (!activity) {
      toast({
        title: "Error",
        description: "El nivel de actividad física es requerido.",
        variant: "destructive",
      })
      hasError = true
    }

    if (hasError) {
      setIsSubmitting(false)
      return
    }

    try {
      const newCow: Omit<PregnantCow, 'id'> = {
        ...state.newCow as Omit<PregnantCow, 'id'>,
        estimatedDueDate: calculateDueDate(breedingDate || ''),
        notes: []
      }
      const newCowId = await addPregnantCow(firebaseUser.uid, newCow)
      dispatch({ type: 'ADD_COW', payload: { ...newCow, id: newCowId } })
      dispatch({ type: 'RESET_NEW_COW' })
      toast({
        title: "Éxito",
        description: "La vaca ha sido agregada correctamente.",
      })
    } catch (error) {
      console.error("Error adding cow:", error)
      toast({
        title: "Error",
        description: "Error al agregar la vaca. Por favor, intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditCow = async (cow: PregnantCow) => {
    if (!user || !firebaseUser) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para realizar esta acción.",
        variant: "destructive",
      })
      return
    }
    setIsSubmitting(true)
    try {
      const updatedCow = {
        ...cow,
        estimatedDueDate: calculateDueDate(cow.breedingDate)
      }
      await updatePregnantCow(firebaseUser.uid, cow.id, updatedCow)
      dispatch({ type: 'UPDATE_COW', payload: updatedCow })
      dispatch({ type: 'SET_EDITING_COW', id: null })
      toast({
        title: "Éxito",
        description: "Los datos de la vaca han sido actualizados correctamente.",
      })
    } catch (error) {
      console.error("Error updating cow:", error)
      toast({
        title: "Error",
        description: "Error al actualizar la vaca. Por favor, intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCow = async (id: string) => {
    if (!user || !firebaseUser) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para realizar esta acción.",
        variant: "destructive",
      })
      return
    }
    setIsSubmitting(true)
    try {
      await deletePregnantCow(firebaseUser.uid, id)
      dispatch({ type: 'DELETE_COW', id })
      toast({
        title: "Éxito",
        description: "La vaca ha sido eliminada correctamente.",
      })
    } catch (error) {
      console.error("Error deleting cow:", error)
      toast({
        title: "Error",
        description: "Error al eliminar la vaca. Por favor, intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUndoDelete = async () => {
    if (!user || !firebaseUser || !state.lastDeletedCow) {
      return
    }
    setIsSubmitting(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...cowWithoutId } = state.lastDeletedCow
      const newCowId = await addPregnantCow(firebaseUser.uid, cowWithoutId)
      dispatch({ type: 'ADD_COW', payload: { ...state.lastDeletedCow, id: newCowId } })
      dispatch({ type: 'UNDO_DELETE' })
      toast({
        title: "Éxito",
        description: "La eliminación de la vaca ha sido deshecha.",
      })
    } catch (error) {
      console.error("Error restoring cow:", error)
      toast({
        title: "Error",
        description: "Error al restaurar la vaca. Por favor, intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddNote = async (cowId: string) => {
    if (!user || !firebaseUser) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para realizar esta acción.",
        variant: "destructive",
      })
      return
    }
    if (newNote.trim()) {
      setIsSubmitting(true)
      try {
        await addNoteToPregnantCow(firebaseUser.uid, cowId, newNote.trim())
        dispatch({ type: 'ADD_NOTE', payload: { cowId, note: newNote.trim() } })
        setNewNote('')
        toast({
          title: "Éxito",
          description: "La nota ha sido agregada correctamente.",
        })
      } catch (error) {
        console.error("Error adding note:", error)
        toast({
          title: "Error",
          description: "Error al agregar la nota. Por favor, intenta de nuevo.",
          variant: "destructive",
        })
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const getDaysUntilDue = useCallback((dueDate: string) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }, [])

  const getPregnancyProgress = useCallback((breedingDate: string) => {
    const today = new Date()
    const breeding = new Date(breedingDate)
    const diffTime = today.getTime() - breeding.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.min(Math.round((diffDays / 280) * 100), 100)
  }, [])

  const getAlerts = useCallback((cow: PregnantCow) => {
    const alerts = []
    const daysUntilDue = getDaysUntilDue(cow.estimatedDueDate)

    if (daysUntilDue <= 30) {
      alerts.push('Preparar para el parto inminente')
    }
    if (cow.health === 'Mala') {
      alerts.push('Atención médica urgente requerida')
    } else if (cow.health === 'Regular') {
      alerts.push('Programar revisión veterinaria')
    }
    if (cow.activity === 'Baja') {
      alerts.push('Monitorear actividad reducida')
    } else if (cow.activity === 'Alta') {
      alerts.push('Vigilar posible estrés por exceso de actividad')
    }

    return alerts
  }, [getDaysUntilDue])

  const getRecommendations = useCallback((cow: PregnantCow) => {
    const daysUntilDue = getDaysUntilDue(cow.estimatedDueDate)
    const recommendations = []

    if (daysUntilDue <= 60) {
      recommendations.push('Ajustar dieta para preparación al parto')
    }
    if (daysUntilDue <= 30) {
      recommendations.push('Preparar área de parto')
    }
    if (cow.health === 'Buena') {
      recommendations.push('Mantener rutina de cuidados actual')
    } else if (cow.health === 'Regular') {
      recommendations.push('Aumentar supervisión y considerar suplementos')
    } else {
      recommendations.push('Seguir estrictamente las indicaciones veterinarias')
    }
    if (cow.activity === 'Normal') {
      recommendations.push('Mantener nivel de actividad actual')
    } else if (cow.activity === 'Baja') {
      recommendations.push('Fomentar ejercicio moderado supervisado')
    } else {
      recommendations.push('Proporcionar espacios tranquilos para descanso')
    }

    return recommendations
  }, [getDaysUntilDue])

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-green-100 to-green-200 p-4 md:p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-4 md:p-8 border border-green-300">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <Image src="/images/tiempo.png" alt="Icono de Tiempo para el Parto" width={40} height={40} className="mr-4" />
              <h2 className="text-2xl md:text-3xl font-bold text-green-800">Tiempo para el Parto</h2>
            </div>
            <Button onClick={onBack} variant="outline" size="sm" className="flex items-center border-green-500 text-green-900 hover:bg-green-100 bg-green-300">
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver
            </Button>
          </div>
          <p className="text-base md:text-lg text-green-700 mb-6">
            Monitoreo y predicción del tiempo de parto para vacas preñadas.
          </p>

          <Card className="mb-8 bg-green-50 border-green-300">
            <CardHeader className="bg-green-100 border-b border-green-200">
              <CardTitle className="text-green-800">Registrar Nueva Vaca Preñada</CardTitle>
              <CardDescription className="text-green-600">Ingrese los datos de la vaca preñada para monitorear su embarazo.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleAddCow} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-green-700">Nombre de la Vaca</Label>
                    <Input
                      id="name"
                      value={state.newCow.name || ''}
                      onChange={(e) => dispatch({ type: 'UPDATE_NEW_COW', field: 'name', value: e.target.value })}
                      required
                      className="border-green-300 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="breedingDate" className="text-green-700">Fecha de Inseminación</Label>
                    <Input
                      id="breedingDate"
                      type="date"
                      max={new Date().toISOString().split('T')[0]}
                      value={state.newCow.breedingDate || ''}
                      onChange={(e) => dispatch({ type: 'UPDATE_NEW_COW', field: 'breedingDate', value: e.target.value })}
                      required
                      className="border-green-300 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight" className="text-green-700">Peso (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      value={state.newCow.weight || ''}
                      onChange={(e) => dispatch({ type: 'UPDATE_NEW_COW', field: 'weight', value: parseFloat(e.target.value) })}
                      required
                      className="border-green-300 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="health" className="text-green-700">Estado de Salud</Label>
                    <Select
                      onValueChange={(value) => dispatch({ type: 'UPDATE_NEW_COW', field: 'health', value })}
                      value={state.newCow.health}
                    >
                      <SelectTrigger id="health" className="w-full bg-white border-green-300 focus:border-green-500 focus:ring-green-500 cursor-pointer">
                        <SelectValue placeholder="Seleccionar estado de salud" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="Buena" className="cursor-pointer hover:bg-green-100">Buena</SelectItem>
                        <SelectItem value="Regular" className="cursor-pointer hover:bg-green-100">Regular</SelectItem>
                        <SelectItem value="Mala" className="cursor-pointer hover:bg-green-100">Mala</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="activity" className="text-green-700">Nivel de Actividad Física</Label>
                    <Select
                      onValueChange={(value) => dispatch({ type: 'UPDATE_NEW_COW', field: 'activity', value })}
                      value={state.newCow.activity}
                    >
                      <SelectTrigger id="activity" className="w-full bg-white border-green-300 focus:border-green-500 focus:ring-green-500 cursor-pointer">
                        <SelectValue placeholder="Seleccionar nivel de actividad" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="Alta" className="cursor-pointer hover:bg-green-100">Alta</SelectItem>
                        <SelectItem value="Normal" className="cursor-pointer hover:bg-green-100">Normal</SelectItem>
                        <SelectItem value="Baja" className="cursor-pointer hover:bg-green-100">Baja</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Agregando...
                    </>
                  ) : (
                    <>
                      <PlusCircle className="mr-2 h-4 w-4" /> Agregar Vaca Preñada
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {state.pregnantCows.map((cow) => (
              <Card key={cow.id} className="bg-green-50 border-green-300">
                <CardHeader className="bg-green-100 border-b border-green-200">
                  <CardTitle className="flex justify-between items-center text-green-800">
                    <span>{cow.name}</span>
                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="bg-blue-500 text-white hover:bg-blue-600">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] bg-white">
                          <DialogHeader>
                            <DialogTitle className="text-xl font-semibold text-green-800 mb-4">Notas para {cow.name}</DialogTitle>
                          </DialogHeader>
                          <div className="mt-4 space-y-4">
                            <ul className="list-disc pl-5 space-y-2 max-h-60 overflow-y-auto">
                              {cow.notes && cow.notes.map((note, index) => (
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
                        variant="outline"
                        size="sm"
                        onClick={() => dispatch({ type: 'SET_EDITING_COW', id: state.editingCowId === cow.id ? null : cow.id })}
                        className="text-blue-600 border-blue-300 hover:bg-blue-100"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCow(cow.id)}
                        className="text-red-600 border-red-300 hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => dispatch({ type: 'SET_EXPANDED_COW', id: state.expandedCowId === cow.id ? null : cow.id })}
                        className="text-green-600 border-green-300 hover:bg-green-100"
                      >
                        {state.expandedCowId === cow.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription className="text-green-600">
                    Fecha estimada de parto: {cow.estimatedDueDate} ({getDaysUntilDue(cow.estimatedDueDate)} días restantes)
                  </CardDescription>
                </CardHeader>
                {state.expandedCowId === cow.id && (
                  <CardContent className="pt-4">
                    {state.editingCowId === cow.id ? (
                      <form onSubmit={(e) => {
                        e.preventDefault()
                        handleEditCow(cow)
                      }} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`edit-name-${cow.id}`} className="text-green-700">Nombre de la Vaca</Label>
                            <Input
                              id={`edit-name-${cow.id}`}
                              value={cow.name}
                              onChange={(e) => dispatch({ type: 'UPDATE_COW', payload: { ...cow, name: e.target.value } })}
                              className="border-green-300 focus:border-green-500 focus:ring-green-500"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`edit-breedingDate-${cow.id}`} className="text-green-700">Fecha de Inseminación</Label>
                            <Input
                              id={`edit-breedingDate-${cow.id}`}
                              type="date"
                              max={new Date().toISOString().split('T')[0]}
                              value={cow.breedingDate}
                              onChange={(e) => dispatch({ type: 'UPDATE_COW', payload: { ...cow, breedingDate: e.target.value } })}
                              className="border-green-300 focus:border-green-500 focus:ring-green-500"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`edit-weight-${cow.id}`} className="text-green-700">Peso (kg)</Label>
                            <Input
                              id={`edit-weight-${cow.id}`}
                              type="number"
                              value={cow.weight}
                              onChange={(e) => dispatch({ type: 'UPDATE_COW', payload: { ...cow, weight: parseFloat(e.target.value) } })}
                              className="border-green-300 focus:border-green-500 focus:ring-green-500"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`edit-health-${cow.id}`} className="text-green-700">Estado de Salud</Label>
                            <Select
                              onValueChange={(value) => dispatch({ type: 'UPDATE_COW', payload: { ...cow, health: value as 'Buena' | 'Regular' | 'Mala' } })}
                              defaultValue={cow.health}
                            >
                              <SelectTrigger className="w-full bg-white border-green-300 focus:border-green-500 focus:ring-green-500 cursor-pointer">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white">
                                <SelectItem value="Buena" className="cursor-pointer hover:bg-green-100">Buena</SelectItem>
                                <SelectItem value="Regular" className="cursor-pointer hover:bg-green-100">Regular</SelectItem>
                                <SelectItem value="Mala" className="cursor-pointer hover:bg-green-100">Mala</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`edit-activity-${cow.id}`} className="text-green-700">Nivel de Actividad Física</Label>
                            <Select
                              onValueChange={(value) => dispatch({ type: 'UPDATE_COW', payload: { ...cow, activity: value as 'Alta' | 'Normal' | 'Baja' } })}
                              defaultValue={cow.activity}
                            >
                              <SelectTrigger className="w-full bg-white border-green-300 focus:border-green-500 focus:ring-green-500 cursor-pointer">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white">
                                <SelectItem value="Alta" className="cursor-pointer hover:bg-green-100">Alta</SelectItem>
                                <SelectItem value="Normal" className="cursor-pointer hover:bg-green-100">Normal</SelectItem>
                                <SelectItem value="Baja" className="cursor-pointer hover:bg-green-100">Baja</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
                            <Save className="mr-2 h-4 w-4" /> Guardar Cambios
                          </Button>
                          <Button type="button" onClick={() => dispatch({ type: 'SET_EDITING_COW', id: null })} variant="outline" className="border-green-300 text-green-600 hover:bg-green-100">
                            <X className="mr-2 h-4 w-4" /> Cancelar
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2 text-green-700">Progreso del Embarazo</h4>
                          <Progress value={getPregnancyProgress(cow.breedingDate)} className="w-full h-2 bg-green-200" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-green-700">
                          <div>
                            <p><strong>Peso:</strong> {cow.weight} kg</p>
                            <p><strong>Salud:</strong> {cow.health}</p>
                            <p><strong>Actividad Física:</strong> {cow.activity}</p>
                          </div>
                          <div>
                            <p><strong>Fecha de Inseminación:</strong> {cow.breedingDate}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2 text-green-700">Alertas</h4>
                          <ul className="list-disc pl-5">
                            {getAlerts(cow).map((alert, index) => (
                              <li key={index} className="text-amber-600">
                                <AlertTriangle className="inline mr-2 h-4 w-4" />
                                {alert}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2 text-green-700">Recomendaciones</h4>
                          <ul className="list-disc pl-5">
                            {getRecommendations(cow).map((recommendation, index) => (
                              <li key={index} className="text-blue-600">
                                <Activity className="inline mr-2 h-4 w-4" />
                                {recommendation}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
          {state.lastDeletedCow && (
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