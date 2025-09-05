// src/pages/AdminLandManagement.tsx
import React, { useState } from 'react';

const AdminLandManagement: React.FC = () => {
  const [landData, setLandData] = useState<any[]>([]); 

  const handleAddLand = () => {
  };

  return (
    <div className="bg-gray-100 min-h-screen p-8">
      <h1 className="text-3xl font-semibold text-gray-700 mb-8">Manage Land</h1>

      <button
        onClick={handleAddLand}
        className="bg-green-600 text-white px-6 py-2 mb-8 rounded-md hover:bg-green-700"
      >
        Add New Land
      </button>

      <div className="bg-white shadow-md rounded-lg p-6">
        {landData.map((land) => (
          <div key={land.id} className="border-b py-4">
            <h3 className="text-xl text-blue-600">{land.name}</h3>
            <p className="text-sm text-gray-500">Location: {land.location}</p>
            <p className="text-sm text-gray-500">Size: {land.size}</p>
            <p className="text-sm text-gray-500">Price: ${land.price}</p>

            <button
              onClick={() => {
                // Add logic to delete land listing
              }}
              className="text-red-600 hover:underline"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminLandManagement;
