// src/pages/FarmUpdates.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const sampleUpdates = [
  {
    id: 1,
    title: 'New Crop Planting in Farm 1',
    summary: 'Farm 1 in Ilora has started planting a new crop of palm trees.',
    videoUrl: 'farm_update_video_1.mp4',
    date: '2023-09-15',
  },
  {
    id: 2,
    title: 'Sustainability Practices in Farm 2',
    summary: 'Farm 2 in Ghana is adopting new sustainable practices.',
    videoUrl: 'farm_update_video_2.mp4',
    date: '2023-09-12',
  },
  {
    id: 3,
    title: 'Weather Impact on Farm Health',
    summary: 'The farm has experienced unusual rainfall, affecting soil health.',
    videoUrl: 'farm_update_video_3.mp4',
    date: '2023-09-10',
  }
];

const FarmUpdates: React.FC = () => {
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setUpdates(sampleUpdates); // Using static data for now
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) return <div>Loading updates...</div>;

  return (
    <div className="bg-gray-100 min-h-screen p-8">
      <h1 className="text-3xl font-semibold text-gray-700 mb-8">Farm Updates</h1>

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
            <video controls className="w-full mt-2">
              <source src={update.videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FarmUpdates;

