// src/pages/Admin.tsx
import React, { useState } from 'react';

const AdminDashboard: React.FC = () => {
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateContent, setUpdateContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('New update submitted:', { updateTitle, updateContent });
    // Here, you would handle submitting the update (e.g., upload to a database)
  };

  return (
    <div className="bg-gray-100 min-h-screen p-8">
      <h1 className="text-3xl font-semibold text-gray-700 mb-8">Admin Panel</h1>
      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-xl font-semibold text-gray-700">Upload New Update</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="updateTitle" className="block text-sm font-medium text-gray-600">Update Title</label>
            <input
              type="text"
              id="updateTitle"
              value={updateTitle}
              onChange={(e) => setUpdateTitle(e.target.value)}
              className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label htmlFor="updateContent" className="block text-sm font-medium text-gray-600">Update Content</label>
            <textarea
              id="updateContent"
              value={updateContent}
              onChange={(e) => setUpdateContent(e.target.value)}
              className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button type="submit" className="w-full py-2 mt-4 text-white bg-green-600 rounded-md hover:bg-green-700">
            Submit Update
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;
