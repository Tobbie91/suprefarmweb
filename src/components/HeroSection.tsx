import React from 'react';

const HeroSection: React.FC = () => {
  return (
    <section className="relative h-screen bg-cover bg-center" style={{ backgroundImage: 'url(/path/to/hero-image.jpg)' }}>
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div className="container mx-auto text-center text-white relative z-10">
        <h1 className="text-4xl md:text-6xl font-semibold mb-4">Join the Climate Solution</h1>
        <p className="text-lg md:text-2xl mb-8">Co-own and manage farmland with AI-powered insights.</p>
        <a href="#join" className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-full">Get Started</a>
      </div>
    </section>
  );
};

export default HeroSection;
