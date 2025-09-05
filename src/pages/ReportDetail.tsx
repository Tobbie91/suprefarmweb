// src/pages/ReportDetail.tsx
import React from 'react';
import { useParams } from 'react-router-dom';

// Sample report data (replace with real data from API)
const reportData = [
  {
    id: 1,
    title: 'Monthly Farm Performance Report',
    content: 'This is a comprehensive report on the farm activities for the month of September, including crop growth, weather impacts, and yield predictions.',
    date: '2023-09-15',
    fileUrl: '/reports/farm-performance-september.pdf',
  },
  {
    id: 2,
    title: 'Investment Return Report',
    content: 'This report provides detailed analysis on ROI and financial performance for investors.',
    date: '2023-08-30',
    fileUrl: '/reports/investment-return-august.pdf',
  },
];

const ReportDetail: React.FC = () => {
  const { reportId } = useParams();
  const report = reportData.find((r) => r.id.toString() === reportId);

  if (!report) return <div>Report not found</div>;

  return (
    <div className="bg-gray-100 min-h-screen p-8">
      <h1 className="text-3xl font-semibold text-gray-700 mb-8">{report.title}</h1>
      <p className="text-sm text-gray-500 mb-4">Posted on: {report.date}</p>

      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <p className="text-lg text-gray-700">{report.content}</p>
        <a href={report.fileUrl} className="text-blue-600 hover:underline mt-4">
          Download Full Report
        </a>
      </div>
    </div>
  );
};

export default ReportDetail;

