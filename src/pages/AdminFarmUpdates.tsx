// src/pages/AdminFarmUpdates.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const AdminFarmUpdates: React.FC = () => {
  const [updates, setUpdates] = useState<any[]>([]); // Replace with real API data

  const handleAddUpdate = () => {
    // Add logic to add a farm update (form, API call, etc.)
  };

  return (
    <div className="bg-gray-100 min-h-screen p-8">
      <h1 className="text-3xl font-semibold text-gray-700 mb-8">Manage Farm Updates</h1>
      
      <button
        onClick={handleAddUpdate}
        className="bg-green-600 text-white px-6 py-2 mb-8 rounded-md hover:bg-green-700"
      >
        Add New Update
      </button>

      <div className="bg-white shadow-md rounded-lg p-6">
        {updates.map((update) => (
          <div key={update.id} className="border-b py-4">
            <h3 className="text-xl text-blue-600">
              <Link to={`/farm-updates/${update.id}`} className="hover:underline">
                {update.title}
              </Link>
            </h3>
            <p className="text-gray-600">{update.summary}</p>
            <p className="text-sm text-gray-500">Posted on: {update.date}</p>
            <button
              onClick={() => {
                // Add logic to delete farm update
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

export default AdminFarmUpdates;
