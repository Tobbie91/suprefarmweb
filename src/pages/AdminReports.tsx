// src/pages/AdminReports.tsx
import React from 'react';

const AdminReports: React.FC = () => {
  const reports = [
    { id: 1, title: 'Farm Performance Report', date: '2023-09-15' },
    { id: 2, title: 'Investment Report', date: '2023-08-30' },
  ];

  const handleUploadReport = () => {
    // Add logic to upload reports
  };

  return (
    <div className="bg-gray-100 min-h-screen p-8">
      <h1 className="text-3xl font-semibold text-gray-700 mb-8">Manage Reports</h1>

      <button
        onClick={handleUploadReport}
        className="bg-green-600 text-white px-6 py-2 mb-8 rounded-md hover:bg-green-700"
      >
        Upload New Report
      </button>

      <div className="bg-white shadow-md rounded-lg p-6">
        {reports.map((report) => (
          <div key={report.id} className="border-b py-4">
            <h3 className="text-xl text-blue-600">{report.title}</h3>
            <p className="text-sm text-gray-500">Posted on: {report.date}</p>
            <button
              onClick={() => {
                // Add logic to delete report
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

export default AdminReports;
