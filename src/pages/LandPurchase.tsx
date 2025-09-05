// src/pages/LandPurchase.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// Sample land data (this would eventually be fetched from an API or backend)
const landPlots = [
  { id: 1, name: 'Plot 1', location: 'Ilora, Nigeria', size: '15 hectares', price: 50000 },
  { id: 2, name: 'Plot 2', location: 'Ghana', size: '13 hectares', price: 50000 },
  { id: 3, name: 'Plot 3', location: 'Nigeria', size: '10 hectares', price: 5000 },
];

const LandPurchase: React.FC = () => {
  const [selectedLand, setSelectedLand] = useState<any | null>(null);

  const handlePurchase = (land: any) => {
    setSelectedLand(land);
    // Proceed to payment processing (e.g., Stripe or Paystack)
  };

  return (
    <div className="bg-gray-100 min-h-screen p-8">
      <h1 className="text-3xl font-semibold text-gray-700 mb-8">Available Land for Purchase</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {landPlots.map((land) => (
          <div key={land.id} className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-700">{land.name}</h3>
            <p className="text-sm text-gray-500">Location: {land.location}</p>
            <p className="text-sm text-gray-500">Size: {land.size}</p>
            <p className="text-sm text-gray-500">Price: ${land.price}</p>

            <button
              className="bg-green-600 text-white px-4 py-2 mt-4 rounded-md hover:bg-green-700"
              onClick={() => handlePurchase(land)}
            >
              Buy Land
            </button>
          </div>
        ))}
      </div>

      {/* If a land is selected, show purchase details */}
      {selectedLand && (
        <div className="mt-8 bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-700">Confirm Purchase</h2>
          <p className="text-lg text-gray-700">You are purchasing: {selectedLand.name}</p>
          <p className="text-sm text-gray-500">Location: {selectedLand.location}</p>
          <p className="text-sm text-gray-500">Size: {selectedLand.size}</p>
          <p className="text-sm text-gray-500">Price: ${selectedLand.price}</p>

          {/* Replace this with a payment form */}
          <button
            className="bg-green-600 text-white px-6 py-2 mt-4 rounded-md hover:bg-green-700"
            onClick={() => alert('Proceeding to Payment')}
          >
            Proceed to Payment
          </button>
        </div>
      )}
    </div>
  );
};

export default LandPurchase;

