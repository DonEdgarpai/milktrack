import { motion } from 'framer-motion'
import Image from 'next/image'

interface LoadingScreenProps {
  isModule?: boolean
}

export default function LoadingScreen({ isModule = false }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 bg-green-100 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <Image
            src={isModule ? "/images/imagencargamodulos.svg" : "/images/VacaCarga.svg"}
            alt="Vaca"
            width={128}
            height={128}
            className="mx-auto mb-4"
          />
        </motion.div>
        <motion.h1
          className="text-4xl font-bold text-green-800 mb-2"
          animate={{ opacity: [0, 1] }}
          transition={{ repeat: Infinity, duration: 1.5, repeatType: 'reverse' }}
        >
          MilkTrack
        </motion.h1>
        <p className="text-green-600">{isModule ? "Cargando módulo..." : "Cargando el pasto más fresco..."}</p>
      </motion.div>
    </div>
  )
}