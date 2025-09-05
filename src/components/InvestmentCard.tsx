// src/components/InvestmentCard.tsx
import React from 'react';

interface InvestmentCardProps {
  title: string;
  location: string;
  cropType: string;
  expectedReturn: string;
}

const InvestmentCard: React.FC<InvestmentCardProps> = ({ title, location, cropType, expectedReturn }) => {
  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-gray-600">Location: {location}</p>
      <p className="text-gray-600">Crop Type: {cropType}</p>
      <p className="text-green-600">Expected Return: {expectedReturn}</p>
      <button className="mt-4 bg-green-600 text-white py-2 px-4 rounded">Invest Now</button>
    </div>
  );
};

export default InvestmentCard;
