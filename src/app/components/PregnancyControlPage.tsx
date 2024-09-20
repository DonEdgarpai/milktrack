'use client'

import { useState, useEffect, useCallback } from 'react'
import { Trash2, CheckCircle, AlertTriangle, ArrowLeft, Edit, Undo2, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import ProtectedRoute from './ProtectedRoute'
import { useUser } from "@clerk/nextjs"
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth'
import { getInseminations, addInsemination, updateInsemination, deleteInsemination, getChecks, addCheck, deleteCheck } from '@/firestore'
import Image from 'next/image'

interface Insemination {
  id: string
  cowId: string
  bullId: string
  date: string
  hasBirthed: boolean
  notes: string
}

interface Check {
  id: string
  cowId: string
  date: string
  checkNumber: number
}

interface PregnancyControlPageProps {
  onBack: () => void
}

export default function PregnancyControlPage({ onBack }: PregnancyControlPageProps) {
  const { user } = useUser()
  const { firebaseUser } = useFirebaseAuth()
  const [inseminations, setInseminations] = useState<Insemination[]>([])
  const [checks, setChecks] = useState<Check[]>([])
  const [cowId, setCowId] = useState('')
  const [bullId, setBullId] = useState('')
  const [inseminationDate, setInseminationDate] = useState('')
  const [lastDeletedInsemination, setLastDeletedInsemination] = useState<Insemination | null>(null)
  const [lastDeletedChecks, setLastDeletedChecks] = useState<Check[]>([])
  const [editingInsemination, setEditingInsemination] = useState<Insemination | null>(null)
  const [showNotesDialog, setShowNotesDialog] = useState(false)
  const [currentNotes, setCurrentNotes] = useState('')
  const [currentInseminationId, setCurrentInseminationId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  const loadInseminations = useCallback(async () => {
    if (user && firebaseUser) {
      setIsLoading(true)
      try {
        const loadedInseminations = await getInseminations(firebaseUser.uid)
        setInseminations(loadedInseminations as Insemination[])
      } catch (error) {
        console.error("Error loading inseminations:", error)
        setAlertMessage({ type: 'error', message: 'Error al cargar las inseminaciones. Por favor, intenta de nuevo.' })
      } finally {
        setIsLoading(false)
      }
    }
  }, [user, firebaseUser])

  const loadChecks = useCallback(async () => {
    if (user && firebaseUser) {
      setIsLoading(true)
      try {
        const loadedChecks = await getChecks(firebaseUser.uid)
        setChecks(loadedChecks as Check[])
      } catch (error) {
        console.error("Error loading checks:", error)
        setAlertMessage({ type: 'error', message: 'Error al cargar los chequeos. Por favor, intenta de nuevo.' })
      } finally {
        setIsLoading(false)
      }
    }
  }, [user, firebaseUser])

  useEffect(() => {
    loadInseminations()
    loadChecks()
  }, [loadInseminations, loadChecks])

  const handleInseminationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !firebaseUser) {
      setAlertMessage({ type: 'error', message: 'Debes iniciar sesión para realizar esta acción.' })
      return
    }

    setIsLoading(true)
    try {
      const newInsemination: Omit<Insemination, 'id'> = {
        cowId,
        bullId,
        date: inseminationDate,
        hasBirthed: false,
        notes: ''
      }
      const inseminationId = await addInsemination(firebaseUser.uid, newInsemination)
      setInseminations([...inseminations, { ...newInsemination, id: inseminationId }])

      // Schedule first check after 30 days
      const firstCheckDate = new Date(inseminationDate)
      firstCheckDate.setDate(firstCheckDate.getDate() + 30)
      const newCheck: Omit<Check, 'id'> = {
        cowId,
        date: firstCheckDate.toISOString().split('T')[0],
        checkNumber: 1
      }
      const checkId = await addCheck(firebaseUser.uid, newCheck)
      setChecks([...checks, { ...newCheck, id: checkId }])

      setAlertMessage({ type: 'success', message: 'Inseminación registrada exitosamente.' })

      // Clear form
      setCowId('')
      setBullId('')
      setInseminationDate('')
    } catch (error) {
      console.error("Error al registrar la inseminación:", error)
      setAlertMessage({ type: 'error', message: 'Error al registrar la inseminación. Por favor, intenta de nuevo.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteInsemination = async (id: string) => {
    if (!user || !firebaseUser) {
      setAlertMessage({ type: 'error', message: 'Debes iniciar sesión para realizar esta acción.' })
      return
    }

    setIsLoading(true)
    try {
      const inseminationToDelete = inseminations.find(insemination => insemination.id === id)
      if (inseminationToDelete) {
        setLastDeletedInsemination(inseminationToDelete)
        const checksToDelete = checks.filter(check => check.cowId === inseminationToDelete.cowId)
        setLastDeletedChecks(checksToDelete)

        await deleteInsemination(firebaseUser.uid, id)
        setInseminations(inseminations.filter(insemination => insemination.id !== id))

        for (const check of checksToDelete) {
          await deleteCheck(firebaseUser.uid, check.id)
        }
        setChecks(checks.filter(check => check.cowId !== inseminationToDelete.cowId))

        setAlertMessage({ type: 'success', message: 'Inseminación eliminada exitosamente.' })
      }
    } catch (error) {
      console.error("Error al eliminar la inseminación:", error)
      setAlertMessage({ type: 'error', message: 'Error al eliminar la inseminación. Por favor, intenta de nuevo.' })
    } finally {
      setIsLoading(false)
    }
  }

  const undoDeleteInsemination = async () => {
    if (!user || !firebaseUser || !lastDeletedInsemination) {
      return
    }

    setIsLoading(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...inseminationWithoutId } = lastDeletedInsemination
      const newInseminationId = await addInsemination(firebaseUser.uid, inseminationWithoutId)
      setInseminations([...inseminations, { ...lastDeletedInsemination, id: newInseminationId }])

      for (const check of lastDeletedChecks) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...checkWithoutId } = check
        const newCheckId = await addCheck(firebaseUser.uid, checkWithoutId)
        setChecks(prevChecks => [...prevChecks, { ...check, id: newCheckId }])
      }

      setAlertMessage({ type: 'success', message: 'Inseminación restaurada exitosamente.' })
      setLastDeletedInsemination(null)
      setLastDeletedChecks([])
    } catch (error) {
      console.error("Error al restaurar la inseminación:", error)
      setAlertMessage({ type: 'error', message: 'Error al restaurar la inseminación. Por favor, intenta de nuevo.' })
    } finally {
      setIsLoading(false)
    }
  }

  const completeCheck = async (checkId: string) => {
    if (!user || !firebaseUser) {
      setAlertMessage({ type: 'error', message: 'Debes iniciar sesión para realizar esta acción.' })
      return
    }

    setIsLoading(true)
    try {
      const completedCheck = checks.find(check => check.id === checkId)
      if (completedCheck) {
        await deleteCheck(firebaseUser.uid, checkId)
        setChecks(checks.filter(check => check.id !== checkId))

        if (completedCheck.checkNumber < 9) {
          const nextCheckDate = new Date(completedCheck.date)
          nextCheckDate.setDate(nextCheckDate.getDate() + 30)
          const newCheck: Omit<Check, 'id'> = {
            cowId: completedCheck.cowId,
            date: nextCheckDate.toISOString().split('T')[0],
            checkNumber: completedCheck.checkNumber + 1
          }
          const newCheckId = await addCheck(firebaseUser.uid, newCheck)
          setChecks(prevChecks => [...prevChecks, { ...newCheck, id: newCheckId }])
        }

        setAlertMessage({ type: 'success', message: 'Chequeo completado exitosamente.' })
      }
    } catch (error) {
      console.error("Error al completar el chequeo:", error)
      setAlertMessage({ type: 'error', message: 'Error al completar el chequeo. Por favor, intenta de nuevo.' })
    } finally {
      setIsLoading(false)
    }
  }

  const markAsBirthed = async (inseminationId: string) => {
    if (!user || !firebaseUser) {
      setAlertMessage({ type: 'error', message: 'Debes iniciar sesión para realizar esta acción.' })
      return
    }

    setIsLoading(true)
    try {
      await updateInsemination(firebaseUser.uid, inseminationId, { hasBirthed: true })
      setInseminations(inseminations.map(insemination => 
        insemination.id === inseminationId ? { ...insemination, hasBirthed: true } : insemination
      ))

      const inseminationToUpdate = inseminations.find(i => i.id === inseminationId)
      if (inseminationToUpdate) {
        const checksToDelete = checks.filter(check => check.cowId === inseminationToUpdate.cowId)
        for (const check of checksToDelete) {
          await deleteCheck(firebaseUser.uid, check.id)
        }
        setChecks(checks.filter(check => check.cowId !== inseminationToUpdate.cowId))
      }

      setAlertMessage({ type: 'success', message: 'Inseminación marcada como nacida exitosamente.' })
    } catch (error) {
      console.error("Error al marcar la inseminación como nacida:", error)
      setAlertMessage({ type: 'error', message: 'Error al marcar la inseminación como nacida. Por favor, intenta de nuevo.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditInsemination = (insemination: Insemination) => {
    setEditingInsemination(insemination)
    setCowId(insemination.cowId)
    setBullId(insemination.bullId)
    setInseminationDate(insemination.date)
  }

  const handleUpdateInsemination = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !firebaseUser || !editingInsemination) {
      setAlertMessage({ type: 'error', message: 'Debes iniciar sesión para realizar esta acción.' })
      return
    }

    setIsLoading(true)
    try {
      const updatedInsemination: Partial<Insemination> = {
        cowId,
        bullId,
        date: inseminationDate
      }
      await updateInsemination(firebaseUser.uid, editingInsemination.id, updatedInsemination)
      setInseminations(inseminations.map(insemination => 
        insemination.id === editingInsemination.id ? { ...insemination, ...updatedInsemination } : insemination
      ))
      setChecks(checks.map(check => 
        check.cowId === editingInsemination.cowId ? { ...check, cowId } : check
      ))
      setAlertMessage({ type: 'success', message: 'Inseminación actualizada exitosamente.' })
      setEditingInsemination(null)
      setCowId('')
      setBullId('')
      setInseminationDate('')
    } catch (error) {
      console.error("Error al actualizar la inseminación:", error)
      setAlertMessage({ type: 'error', message: 'Error al actualizar la inseminación. Por favor, intenta de nuevo.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleNotesSubmit = async () => {
    if (!user || !firebaseUser || !currentInseminationId) {
      setAlertMessage({ type: 'error', message: 'Debes iniciar sesión para realizar esta acción.' })
      return
    }

    setIsSavingNotes(true)
    try {
      await updateInsemination(firebaseUser.uid, currentInseminationId, { notes: currentNotes })
      setInseminations(inseminations.map(insemination => 
        insemination.id === currentInseminationId ? { ...insemination, notes: currentNotes } : insemination
      ))
      setAlertMessage({ type: 'success', message: 'Notas actualizadas exitosamente.' })
      setShowNotesDialog(false)
      setCurrentNotes('')
      setCurrentInseminationId(null)
    } catch (error) {
      console.error("Error al actualizar las notas:", error)
      setAlertMessage({ type: 'error', message: 'Error al actualizar las notas. Por favor, intenta de nuevo.' })
    } finally {
      setIsSavingNotes(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-green-100 p-4 md:p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-4 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <Image src="/images/vaca (9).png" alt="Logo de Control de Preñez" width={50} height={50} className="mr-4" />
              <h2 className="text-2xl md:text-3xl font-bold text-green-800">Control de Preñez</h2>
            </div>
            <Button onClick={onBack} variant="outline" size="sm" className="flex items-center border-green-500 text-green-900 hover:bg-green-100 bg-green-300">
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver
            </Button>
          </div>
          <p className="text-base md:text-lg text-green-700 mb-6">
            Bienvenido al módulo de Control de Preñez. Aquí podrás gestionar y monitorear el ciclo reproductivo de tus vacas.
          </p>

          {alertMessage && (
            <Alert variant={alertMessage.type === 'error' ? 'destructive' : 'default'} className="mb-4">
              <AlertTitle>{alertMessage.type === 'error' ? 'Error' : 'Éxito'}</AlertTitle>
              <AlertDescription>{alertMessage.message}</AlertDescription>
            </Alert>
          )}

          {isLoading && (
            <div className="flex justify-center items-center mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            </div>
          )}

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-green-800">
                  {editingInsemination ? 'Editar Inseminación' : 'Registro de Inseminación'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={editingInsemination ? handleUpdateInsemination : handleInseminationSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cow-id" className="text-green-700">ID de la Vaca</Label>
                      <Input
                        id="cow-id"
                        value={cowId}
                        onChange={(e) => setCowId(e.target.value)}
                        className="border-green-300 focus:border-green-500 focus:ring-green-500"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="insemination-date" className="text-green-700">Fecha de Inseminación</Label>
                      <Input
                        id="insemination-date"
                        type="date"
                        value={inseminationDate}
                        onChange={(e) => setInseminationDate(e.target.value)}
                        className="border-green-300 focus:border-green-500 focus:ring-green-500"
                        required
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="bull-id" className="text-green-700">ID del Toro</Label>
                      <Input
                        id="bull-id"
                        value={bullId}
                        onChange={(e) => setBullId(e.target.value)}
                        className="border-green-300 focus:border-green-500 focus:ring-green-500"
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-700 transition duration-300">
                    {editingInsemination ? 'Actualizar Inseminación' : 'Registrar Inseminación'}
                  </Button>
                  {editingInsemination && (
                    <Button type="button" onClick={() => {
                      setEditingInsemination(null)
                      setCowId('')
                      setBullId('')
                      setInseminationDate('')
                    }} className="w-full mt-2 bg-gray-200 hover:bg-gray-300 text-gray-800">
                      Cancelar Edición
                    </Button>
                  )}
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-green-800">Inseminaciones Registradas</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {inseminations.map((insemination) => (
                    <li key={insemination.id} className="bg-green-50 p-4 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center">
                      <div className="mb-2 md:mb-0">
                        <p className="font-semibold">Vaca #{insemination.cowId}</p>
                        <p>Toro: #{insemination.bullId}</p>
                        <p>Fecha: {insemination.date}</p>
                        <p>Estado: {insemination.hasBirthed ? 'Ha dado cría' : 'En gestación'}</p>
                      </div>
                      <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
                        <Button
                          onClick={() => {
                            setCurrentInseminationId(insemination.id)
                            setCurrentNotes(insemination.notes)
                            setShowNotesDialog(true)
                          }}
                          className="bg-blue-500 text-white px-3 py-1 rounded-full hover:bg-blue-600 transition duration-300 flex items-center"
                          aria-label={`Agregar notas para vaca #${insemination.cowId}`}
                        >
                          <FileText size={16} className="mr-1" />
                          Notas
                        </Button>
                        {!insemination.hasBirthed && (
                          <Button
                            onClick={() => markAsBirthed(insemination.id)}
                            className="bg-blue-500 text-white px-3 py-1 rounded-full hover:bg-blue-600 transition duration-300 flex items-center"
                            aria-label={`Marcar como nacido para vaca #${insemination.cowId}`}
                          >
                            <CheckCircle size={16} className="mr-1" />
                            Ha dado a luz
                          </Button>
                        )}
                        <Button
                          onClick={() => handleEditInsemination(insemination)}
                          className="bg-yellow-500 text-white px-3 py-1 rounded-full hover:bg-yellow-600 transition duration-300 flex items-center"
                          aria-label={`Editar registro de inseminación para vaca #${insemination.cowId}`}
                        >
                          <Edit size={16} className="mr-1" />
                          Editar
                        </Button>
                        <Button
                          onClick={() => handleDeleteInsemination(insemination.id)}
                          variant="destructive"
                          size="sm"
                          className="text-red-600 hover:text-red-800"
                          aria-label={`Eliminar registro de inseminación para vaca #${insemination.cowId}`}
                        >
                          <Trash2 size={20} />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
                {lastDeletedInsemination && (
                  <Button onClick={undoDeleteInsemination} className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-white">
                    <Undo2 className="mr-2 h-4 w-4" />
                    Deshacer Eliminación
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-green-800">Próximos Chequeos y Alertas</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {checks.map((check) => {
                    const nextCheckDate = new Date(check.date)
                    const today = new Date()
                    const daysUntilCheck = Math.ceil((nextCheckDate.getTime() - today.getTime()) / (1000 * 3600 * 24))
                    const isAlert = daysUntilCheck <= 7

                    return (
                      <li key={check.id} className={`p-4 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center ${isAlert ? 'bg-yellow-100' : 'bg-green-50'}`}>
                        <div className="mb-2 md:mb-0">
                          <p className="font-semibold">Vaca #{check.cowId}</p>
                          <p>Chequeo #{check.checkNumber}</p>
                          <p>Fecha de chequeo: {check.date}</p>
                          {isAlert && (
                            <p className="text-yellow-700 font-semibold">
                              <AlertTriangle size={16} className="inline mr-1" />
                              Alerta: Chequeo en {daysUntilCheck} día(s)
                            </p>
                          )}
                        </div>
                        <Button
                          onClick={() => completeCheck(check.id)}
                          className="bg-green-500 text-white px-3 py-1 rounded-full hover:bg-green-600 transition duration-300 flex items-center"
                          aria-label={`Marcar chequeo como completado para vaca #${check.cowId}`}
                        >
                          <CheckCircle size={16} className="mr-1" />
                          Completar chequeo
                        </Button>
                      </li>
                    )
                  })}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent className='bg-white'>
          <DialogHeader>
            <DialogTitle>Notas de Control de Preñez</DialogTitle>
          </DialogHeader>
          <Textarea
            value={currentNotes}
            onChange={(e) => setCurrentNotes(e.target.value)}
            placeholder="Ingrese notas sobre el control de preñez..."
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setShowNotesDialog(false)} className='bg-gray-200 text-gray-800 hover:bg-gray-300'>
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={handleNotesSubmit} 
              className='bg-green-600 text-white hover:bg-green-700'
              disabled={isSavingNotes}
            >
              {isSavingNotes ? 'Guardando...' : 'Guardar Notas'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  )
}