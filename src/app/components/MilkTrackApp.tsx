'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import LandingPage from './LandingPage'
import PregnancyControlPage from './PregnancyControlPage'
import CalfTrackingPage from './CalfTrackingPage'
import PregnancyTrackingPage from './PregnancyTrackingPage'
import LoadingScreen from './LoadingScreen'
import CowManagementPage from './CowManagementPage'
import VaccineControlPage from './VaccineControlPage'
import MilkProductionPage from './MilkProductionPage'
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

export default function MilkTrackApp() {
  const [initialLoading, setInitialLoading] = useState(true)
  const [moduleLoading, setModuleLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState('landing')
  const { isLoaded, isSignedIn } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded) {
      const timer = setTimeout(() => {
        setInitialLoading(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isLoaded])

  useEffect(() => {
    if (isLoaded && !isSignedIn && currentPage !== 'landing') {
      router.push('/')
    }
  }, [isLoaded, isSignedIn, currentPage, router])

  const handleNavigation = (page: string) => {
    if (!isSignedIn && page !== 'landing') {
      router.push('/sign-in')
      return
    }
    setModuleLoading(true)
    setTimeout(() => {
      setCurrentPage(page)
      setModuleLoading(false)
    }, 2000)
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'pregnancy-control':
        return isSignedIn ? <PregnancyControlPage onBack={() => setCurrentPage('landing')} /> : null
      case 'calf-tracking':
        return isSignedIn ? <CalfTrackingPage onBack={() => setCurrentPage('landing')} /> : null
      case 'pregnancy-tracking':
        return isSignedIn ? <PregnancyTrackingPage onBack={() => setCurrentPage('landing')} /> : null
      case 'new-cow-registration':
        return isSignedIn ? <CowManagementPage onBack={() => setCurrentPage('landing')} /> : null
      case 'vaccine-control':
        return isSignedIn ? <VaccineControlPage onBack={() => setCurrentPage('landing')} /> : null
      case 'milk-production':
        return isSignedIn ? <MilkProductionPage onBack={() => setCurrentPage('landing')} /> : null
      default:
        return <LandingPage onNavigate={handleNavigation} />
    }
  }

  if (!isLoaded || initialLoading) {
    return <LoadingScreen />
  }

  return (
    <AnimatePresence mode="wait">
      {moduleLoading ? (
        <LoadingScreen key="module-loading" isModule={true} />
      ) : (
        <motion.div
          key="page-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderPage()}
        </motion.div>
      )}
    </AnimatePresence>
  )
}