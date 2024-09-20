'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Menu, X } from 'lucide-react'
import AnimatedSection from './AnimatedSection'
import Image from 'next/image'
import { SignInButton, UserButton, useUser } from "@clerk/nextjs"
import { motion, useInView, useAnimation } from 'framer-motion'

interface LandingPageProps {
  onNavigate: (page: string) => void
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [currentBenefitImage, setCurrentBenefitImage] = useState(0)
  const { isSignedIn } = useUser()
  const [userCount, setUserCount] = useState(0)
  const countRef = useRef(null)
  const isInView = useInView(countRef)
  const countAnimation = useAnimation()
  const [isCountComplete, setIsCountComplete] = useState(false)

  const benefitImages = [
    '/images/beneficios1.jpg',
    '/images/beneficios2.jpg',
    '/images/beneficios3.png',
    '/images/beneficios4.jpg'
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBenefitImage((prev) => (prev + 1) % benefitImages.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [benefitImages.length])

  useEffect(() => {
    if (isInView) {
      countAnimation.start({
        scale: [1, 1.2, 1],
        transition: { duration: 0.5 }
      })
      const interval = setInterval(() => {
        setUserCount(prev => {
          if (prev < 1000) {
            return prev + 10
          }
          clearInterval(interval)
          setIsCountComplete(true)
          return 1000
        })
      }, 20)
      return () => clearInterval(interval)
    }
  }, [isInView, countAnimation])

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId)
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' })
    }
    setIsMenuOpen(false)
  }

  const faqItems = [
    {
      question: "¿Cómo puedo empezar a usar MilkTrack?",
      answer: "Para comenzar, simplemente regístrate en nuestra plataforma. Una vez que hayas creado tu cuenta, podrás acceder a todas nuestras funciones y comenzar a gestionar tu ganado lechero de manera eficiente."
    },
    {
      question: "¿MilkTrack es compatible con dispositivos móviles?",
      answer: "Sí, MilkTrack está diseñado para ser completamente responsivo y funcionar en dispositivos móviles, tablets y computadoras de escritorio."
    },
    {
      question: "¿Puedo personalizar las funciones según mis necesidades?",
      answer: "Absolutamente. MilkTrack ofrece opciones de personalización para adaptarse a las necesidades específicas de tu granja lechera."
    },
    {
      question: "¿Cómo aseguran la privacidad y seguridad de mis datos?",
      answer: "En MilkTrack, la seguridad de tus datos es nuestra prioridad. Utilizamos encriptación de última generación y seguimos las mejores prácticas de la industria para proteger tu información."
    },
    {
      question: "¿Ofrecen soporte técnico?",
      answer: "Sí, ofrecemos soporte técnico completo. Nuestro equipo de expertos está disponible para ayudarte con cualquier pregunta o problema que puedas tener."
    },
    {
      question: "¿Puedo probar MilkTrack antes de comprometerme?",
      answer: "Por supuesto. Ofrecemos una prueba gratuita de 30 días para que puedas experimentar todos los beneficios de MilkTrack antes de tomar una decisión."
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-lime-400 to-lime-600">
      <div className="animated-background absolute inset-0 -z-10"></div>
      <header className="bg-green-800 text-white p-4 sticky top-0 z-50">
        <nav className="container mx-auto flex justify-between items-center px-4">
          <div className="flex items-center">
            <Image
              src="/images/iconoMilktrack.svg"
              alt="MilkTrack Logo"
              width={50}
              height={50}
              className="mr-2 transition-all duration-300 hover:brightness-125"
            />
            <h1 className="text-2xl font-bold">MilkTrack</h1>
          </div>
          <div className="md:hidden flex justify-center items-center w-full absolute left-0">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              aria-label="Toggle menu"
              className="p-2 rounded-full hover:bg-green-700 transition-colors duration-200"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <ul className={`md:flex md:space-x-4 ${isMenuOpen ? 'absolute top-full left-0 right-0 bg-green-700 p-4 md:relative md:bg-transparent md:p-0' : 'hidden md:flex'}`}>
              {['Inicio', 'Funciones', 'Beneficios', 'Sobre Nosotros', 'Usuarios', 'FAQ', 'Contacto'].map((item) => (
                <li key={item} className="my-2 md:my-0">
                  <button
                    onClick={() => scrollToSection(item.toLowerCase().replace(' ', '-'))}
                    className="px-4 py-2 rounded-full transition-colors duration-300 hover:bg-green-700 w-full text-left font-bold"
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
            {isSignedIn ? (
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10",
                    userButtonTrigger: "focus:shadow-none",
                  },
                }}
              />
            ) : (
              <SignInButton mode="modal">
                <button className="bg-white text-green-800 px-6 py-2 rounded-full font-semibold hover:bg-green-100 hover:text-green-900 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg">
                  Iniciar sesión
                </button>
              </SignInButton>
            )}
          </div>
        </nav>
      </header>

      <main className="relative">
        <AnimatedSection id="inicio">
          <div className="container mx-auto text-center py-16 px-4 md:px-8 lg:px-16 relative">
            <div className="absolute inset-0 justify-between pointer-events-none overflow-hidden hidden lg:flex">
              <div className="w-1/4 flex flex-col justify-between items-center">
                <Image
                  src="/images/vaca (8).png"
                  alt="Vaca decorativa"
                  width={150}
                  height={150}
                  className="opacity-80 mt-20 transition-all duration-300 hover:brightness-125"
                />
                <Image
                  src="/images/vaca (6).png"
                  alt="Vacas en cerca"
                  width={120}
                  height={120}
                  className="opacity-80 transition-all duration-300 hover:brightness-125"
                />
                <Image
                  src="/images/vaca (3).png"
                  alt="Producción de leche"
                  width={90}
                  height={90}
                  className="opacity-80 mb-20 transition-all duration-300 hover:brightness-125"
                />
              </div>
              <div className="w-1/4 flex flex-col justify-between items-center">
                <Image
                  src="/images/leche.png"
                  alt="Botella de leche"
                  width={100}
                  height={100}
                  className="opacity-80 mt-20 mb-20 transition-all duration-300 hover:brightness-125"
                />
                <Image
                  src="/images/botella-de-leche.png"
                  alt="Botella de leche con cara de vaca"
                  width={80}
                  height={80}
                  className="opacity-80 transition-all duration-300 hover:brightness-125"
                />
                <Image
                  src="/images/vaca (1).png"
                  alt="Icono de vaca"
                  width={100}
                  height={100}
                  className="opacity-80 mb-20 transition-all duration-300 hover:brightness-125"
                />
              </div>
            </div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-green-800 mb-6">
                Bienvenido a MilkTrack
              </h2>
              <p className="text-lg md:text-xl lg:text-2xl text-green-700 mb-8">
                La solución moderna para el seguimiento de vacas lecheras
              </p>
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 10 }}
                className="w-full max-w-3xl mx-auto rounded-2xl shadow-2xl mb-12 overflow-hidden"
              >
                <Image
                  src="/images/vacasintroduccion.jpg"
                  alt="Vacas lecheras"
                  width={1200}
                  height={800}
                  className="w-full h-full object-cover"
                />
              </motion.div>
              <button
                className="bg-green-600 text-white px-6 py-3 rounded-full text-lg md:text-xl font-semibold hover:bg-green-700 transition duration-300 shadow-lg"
                onClick={() => scrollToSection('beneficios')}
              >
                Comenzar
              </button>
              <div className="mt-12">
                <ChevronDown size={40} className="mx-auto text-green-600 animate-bounce" />
              </div>
            </div>
            <motion.div
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }}
              className="mt-6 sticky bottom-4 z-10"
            >
              <p className="text-sm md:text-base lg:text-lg font-semibold inline-block px-4 py-2 md:px-6 md:py-3 rounded-full shadow-lg" style={{
                background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
                border: '2px solid #15803d',
                color: '#064e3b',
                textShadow: '1px 1px 2px rgba(255,255,255,0.5)'
              }}>
                {isSignedIn 
                  ? "¡Bienvenido! Ya puedes utilizar todas nuestras funcionalidades."
                  : "Para utilizar las funcionalidades de nuestra página, debes iniciar sesión."}
              </p>
            </motion.div>
          </div>
        </AnimatedSection>

        <AnimatedSection id="beneficios">
          <div className="bg-green-700 py-16 my-16 mx-auto container px-4 md:px-8 lg:px-16 relative rounded-3xl">
            <Image
              src="/images/vacami.png"
              alt="Vaca y sol"
              width={100}
              height={100}
              className="absolute top-10 left-10 transition-all duration-300 hover:brightness-125 w-16 h-16 md:w-24 md:h-24"
            />
            <div className="container mx-auto px-4">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 text-center">Beneficios de MilkTrack</h2>
              <div className="flex flex-col md:flex-row items-center justify-center gap-12">
                <div className="w-full md:w-1/2 h-[250px] md:h-[350px] relative rounded-lg overflow-hidden shadow-xl">
                  {benefitImages.map((src, index) => (
                    <Image
                      key={src}
                      src={src}
                      alt={`Beneficio de MilkTrack ${index + 1}`}
                      layout="fill"
                      objectFit="cover"
                      className={`transition-opacity duration-500 ${
                        index === currentBenefitImage ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                  ))}
                </div>
                <div className="w-full md:w-1/2 space-y-4 md:space-y-6 bg-green-100 p-6 md:p-8 rounded-lg shadow-lg">
                  <h3 className="text-xl md:text-2xl font-semibold text-green-800">¿Qué obtienes con MilkTrack?</h3>
                  <ul className="list-disc list-inside space-y-2 text-green-700">
                    <li>Gestión eficiente de tu ganado lechero</li>
                    <li>Seguimiento detallado de la producción de leche</li>
                    <li>Control preciso de la salud y reproducción de tus vacas</li>
                    <li>Optimización de recursos y aumento de la productividad</li>
                    <li>Toma de decisiones basada en datos en tiempo real</li>
                    <li>Mejora del bienestar animal</li>
                  </ul>
                  <p className="text-green-800">
                    Con MilkTrack, transformarás la gestión de tu granja lechera, 
                    maximizando la eficiencia y el rendimiento de tu negocio.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection id="funciones">
          <div className="container mx-auto py-16 bg-green-700 px-4 md:px-8 lg:px-16 relative rounded-3xl">
            <Image
              src="/images/vaca.png"
              alt="Vaca con equipo médico"
              width={80}
              height={80}
              className="absolute top-10 right-10 transition-all duration-300 hover:brightness-125"
            />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 text-center">Nuestras Funciones</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {[
                {
                  title: 'Control de Preñez',
                  icon: '🐄',
                  description: 'Seguimiento detallado del ciclo reproductivo de cada vaca, desde la inseminación hasta el parto, con alertas personalizables para chequeos veterinarios y preparación para el parto.',
                  buttonText: 'Ingresa al control de preñez de tus vacas',
                  page: 'pregnancy-control'
                },
                {
                  title: 'Seguimiento de Crías',
                  icon: '🍼',
                  description: 'Monitoreo completo del crecimiento y desarrollo de las crías, incluyendo registros de alimentación, vacunación y hitos de crecimiento para asegurar la salud óptima de los terneros.',
                  buttonText: 'Comienza el seguimiento de tus crías',
                  page: 'calf-tracking'
                },
                {
                  title: 'Tiempo para el Parto',
                  icon: '⏳',
                  description: 'Calculadora avanzada que predice la fecha estimada de parto basada en datos históricos y actuales, permitiendo una mejor planificación y atención durante el proceso de parto.',
                  buttonText: 'Calcula el tiempo para el parto',
                  page: 'pregnancy-tracking'
                },
                {
                  title: 'Registro de Nuevas Vacas',
                  icon: '📝',
                  description: 'Sistema intuitivo para añadir nuevas vacas al rebaño, con campos personalizables para información genética, historial de salud y características únicas de cada animal.',
                  buttonText: 'Registra una nueva vaca',
                  page: 'new-cow-registration'
                },
                {
                  title: 'Control de Vacunas',
                  icon: '💉',
                  description: 'Calendario de vacunación automatizado con recordatorios para cada animal, asegurando que todas las vacas reciban sus vacunas a tiempo y mantengan una salud óptima.',
                  buttonText: 'Gestiona el control de vacunas',
                  page: 'vaccine-control'
                },
                {
                  title: 'Producción de Leche',
                  icon: '🥛',
                  description: 'Seguimiento detallado de la producción de leche por vaca y por rebaño, con análisis de tendencias y alertas para cambios significativos en la producción individual o grupal.',
                  buttonText: 'Monitorea la producción de leche',
                  page: 'milk-production'
                },
              ].map((feature) => (
                <motion.div
                  key={feature.title}
                  className="bg-green-100 p-6 rounded-lg shadow-lg flex flex-col justify-between"
                  whileHover={{
                    scale: 1.05,
                    backgroundColor: "#86efac",
                    transition: { duration: 0.3 }
                  }}
                >
                  <div>
                    <div className="text-4xl mb-4">{feature.icon}</div>
                    <h3 className="text-xl font-semibold text-green-800 mb-2">{feature.title}</h3>
                    <p className="text-green-700 mb-4 text-justify">{feature.description}</p>
                  </div>
                  <button
                    onClick={() => onNavigate(feature.page)}
                    className="bg-green-600 text-white px-4 py-2 rounded-full text-center hover:bg-green-700 transition duration-300"
                  >
                    {feature.buttonText}
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection id="sobre-nosotros">
          <div className="bg-green-700 py-16 my-16 container mx-auto px-4 md:px-8 lg:px-16 relative rounded-3xl">
            <Image
              src="/images/silueta-de-vaca.png"
              alt="Silueta de vaca"
              width={120}
              height={120}
              className="absolute bottom-10 right-10 opacity-60 transition-all duration-300 hover:brightness-125 w-auto h-auto"
            />
            <div className="container mx-auto px-4">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 text-center">Sobre Nosotros</h2>
              <div className="flex flex-col lg:flex-row items-start justify-center gap-12">
                <div className="lg:w-1/2 space-y-6">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300, damping: 10 }}
                  >
                    <Image
                      src="/images/vacassobrenosotros.jpg"
                      alt="Vacas en el campo"
                      width={800}
                      height={600}
                      className="w-full rounded-lg shadow-lg mb-6"
                    />
                  </motion.div>
                  <p className="text-base md:text-lg text-white text-justify">
                    En MilkTrack, nos apasiona combinar la tecnología moderna con la tradición ganadera para mejorar la
                    eficiencia y el bienestar animal. Fundada en 2020 por un equipo de veterinarios e ingenieros de software,
                    nuestra misión es revolucionar la gestión de ganado lechero.
                  </p>
                  <p className="text-base md:text-lg text-white text-justify">
                    Nuestro equipo multidisciplinario trabaja incansablemente para desarrollar soluciones innovadoras que
                    abordan los desafíos únicos de la industria láctea. Colaboramos estrechamente con ganaderos y expertos
                    en todo el mundo para asegurarnos de que nuestras herramientas sean prácticas, fáciles de usar y
                    verdaderamente beneficiosas para el día a día en la granja.
                  </p>
                </div>
                <div className="lg:w-1/2 space-y-6">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300, damping: 10 }}
                  >
                    <Image
                      src="/images/vacassobrenosotros1.jpg"
                      alt="Vaca y terneros"
                      width={800}
                      height={600}
                      className="w-full rounded-lg shadow-lg mb-6"
                    />
                  </motion.div>
                  <p className="text-base md:text-lg text-white text-justify">
                    En MilkTrack, creemos en el poder de los datos para transformar la industria. Nuestras soluciones no solo
                    mejoran la productividad, sino que también promueven prácticas sostenibles y el bienestar animal.
                    Estamos comprometidos con el éxito a largo plazo de nuestros clientes y la salud de sus rebaños.
                  </p>
                  <div className="pt-4">
                    <h3 className="text-xl md:text-2xl font-semibold text-white mb-4">Nuestros Valores</h3>
                    <ul className="list-disc list-inside space-y-2 text-white">
                      <li>Innovación constante</li>
                      <li>Compromiso con el bienestar animal</li>
                      <li>Sostenibilidad en la producción láctea</li>
                      <li>Colaboración con la comunidad ganadera</li>
                      <li>Excelencia en el servicio al cliente</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection id="usuarios">
          <div className="bg-green-700 py-16 my-16 mx-auto container px-4 md:px-8 lg:px-16 relative rounded-3xl">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 text-center">Usuarios que confían en MilkTrack</h2>
            <div className="flex justify-center items-center">
              <motion.div
                ref={countRef}
                animate={isCountComplete ? {
                  scale: [1, 1.1, 1],
                  transition: {
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut"
                  }
                } : {}}
                className="text-5xl md:text-6xl font-bold text-white"
              >
                {userCount}+
              </motion.div>
            </div>
            <p className="text-lg md:text-xl text-white text-center mt-4">
              Ganaderos satisfechos utilizan MilkTrack para optimizar su producción lechera
            </p>
          </div>
        </AnimatedSection>

        <AnimatedSection id="faq">
          <div className="bg-green-700 py-16 my-16 mx-auto container px-4 md:px-8 lg:px-16 relative rounded-3xl">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 text-center">Preguntas Frecuentes</h2>
            <div className="space-y-6">
              {faqItems.map((item, index) => (
                <motion.div 
                  key={index} 
                  className="bg-green-100 rounded-lg p-6 shadow-lg hover:bg-green-200 transition-colors duration-300"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <h3 className="text-lg md:text-xl font-semibold text-green-800 mb-2">{item.question}</h3>
                  <p className="text-green-700">{item.answer}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection id="contacto">
          <div className="bg-green-700 py-12 my-8 mx-auto container px-4 md:px-8 lg:px-16 relative rounded-3xl ">
            <div className="flex justify-between items-center mb-8">
              <Image
                src="/images/vacaa.png"
                alt="Vaca con monitor cardíaco"
                width={150}
                height={150}
                className="opacity-70 transition-all duration-300 hover:brightness-125 w-20 h-20 md:w-28 md:h-28 lg:w-36 lg:h-36"
              />

              <Image
                src="/images/contacto.png"
                alt="contacto"
                width={100}
                height={100}
                className="opacity-100 transition-all duration-300 hover:brightness-125 w-20 h-20 md:w-28 md:h-28 lg:w-36 lg:h-36"
              />

              <Image
                src="/images/vacas.png"
                alt="Vaca y sol"
                width={150}
                height={150}
                className="opacity-70 transition-all duration-300 hover:brightness-125 w-20 h-20 md:w-28 md:h-28 lg:w-36 lg:h-36 "
              />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 text-center">Contáctanos</h2>
            <p className="text-lg md:text-xl text-white mb-8 text-center">
              ¿Tienes preguntas? Nuestro equipo está listo para ayudarte en cada paso del camino.
            </p>
            <div className="text-center">
              <a
                href="https://api.whatsapp.com/send/?phone=%2B573014732718&text&type=phone_number&app_absent=0"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-600 text-white px-6 py-3 rounded-full text-lg font-semibold hover:bg-green-500 transition duration-300 shadow-lg inline-block"
              >
                Enviar Mensaje por WhatsApp
              </a>
            </div>
          </div>
        </AnimatedSection>
      </main>

      <footer className="bg-green-700 text-white py-8">
        <div className="container mx-auto text-center px-4 text-white">
          <p>&copy; 2023 MilkTrack. Todos los derechos reservados.</p>
        </div>
      </footer>

      {!isSignedIn && (
        <div className="fixed bottom-4 right-4 z-50">
          <SignInButton mode="modal">
            <button className="bg-green-600 text-white px-4 py-2 text-sm md:px-6 md:py-3 md:text-base rounded-full font-semibold hover:bg-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg">
              Comenzar ahora
            </button>
          </SignInButton>
        </div>
      )}

      <style jsx global>{`
        /* Estilizar la barra de desplazamiento */
        ::-webkit-scrollbar {
          width: 12px;
        }

        ::-webkit-scrollbar-track {
          background: #99ff99;
        }

        ::-webkit-scrollbar-thumb {
          background-color: #2e7d32;
          border-radius: 20px;
          border: 3px solid #eeee;
        }

        ::-webkit-scrollbar-thumb:hover {
          background-color: #1b5e20;
        }

        /* Mejorar la responsividad para zoom en escritorio */
        @media screen and (min-width: 1024px) {
          html {
            font-size: 16px;
          }
          
          @media (min-resolution: 1.25dppx) {
            html {
              font-size: 14px;
            }
          }
          
          @media (min-resolution: 1.5dppx) {
            html {
              font-size: 12px;
            }
          }
          
          @media (min-resolution: 2dppx) {
            html {
              font-size: 10px;
            }
          }
        }

        /* Ajustes generales para mejorar la responsividad */
        .container {
          max-width: 100%;
          margin-left: auto;
          margin-right: auto;
        }

        @media (min-width: 640px) {
          .container {
            max-width: 640px;
          }
        }

        @media (min-width: 768px) {
          .container {
            max-width: 768px;
          }
        }

        @media (min-width: 1024px) {
          .container {
            max-width: 1024px;
          }
        }

        @media (min-width: 1280px) {
          .container {
            max-width: 1280px;
          }
        }

        @media (min-width: 2240px) {
          .container {
            max-width: 2240px;
          }
        }

        @media (min-width: 1040px) {
          .container {
            max-width: 2240px;
          }
        }

        @media (min-width: 1140px) {
          .container {
            max-width: 1140px;
          }
        }

        @media (min-width: 1200px) {
          .container {
            max-width: 1100px;
          }
        }

        @media (min-width: 1280px) {
          .container {
            max-width: 1280px;
          }
        }

        @media (min-width: 1390px) {
          .container {
            max-width: 1390px;
          }
        }
        

        /* Ajustes para dispositivos móviles */
        @media (max-width: 640px) {
          .container {
            max-width: 590px;
            padding-left: 1rem;
            padding-right: 1rem;
          }

          .rounded-3xl {
            border-radius: 1.5rem;
          }

          h2 {
            font-size: 2rem;
          }

          p {
            font-size: 1rem;
          }
        }


      `}</style>
    </div>
  )
}