// src/pages/UserPortfolio.tsx
import React from 'react';
import PortfolioCard from '../components/PortfolioCard';

const UserPortfolio: React.FC = () => {
  return (
    <div className="container mx-auto p-8">
      <h2 className="text-3xl font-semibold mb-6">Your Portfolio</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <PortfolioCard investmentTitle="Citrus Orchard in Limpopo" sharesOwned={100} annualReturn="9% p.a." totalValue="$6,000" />
        <PortfolioCard investmentTitle="Almond Orchard in California" sharesOwned={50} annualReturn="7% p.a." totalValue="$3,500" />
        {/* Add more PortfolioCard components as needed */}
      </div>
    </div>
  );
};

export default UserPortfolio;
