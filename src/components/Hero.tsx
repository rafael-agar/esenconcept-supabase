import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const slides = [
  {
    id: 1,
    type: 'video',
    src: 'https://res.cloudinary.com/dgoxcbro5/video/upload/v1773163775/banner01_rtshmv.mp4',
    subtitle: 'RAÍZ',
    title: 'Donde empieza todo',
    buttonText: 'Nuestra primera cápsula',
    link: '/shop'
  },
  {
    id: 2,
    type: 'image',
    src: 'https://wrpsqmdwhwbruqgyjdis.supabase.co/storage/v1/object/public/product-images/banner2-calmaset.webp',
    subtitle: 'Calma Set',
    title: 'Un diseño que equilibra comodidad y elegancia',
    buttonText: 'Descubrir Más',
    link: '/product/calma-set-short'
  },
  {
    id: 3,
    type: 'image',
    src: 'https://wrpsqmdwhwbruqgyjdis.supabase.co/storage/v1/object/public/product-images/banner%204%20set%20raiz.webp',
    subtitle: 'Raíz Set',
    title: 'La pieza que dio origen a todo',
    buttonText: 'Ver Set',
    link: '/product/raiz-set'
  }
];

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  useEffect(() => {
    setIsVideoLoaded(false);
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [currentSlide]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="relative h-[100vh] w-full overflow-hidden bg-black">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0"
        >
          {/* Background Image or Video */}
          {slides[currentSlide].type === 'video' ? (
            <div className="absolute inset-0">
              {!isVideoLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                  <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
              )}
              <video
                autoPlay
                muted
                loop
                playsInline
                className={`w-full h-full object-cover transition-opacity duration-500 ${isVideoLoaded ? 'opacity-100' : 'opacity-0'}`}
                src={slides[currentSlide].src}
                onLoadedData={() => setIsVideoLoaded(true)}
              />
              <div className="absolute inset-0 bg-black/30" />
            </div>
          ) : (
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url("${slides[currentSlide].src}")`,
              }}
            >
              <div className="absolute inset-0 bg-black/30" />
            </div>
          )}

          {/* Content */}
          <div className="relative h-full flex flex-col justify-center items-center text-center text-white px-4">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-lg md:text-xl font-medium tracking-[0.2em] mb-4 uppercase"
            >
              {slides[currentSlide].subtitle}
            </motion.h2>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-5xl md:text-7xl font-serif font-bold mb-8 tracking-tight"
            >
              {slides[currentSlide].title}
            </motion.h1>
            <Link to={slides[currentSlide].link}>
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="bg-white text-black px-8 py-4 text-sm font-bold tracking-widest uppercase hover:bg-black hover:text-white transition-colors duration-300"
              >
                {slides[currentSlide].buttonText}
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors p-2 z-10 hidden md:block"
      >
        <ChevronLeft size={48} strokeWidth={1} />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors p-2 z-10 hidden md:block"
      >
        <ChevronRight size={48} strokeWidth={1} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-3 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              currentSlide === index ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
