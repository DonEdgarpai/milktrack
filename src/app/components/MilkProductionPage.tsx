'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Plus, Edit, Trash, Undo2 } from 'lucide-react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Badge } from "./ui/badge"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, TooltipProps } from 'recharts'
import ProtectedRoute from './ProtectedRoute'
import { useUser } from "@clerk/nextjs"
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth'
import {
  getMilkCows,
  addMilkCow,
  updateMilkCow,
  deleteMilkCow,
  getMilkProductionRecords,
  addMilkProductionRecord,
  updateMilkProductionRecord,
  deleteMilkProductionRecord,
  getMilkIncidents,
  addMilkIncident,
  updateMilkIncident,
  deleteMilkIncident,
  MilkCow,
  MilkProductionRecord,
  MilkIncident
} from '@/firestore'

interface MilkProductionPageProps {
  onBack: () => void
}

export default function MilkProductionPage({ onBack }: MilkProductionPageProps) {
  const [cows, setCows] = useState<MilkCow[]>([])
  const [milkProductions, setMilkProductions] = useState<MilkProductionRecord[]>([])
  const [incidents, setIncidents] = useState<MilkIncident[]>([])
  const [selectedCow, setSelectedCow] = useState<string>('')
  const [newProduction, setNewProduction] = useState<Partial<MilkProductionRecord>>({
    date: new Date().toISOString().split('T')[0],
    morning: 0,
    afternoon: 0,
    evening: 0,
    quality: { fat: undefined, protein: undefined }
  })
  const [newIncident, setNewIncident] = useState<Partial<MilkIncident>>({
    date: new Date().toISOString().split('T')[0],
    type: 'other'
  })
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error' | 'warning', message: string } | null>(null)
  const [showProductionDialog, setShowProductionDialog] = useState(false)
  const [showIncidentDialog, setShowIncidentDialog] = useState(false)
  const [showCowDialog, setShowCowDialog] = useState(false)
  const [newCow, setNewCow] = useState<Partial<MilkCow>>({})
  const [productionPeriod, setProductionPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [editingCow, setEditingCow] = useState<MilkCow | null>(null)
  const [editingProduction, setEditingProduction] = useState<MilkProductionRecord | null>(null)
  const [editingIncident, setEditingIncident] = useState<MilkIncident | null>(null)
  const [lastDeletedCow, setLastDeletedCow] = useState<MilkCow | null>(null)
  const [lastDeletedProduction, setLastDeletedProduction] = useState<MilkProductionRecord | null>(null)
  const [lastDeletedIncident, setLastDeletedIncident] = useState<MilkIncident | null>(null)
  const chartRef = useRef<HTMLDivElement>(null)
  const { user } = useUser()
  const { firebaseUser } = useFirebaseAuth()

  useEffect(() => {
    const loadData = async () => {
      if (user && firebaseUser) {
        try {
          const loadedCows = await getMilkCows(firebaseUser.uid)
          setCows(loadedCows)
          const loadedProductions = await getMilkProductionRecords(firebaseUser.uid)
          setMilkProductions(loadedProductions)
          const loadedIncidents = await getMilkIncidents(firebaseUser.uid)
          setIncidents(loadedIncidents)
        } catch (error) {
          console.error("Error loading data:", error)
          setAlertMessage({ type: 'error', message: 'Error al cargar los datos. Por favor, intente de nuevo.' })
        }
      }
    }
    loadData()
  }, [user, firebaseUser])

  const handleAddCow = async () => {
    if (!user || !firebaseUser) {
      setAlertMessage({ type: 'error', message: 'Debes iniciar sesión para realizar esta acción.' })
      return
    }
    if (!newCow.name || !newCow.tag) {
      setAlertMessage({ type: 'error', message: 'Por favor, complete todos los campos de la vaca.' })
      return
    }

    try {
      const cowToAdd: Omit<MilkCow, 'id'> = {
        name: newCow.name,
        tag: newCow.tag
      }
      const newCowId = await addMilkCow(firebaseUser.uid, cowToAdd)
      setCows(prev => [...prev, { ...cowToAdd, id: newCowId }])
      setAlertMessage({ type: 'success', message: 'Vaca agregada exitosamente.' })
      setShowCowDialog(false)
      setNewCow({})
    } catch (error) {
      console.error("Error adding cow:", error)
      setAlertMessage({ type: 'error', message: 'Error al agregar la vaca. Por favor, intente de nuevo.' })
    }
  }

  const handleEditCow = async () => {
    if (!user || !firebaseUser || !editingCow) {
      setAlertMessage({ type: 'error', message: 'Debes iniciar sesión para realizar esta acción.' })
      return
    }
    if (!editingCow.name || !editingCow.tag) {
      setAlertMessage({ type: 'error', message: 'Por favor, complete todos los campos de la vaca.' })
      return
    }

    try {
      await updateMilkCow(firebaseUser.uid, editingCow.id, editingCow)
      setCows(prev => prev.map(cow => cow.id === editingCow.id ? editingCow : cow))
      setAlertMessage({ type: 'success', message: 'Vaca actualizada exitosamente.' })
      setEditingCow(null)
    } catch (error) {
      console.error("Error updating cow:", error)
      setAlertMessage({ type: 'error', message: 'Error al actualizar la vaca. Por favor, intente de nuevo.' })
    }
  }

  const handleDeleteCow = async (id: string) => {
    if (!user || !firebaseUser) {
      setAlertMessage({ type: 'error', message: 'Debes iniciar sesión para realizar esta acción.' })
      return
    }
    try {
      await deleteMilkCow(firebaseUser.uid, id)
      const cowToDelete = cows.find(cow => cow.id === id)
      if (cowToDelete) {
        setCows(prev => prev.filter(cow => cow.id !== id))
        setLastDeletedCow(cowToDelete)
        setAlertMessage({ type: 'success', message: 'Vaca eliminada exitosamente.' })
      }
    } catch (error) {
      console.error("Error deleting cow:", error)
      setAlertMessage({ type: 'error', message: 'Error al eliminar la vaca. Por favor, intente de nuevo.' })
    }
  }

  const handleUndoDeleteCow = async () => {
    if (!user || !firebaseUser || !lastDeletedCow) {
      return
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...cowWithoutId } = lastDeletedCow
      const newCowId = await addMilkCow(firebaseUser.uid, cowWithoutId)
      setCows(prev => [...prev, { ...lastDeletedCow, id: newCowId }])
      setLastDeletedCow(null)
      setAlertMessage({ type: 'success', message: 'Eliminación de vaca deshecha.' })
    } catch (error) {
      console.error("Error restoring cow:", error)
      setAlertMessage({ type: 'error', message: 'Error al restaurar la vaca. Por favor, intente de nuevo.' })
    }
  }

  const handleAddProduction = async () => {
    if (!user || !firebaseUser) {
      setAlertMessage({ type: 'error', message: 'Debes iniciar sesión para realizar esta acción.' })
      return
    }
    if (!selectedCow || !newProduction.date) {
      setAlertMessage({ type: 'error', message: 'Por favor, seleccione una vaca y una fecha.' })
      return
    }
  
    const total = (newProduction.morning || 0) + (newProduction.afternoon || 0) + (newProduction.evening || 0)
    const productionToAdd: Omit<MilkProductionRecord, 'id'> = {
      cowId: selectedCow,
      date: newProduction.date,
      morning: newProduction.morning || 0,
      afternoon: newProduction.afternoon || 0,
      evening: newProduction.evening || 0,
      total,
      quality: {
        fat: newProduction.quality?.fat ?? undefined,
        protein: newProduction.quality?.protein ?? undefined
      }
    }
  
    try {
      const newProductionId = await addMilkProductionRecord(firebaseUser.uid, productionToAdd)
      setMilkProductions(prev => [...prev, { ...productionToAdd, id: newProductionId }])
      setAlertMessage({ type: 'success', message: 'Producción de leche registrada exitosamente.' })
      setShowProductionDialog(false)
      setNewProduction({
        date: new Date().toISOString().split('T')[0],
        morning: 0,
        afternoon: 0,
        evening: 0,
        quality: { fat: undefined, protein: undefined }
      })
    } catch (error) {
      console.error("Error adding milk production:", error)
      setAlertMessage({ type: 'error', message: 'Error al registrar la producción de leche. Por favor, intente de nuevo.' })
    }
  }

  const handleEditProduction = async () => {
    if (!user || !firebaseUser || !editingProduction) {
      setAlertMessage({ type: 'error', message: 'Debes iniciar sesión para realizar esta acción.' })
      return
    }

    const total = editingProduction.morning + editingProduction.afternoon + editingProduction.evening
    const updatedProduction = { ...editingProduction, total }

    try {
      await updateMilkProductionRecord(firebaseUser.uid, updatedProduction.id, updatedProduction)
      setMilkProductions(prev => prev.map(prod => prod.id === updatedProduction.id ? updatedProduction : prod))
      setAlertMessage({ type: 'success', message: 'Producción actualizada exitosamente.' })
      setEditingProduction(null)
    } catch (error) {
      console.error("Error updating milk production:", error)
      setAlertMessage({ type: 'error', message: 'Error al actualizar la producción. Por favor, intente de nuevo.' })
    }
  }

  const handleDeleteProduction = async (id: string) => {
    if (!user || !firebaseUser) {
      setAlertMessage({ type: 'error', message: 'Debes iniciar sesión para realizar esta acción.' })
      return
    }
    try {
      await deleteMilkProductionRecord(firebaseUser.uid, id)
      const productionToDelete = milkProductions.find(prod => prod.id === id)
      if (productionToDelete) {
        setMilkProductions(prev => prev.filter(prod => prod.id !== id))
        setLastDeletedProduction(productionToDelete)
        setAlertMessage({ type: 'success', message: 'Registro de producción eliminado exitosamente.' })
      }
    } catch (error) {
      console.error("Error deleting milk production:", error)
      setAlertMessage({ type: 'error', message: 'Error al eliminar el registro de producción. Por favor, intente de nuevo.' })
    }
  }

  const handleUndoDeleteProduction = async () => {
    if (!user || !firebaseUser || !lastDeletedProduction) {
      return
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...productionWithoutId } = lastDeletedProduction
      const newProductionId = await addMilkProductionRecord(firebaseUser.uid, productionWithoutId)
      setMilkProductions(prev => [...prev, { ...lastDeletedProduction, id: newProductionId }])
      setLastDeletedProduction(null)
      setAlertMessage({ type: 'success', message: 'Eliminación de registro de producción deshecha.' })
    } catch (error) {
      console.error("Error restoring milk production:", error)
      setAlertMessage({ type: 'error', message: 'Error al restaurar el registro de producción. Por favor, intente de nuevo.' })
    }
  }

  const handleAddIncident = async () => {
    if (!user || !firebaseUser) {
      setAlertMessage({ type: 'error', message: 'Debes iniciar sesión para realizar esta acción.' })
      return
    }
    if (!newIncident.date || !newIncident.description) {
      setAlertMessage({ type: 'error', message: 'Por favor, complete todos los campos del incidente.' })
      return
    }

    const incidentToAdd: Omit<MilkIncident, 'id'> = {
      cowId: selectedCow || null,
      date: newIncident.date,
      description: newIncident.description,
      type: newIncident.type || 'other'
    }

    try {
      const newIncidentId = await addMilkIncident(firebaseUser.uid, incidentToAdd)
      setIncidents(prev => [...prev, { ...incidentToAdd, id: newIncidentId }])
      setAlertMessage({ type: 'success', message: 'Incidente registrado exitosamente.' })
      setShowIncidentDialog(false)
      setNewIncident({
        date: new Date().toISOString().split('T')[0],
        type: 'other'
      })
    } catch (error) {
      console.error("Error adding incident:", error)
      setAlertMessage({ type: 'error', message: 'Error al registrar el incidente. Por favor, intente de nuevo.' })
    }
  }

  const handleEditIncident = async () => {
    if (!user || !firebaseUser || !editingIncident) {
      setAlertMessage({ type: 'error', message: 'Debes iniciar sesión para realizar esta acción.' })
      return
    }

    try {
      await updateMilkIncident(firebaseUser.uid, editingIncident.id, editingIncident)
      setIncidents(prev => prev.map(inc => inc.id === editingIncident.id ? editingIncident : inc))
      setAlertMessage({ type: 'success', message: 'Incidente actualizado exitosamente.' })
      setEditingIncident(null)
    } catch (error) {
      console.error("Error updating incident:", error)
      setAlertMessage({ type: 'error', message: 'Error al actualizar el incidente. Por favor, intente de nuevo.' })
    }
  }

  const handleDeleteIncident = async (id: string) => {
    if (!user || !firebaseUser) {
      setAlertMessage({ type: 'error', message: 'Debes iniciar sesión para realizar esta acción.' })
      return
    }
    try {
      await deleteMilkIncident(firebaseUser.uid, id)
      const incidentToDelete = incidents.find(inc => inc.id === id)
      if (incidentToDelete) {
        setIncidents(prev => prev.filter(inc => inc.id !== id))
        setLastDeletedIncident(incidentToDelete)
        setAlertMessage({ type: 'success', message: 'Incidente eliminado exitosamente.' })
      }
    } catch (error) {
      console.error("Error deleting incident:", error)
      setAlertMessage({ type: 'error', message: 'Error al eliminar el incidente. Por favor, intente de nuevo.' })
    }
  }

  const handleUndoDeleteIncident = async () => {
    if (!user || !firebaseUser || !lastDeletedIncident) {
      return
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...incidentWithoutId } = lastDeletedIncident
      const newIncidentId = await addMilkIncident(firebaseUser.uid, incidentWithoutId)
      setIncidents(prev => [...prev, { ...lastDeletedIncident, id: newIncidentId }])
      setLastDeletedIncident(null)
      setAlertMessage({ type: 'success', message: 'Eliminación de incidente deshecha.' })
    } catch (error) {
      console.error("Error restoring incident:", error)
      setAlertMessage({ type: 'error', message: 'Error al restaurar el incidente. Por favor, intente de nuevo.' })
    }
  }

  const getProductionData = () => {
    let data: { date: string, total: number }[] = []
    switch (productionPeriod) {
      case 'daily':
        data = milkProductions.reduce((acc, curr) => {
          const existingDay = acc.find(d => d.date === curr.date)
          if (existingDay) {
            existingDay.total += curr.total
          } else {
            acc.push({ date: curr.date, total: curr.total })
          }
          return acc
        }, [] as { date: string, total: number }[])
        break
      case 'weekly':
        const weeklyData: { [week: string]: { total: number, count: number } } = {}
        milkProductions.forEach(p => {
          const date = new Date(p.date)
          const week = `${date.getFullYear()}-W${Math.floor((date.getDate() - 1) / 7) + 1}`
          if (!weeklyData[week]) weeklyData[week] = { total: 0, count: 0 }
          weeklyData[week].total += p.total
          weeklyData[week].count++
        })
        data = Object.entries(weeklyData).map(([week, { total, count }]) => ({
          date: week,
          total: total / count
        }))
        break
      case 'monthly':
        const monthlyData: { [month: string]: { total: number, count: number } } = {}
        milkProductions.forEach(p => {
          const month = p.date.substring(0, 7) // YYYY-MM
          if (!monthlyData[month]) monthlyData[month] = { total: 0, count: 0 }
          monthlyData[month].total += p.total
          monthlyData[month].count++
        })
        data = Object.entries(monthlyData).map(([month, { total, count }]) => ({
          date: month,
          total: total / count
        }))
        break
    }
    return data.sort((a, b) => a.date.localeCompare(b.date))
  }

  const getProductionDetailsForDate = (date: string) => {
    return milkProductions.filter(p => p.date === date).map(p => ({
      cowName: cows.find(c => c.id === p.cowId)?.name,
      total: p.total
    }))
  }

  const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
    if (active && payload && payload.length > 0 && label) {
      const details = getProductionDetailsForDate(label)
      return (
        <div className="bg-white p-4 border rounded shadow">
          <p className="font-bold">{`Fecha: ${label}`}</p>
          <p>{`Total: ${payload[0].value?.toFixed(2) ?? 'N/A'} L`}</p>
          <div className="mt-2">
            <p className="font-bold">Detalles por vaca:</p>
            {details.map((detail, index) => (
              <p key={index}>{`${detail.cowName ?? 'Desconocido'}: ${detail.total.toFixed(2)} L`}</p>
            ))}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-200 p-4 md:p-8">
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg p-4 md:p-8 border border-blue-300">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <Image src="/images/vaca (12).png" alt="Icono de Producción de Leche" width={40} height={40} className="mr-4" />
              <h2 className="text-2xl md:text-3xl font-bold text-blue-800">Producción de Leche</h2>
            </div>
            <Button onClick={onBack} variant="outline" className="flex items-center border-blue-500 text-blue-700 hover:bg-blue-100">
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

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Gestión de Vacas</CardTitle>
              <CardDescription>Agregue, modifique o elimine las vacas en su rebaño</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <Button onClick={() => setShowCowDialog(true)} className="bg-blue-500 text-white hover:bg-blue-600">
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Nueva Vaca
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Etiqueta</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cows.map(cow => (
                    <TableRow key={cow.id}>
                      <TableCell>{cow.id}</TableCell>
                      <TableCell>{cow.name}</TableCell>
                      <TableCell>{cow.tag}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => {
                            setEditingCow(cow);
                            setShowCowDialog(true);
                          }} className="bg-black hover:bg-gray-600">
                            <Edit className="h-4 w-4" />
                        </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteCow(cow.id)} className="bg-black hover:bg-gray-600">
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Registro de Producción</CardTitle>
              <CardDescription>Registre la producción diaria de leche por vaca</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
              <div className="w-[200px]">
              <Select value={selectedCow} onValueChange={setSelectedCow}>
                    <SelectTrigger className="w-[200px] bg-lime-300">
                      <SelectValue placeholder="Seleccionar vaca" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {cows.length > 0 ? (
                        cows.map(cow => (
                          <SelectItem key={cow.id} value={cow.id}>{cow.name} ({cow.tag})</SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-cows">No hay vacas disponibles</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
              </div>
                <Button onClick={() => setShowProductionDialog(true)} className="bg-blue-500 text-white hover:bg-blue-600">
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Producción
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Vaca</TableHead>
                    <TableHead>Mañana</TableHead>
                    <TableHead>Tarde</TableHead>
                    <TableHead>Noche</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Calidad</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {milkProductions.map(production => (
                    <TableRow key={production.id}>
                      <TableCell>{production.date}</TableCell>
                      <TableCell>{cows.find(c => c.id === production.cowId)?.name}</TableCell>
                      <TableCell>{production.morning} L</TableCell>
                      <TableCell>{production.afternoon} L</TableCell>
                      <TableCell>{production.evening} L</TableCell>
                      <TableCell>{production.total} L</TableCell>
                      <TableCell>
                        Grasa: {production.quality.fat !== undefined ? `${production.quality.fat}%` : 'N/A'},
                        Proteína: {production.quality.protein !== undefined ? `${production.quality.protein}%` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => {
                          setEditingProduction(production);
                          setShowProductionDialog(true);
                        }} className="bg-black hover:bg-gray-600">
                          <Edit className="h-4 w-4" />
                        </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteProduction(production.id)} className="bg-black hover:bg-gray-600">
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Análisis de Producción</CardTitle>
              <CardDescription>Visualice las tendencias de producción de leche total</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-4">
                <Select value={productionPeriod} onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setProductionPeriod(value)}>
                  <SelectTrigger className="w-[200px] bg-lime-300">
                    <SelectValue placeholder="Seleccionar período" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="daily" className="cursor-pointer hover:bg-green-100">Diario</SelectItem>
                    <SelectItem value="weekly" className="cursor-pointer hover:bg-green-100">Semanal</SelectItem>
                    <SelectItem value="monthly" className="cursor-pointer hover:bg-green-100">Mensual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div ref={chartRef} className="w-full h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getProductionData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke="#8884d8" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Registro de Incidencias</CardTitle>
              <CardDescription>Registre problemas o complicaciones durante el ordeño</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <div className="w-[200px]">
                <Select value={selectedCow} onValueChange={setSelectedCow}>
                    <SelectTrigger className="w-[200px] bg-lime-300">
                      <SelectValue placeholder="Seleccionar vaca (opcional)" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="general">General</SelectItem>
                      {cows.map(cow => (
                        <SelectItem key={cow.id} value={cow.id}>{cow.name} ({cow.tag})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => setShowIncidentDialog(true)} className="bg-blue-500 text-white hover:bg-blue-600">
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Incidencia
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Vaca</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incidents.map(incident => (
                    <TableRow key={incident.id}>
                      <TableCell>{incident.date}</TableCell>
                      <TableCell>{incident.cowId ? cows.find(c => c.id === incident.cowId)?.name : 'General'}</TableCell>
                      <TableCell>
                        <Badge variant={incident.type === 'mastitis' ? 'destructive' : incident.type === 'injury' ? 'default' : 'secondary'}>
                          {incident.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{incident.description}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => {
                          setEditingIncident(incident);
                          setShowIncidentDialog(true);
                        }} className="bg-black hover:bg-gray-600">
                          <Edit className="h-4 w-4" />
                        </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteIncident(incident.id)} className="bg-black hover:bg-gray-600">
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Dialog open={showCowDialog} onOpenChange={setShowCowDialog}>
            <DialogContent className="sm:max-w-[425px] bg-blue-300">
              <DialogHeader>
                <DialogTitle>{editingCow ? 'Editar Vaca' : 'Agregar Nueva Vaca'}</DialogTitle>
                <DialogDescription>
                  {editingCow ? 'Modifique los detalles de la vaca' : 'Ingrese los detalles de la nueva vaca'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Nombre
                  </Label>
                  <Input
                    id="name"
                    value={editingCow ? editingCow.name : newCow.name}
                    onChange={(e) => editingCow ? setEditingCow({ ...editingCow, name: e.target.value }) : setNewCow({ ...newCow, name: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="tag" className="text-right">
                    Etiqueta
                  </Label>
                  <Input
                    id="tag"
                    value={editingCow ? editingCow.tag : newCow.tag}
                    onChange={(e) => editingCow ? setEditingCow({ ...editingCow, tag: e.target.value }) : setNewCow({ ...newCow, tag: e.target.value })}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className='bg-black' onClick={editingCow ? handleEditCow : handleAddCow}>
                  {editingCow ? 'Guardar Cambios' : 'Agregar Vaca'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showProductionDialog} onOpenChange={setShowProductionDialog}>
            <DialogContent className="sm:max-w-[425px] bg-blue-300">
              <DialogHeader>
                <DialogTitle className='text-white'>{editingProduction ? 'Editar Producción' : 'Agregar Nueva Producción'}</DialogTitle>
                <DialogDescription>
                  {editingProduction ? 'Modifique los detalles de la producción' : 'Ingrese los detalles de la nueva producción'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">
                    Fecha
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={editingProduction ? editingProduction.date : newProduction.date}
                    onChange={(e) => editingProduction ? setEditingProduction({ ...editingProduction, date: e.target.value }) : setNewProduction({ ...newProduction, date: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="morning" className="text-right">
                    Mañana (L)
                  </Label>
                  <Input
                    id="morning"
                    type="number"
                    value={editingProduction ? editingProduction.morning : newProduction.morning}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value)
                      editingProduction
                        ? setEditingProduction({ ...editingProduction, morning: value })
                        : setNewProduction({ ...newProduction, morning: value })
                    }}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="afternoon" className="text-right">
                    Tarde (L)
                  </Label>
                  <Input
                    id="afternoon"
                    type="number"
                    value={editingProduction ? editingProduction.afternoon : newProduction.afternoon}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value)
                      editingProduction
                        ? setEditingProduction({ ...editingProduction, afternoon: value })
                        : setNewProduction({ ...newProduction, afternoon: value })
                    }}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="evening" className="text-right">
                    Noche (L)
                  </Label>
                  <Input
                    id="evening"
                    type="number"
                    value={editingProduction ? editingProduction.evening : newProduction.evening}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value)
                      editingProduction
                        ? setEditingProduction({ ...editingProduction, evening: value })
                        : setNewProduction({ ...newProduction, evening: value })
                    }}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="fat" className="text-right">
                    Grasa (%)
                  </Label>
                  <Input
                    id="fat"
                    type="number"
                    value={editingProduction ? editingProduction.quality.fat : newProduction.quality?.fat ?? ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : parseFloat(e.target.value)
                      if (editingProduction) {
                        setEditingProduction({
                          ...editingProduction,
                          quality: { ...editingProduction.quality, fat: value }
                        })
                      } else {
                        setNewProduction({
                          ...newProduction,
                          quality: { ...newProduction.quality, fat: value, protein: newProduction.quality?.protein ?? undefined }    
                        })
                      }
                    }}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="protein" className="text-right">
                    Proteína (%)
                  </Label>
                  <Input
                    id="protein"
                    type="number"
                    value={editingProduction ? editingProduction.quality.protein : newProduction.quality?.protein ?? ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : parseFloat(e.target.value)
                      if (editingProduction) {
                        setEditingProduction({
                          ...editingProduction,
                          quality: { ...editingProduction.quality, protein: value }
                        })
                      } else {
                        setNewProduction({
                          ...newProduction,
                          quality: { ...newProduction.quality, protein: value, fat: newProduction.quality?.fat ?? undefined }
                        })
                      }
                    }}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className='bg-black' onClick={editingProduction ? handleEditProduction : handleAddProduction}>
                  {editingProduction ? 'Guardar Cambios' : 'Agregar Producción'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showIncidentDialog} onOpenChange={setShowIncidentDialog}>
            <DialogContent className="sm:max-w-[425px] bg-blue-300">
              <DialogHeader>
                <DialogTitle>{editingIncident ? 'Editar Incidencia' : 'Agregar Nueva Incidencia'}</DialogTitle>
                <DialogDescription>
                  {editingIncident ? 'Modifique los detalles de la incidencia' : 'Ingrese los detalles de la nueva incidencia'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="incidentDate" className="text-right">
                    Fecha
                  </Label>
                  <Input
                    id="incidentDate"
                    type="date"
                    value={editingIncident ? editingIncident.date : newIncident.date}
                    onChange={(e) => editingIncident ? setEditingIncident({ ...editingIncident, date: e.target.value }) : setNewIncident({ ...newIncident, date: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="incidentType" className="text-right">
                    Tipo
                  </Label>
                  <Select
                  
                    value={editingIncident ? editingIncident.type : newIncident.type}
                    onValueChange={(value: 'mastitis' | 'injury' | 'other') => editingIncident ? setEditingIncident({ ...editingIncident, type: value }) : setNewIncident({ ...newIncident, type: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent className='bg-white'>
                      <SelectItem value="mastitis">Mastitis</SelectItem>
                      <SelectItem value="injury">Lesión</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="incidentDescription" className="text-right">
                    Descripción
                  </Label>
                  <Textarea
                    id="incidentDescription"
                    value={editingIncident ? editingIncident.description : newIncident.description}
                    onChange={(e) => editingIncident ? setEditingIncident({ ...editingIncident, description: e.target.value }) : setNewIncident({ ...newIncident, description: e.target.value })}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-black"onClick={editingIncident ? handleEditIncident : handleAddIncident}>
                  {editingIncident ? 'Guardar Cambios' : 'Agregar Incidencia'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {lastDeletedCow && (
            <div className="fixed bottom-4 right-4 bg-blue-300 p-4 rounded-lg shadow-lg border border-gray-200">
              <p>Vaca eliminada. ¿Desea deshacer?</p>
              <Button onClick={handleUndoDeleteCow} className="mt-2 bg-blue-500 text-white hover:bg-blue-600">
                <Undo2 className="mr-2 h-4 w-4" />
                Deshacer
              </Button>
            </div>
          )}

          {lastDeletedProduction && (
            <div className="fixed bottom-4 right-4 bg-blue-300 p-4 rounded-lg shadow-lg border border-gray-200">
              <p>Registro de producción eliminado. ¿Desea deshacer?</p>
              <Button onClick={handleUndoDeleteProduction} className="mt-2 bg-blue-500 text-white hover:bg-blue-600">
                <Undo2 className="mr-2 h-4 w-4" />
                Deshacer
              </Button>
            </div>
          )}

          {lastDeletedIncident && (
            <div className="fixed bottom-4 right-4 bg-blue-300 p-4 rounded-lg shadow-lg border border-gray-200">
              <p>Incidente eliminado. ¿Desea deshacer?</p>
              <Button onClick={handleUndoDeleteIncident} className="mt-2 bg-blue-500 text-white hover:bg-blue-600">
                <Undo2 className="mr-2 h-4 w-4" />
                Deshacer
              </Button>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}