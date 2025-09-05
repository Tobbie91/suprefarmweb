// src/components/PortfolioCard.tsx
import React from 'react';

interface PortfolioCardProps {
  investmentTitle: string;
  sharesOwned: number;
  annualReturn: string;
  totalValue: string;
}

const PortfolioCard: React.FC<PortfolioCardProps> = ({ investmentTitle, sharesOwned, annualReturn, totalValue }) => {
  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <h3 className="text-xl font-semibold">{investmentTitle}</h3>
      <p className="text-gray-600">Shares Owned: {sharesOwned}</p>
      <p className="text-gray-600">Annual Return: {annualReturn}</p>
      <p className="text-gray-600">Total Value: {totalValue}</p>
      <button className="mt-4 bg-blue-600 text-white py-2 px-4 rounded">Manage Investment</button>
    </div>
  );
};

export default PortfolioCard;
