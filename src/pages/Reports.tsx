// src/pages/Reports.tsx
import React from 'react';
import { Link } from 'react-router-dom';

// Sample report data (replace with real data from API)
const reports = [
  {
    id: 1,
    title: 'Monthly Farm Performance Report',
    summary: 'A comprehensive report on farm activities, crop growth, and weather impacts.',
    date: '2023-09-15',
    fileUrl: '/reports/farm-performance-september.pdf',
  },
  {
    id: 2,
    title: 'Investment Return Report',
    summary: 'An analysis of ROI, earnings, and future projections for investors.',
    date: '2023-08-30',
    fileUrl: '/reports/investment-return-august.pdf',
  },
  {
    id: 3,
    title: 'Carbon Credit Report',
    summary: 'Tracking the carbon offsets and sustainability efforts of the farm.',
    date: '2023-07-20',
    fileUrl: '/reports/carbon-credit-report-july.pdf',
  },
];

const Reports: React.FC = () => {
  return (
    <div className="bg-gray-100 min-h-screen p-8">
      <h1 className="text-3xl font-semibold text-gray-700 mb-8">Reports</h1>

      <div className="bg-white shadow-md rounded-lg p-6">
        {reports.map((report) => (
          <div key={report.id} className="border-b py-4">
            <h3 className="text-xl text-blue-600">
              <Link to={`/reports/${report.id}`} className="hover:underline">
                {report.title}
              </Link>
            </h3>
            <p className="text-gray-600">{report.summary}</p>
            <p className="text-sm text-gray-500">Posted on: {report.date}</p>
            <a href={report.fileUrl} className="text-blue-600 hover:underline">
              Download Report
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reports;
