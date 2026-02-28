import React, { useEffect } from 'react';
import { motion } from 'motion/react';

export default function About() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-gray-800 font-sans pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-6 sm:px-8">
        
        {/* Header / Title */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="text-center mb-20 md:mb-32"
        >
          <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight text-gray-900 mb-6">
            ESEN CONCEPT
          </h1>
          <div className="w-16 h-0.5 bg-gray-900 mx-auto opacity-50"></div>
        </motion.div>

        {/* Section 1: Origin */}
        <motion.section 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="mb-24 md:mb-32 flex flex-col md:flex-row gap-12 items-center"
        >
          <div className="md:w-1/2">
            <div className="aspect-[4/5] overflow-hidden rounded-sm bg-gray-200">
              <img 
                src="https://esenconcept.netlify.app/esen02.jpg" 
                alt="Mujer serena" 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000 ease-out"
              />
            </div>
          </div>
          <div className="md:w-1/2 space-y-8 text-lg md:text-xl leading-relaxed font-light">
            <motion.p variants={fadeIn}>
              ESEN CONCEPT nace desde un proceso de transformación personal. <br/>
              De volver a la raíz. <br/>
              De aprender a sostenerme cuando todo parecía inestable. <br/>
              De sanar en silencio. De confiar otra vez.
            </motion.p>
            <motion.p variants={fadeIn}>
              Nace del momento en que entendí que volver no era rendirme, sino reencontrarme. <br/>
              A esa versión mía que existía antes del ruido, antes del miedo, antes de convertirme en alguien que no se sentía propia.
            </motion.p>
          </div>
        </motion.section>

        {/* Section 2: Essence (Centered) */}
        <motion.section 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="mb-24 md:mb-32 text-center max-w-2xl mx-auto"
        >
          <div className="mb-8">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Filosofía</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-serif italic text-gray-700 leading-relaxed">
            "ESEN es ese regreso a lo <span className="font-bold text-gray-900 not-italic">ESENcial</span>, a la verdadera <span className="font-bold text-gray-900 not-italic">ESENcia</span>. <br/>
            A lo que permanece cuando todo parece desvanecerse."
          </h2>
        </motion.section>

        {/* Section 3: Collection RAÍZ */}
        <motion.section 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="mb-24 md:mb-32 flex flex-col-reverse md:flex-row gap-12 items-center"
        >
          <div className="md:w-1/2 space-y-8 text-lg md:text-xl leading-relaxed font-light">
            <motion.p variants={fadeIn}>
              Nuestra primera cápsula, <strong className="font-serif">RAÍZ</strong>, habla de estabilidad. <br/>
              De identidad. <br/>
              De reconstrucción silenciosa. <br/>
              De esa fuerza que no siempre se ve, pero siempre sostiene.
            </motion.p>
            <motion.p variants={fadeIn} className="text-sm uppercase tracking-widest font-bold text-gray-500 pt-4">
              Cada pieza es limitada, creada con propósito e intención.
            </motion.p>
          </div>
          <div className="md:w-1/2">
            <div className="aspect-[4/5] overflow-hidden rounded-sm bg-gray-200">
              <img 
                src="https://esenconcept.netlify.app/esen04.jpg" 
                alt="Textura natural y orgánica" 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000 ease-out"
              />
            </div>
          </div>
        </motion.section>

        {/* Section 4: Message */}
        <motion.section 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="mb-24 md:mb-32 bg-black text-white p-8 md:p-16 shadow-lg border border-gray-900 rounded-sm"
        >
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <motion.p variants={fadeIn} className="text-xl md:text-2xl font-serif text-white">
              Deseo que cada vez que uses una prenda de ESEN recuerdes lo valiosa que eres.
            </motion.p>
            <motion.div variants={fadeIn} className="w-8 h-px bg-gray-700 mx-auto"></motion.div>
            <motion.p variants={fadeIn} className="text-lg text-gray-300 font-light">
              Lo fuerte que has sido. <br/>
              Lo poderosa que te has vuelto a través de todo lo que has superado.
            </motion.p>
            <motion.p variants={fadeIn} className="text-lg text-gray-300 font-light italic">
              Que recuerdes que la suavidad también es fuerza. <br/>
              Que la calma también es poder. <br/>
              Que volver a empezar también es valentía.
            </motion.p>
          </div>
        </motion.section>

        {/* Closing */}
        <motion.section 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="text-center space-y-10 mb-12"
        >
          <p className="text-lg md:text-xl font-light text-gray-700">
            ESEN es un recordatorio de tu <strong className="font-serif">ESENcia</strong>. <br/>
            De lo que eres cuando te alineas contigo misma.
          </p>
          
          <div className="py-8">
            <h3 className="text-2xl md:text-4xl font-serif font-bold text-gray-900 leading-tight">
              "Porque cuando una mujer vuelve a su raíz, no retrocede. <br/>
              Se reconoce. <br/>
              Se alinea. <br/>
              <span className="text-gray-500 italic">Y desde ahí, florece."</span>
            </h3>
          </div>
        </motion.section>

      </div>
    </div>
  );
}
