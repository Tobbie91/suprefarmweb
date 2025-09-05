// src/components/InvestmentCalculator.tsx
import React, { useState } from 'react';

const InvestmentCalculator: React.FC = () => {
  const [investmentAmount, setInvestmentAmount] = useState<number>(0);
  const [annualReturn, setAnnualReturn] = useState<number>(0);
  const [years, setYears] = useState<number>(5);
  const [totalReturn, setTotalReturn] = useState<number>(0);

  const handleCalculate = () => {
    const calculatedReturn = investmentAmount * (1 + annualReturn / 100) ** years - investmentAmount;
    setTotalReturn(calculatedReturn);
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-4">Investment Calculator</h3>
      <div className="mb-4">
        <label className="block text-gray-600">Investment Amount ($)</label>
        <input
          type="number"
          className="w-full p-2 border border-gray-300 rounded"
          value={investmentAmount}
          onChange={(e) => setInvestmentAmount(Number(e.target.value))}
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-600">Annual Return (%)</label>
        <input
          type="number"
          className="w-full p-2 border border-gray-300 rounded"
          value={annualReturn}
          onChange={(e) => setAnnualReturn(Number(e.target.value))}
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-600">Investment Duration (Years)</label>
        <input
          type="number"
          className="w-full p-2 border border-gray-300 rounded"
          value={years}
          onChange={(e) => setYears(Number(e.target.value))}
        />
      </div>
      <button onClick={handleCalculate} className="bg-green-600 text-white py-2 px-4 rounded">
        Calculate Return
      </button>
      {totalReturn > 0 && (
        <div className="mt-4">
          <p className="text-gray-600">Estimated Return: ${totalReturn.toFixed(2)}</p>
        </div>
      )}
    </div>
  );
};

export default InvestmentCalculator;
