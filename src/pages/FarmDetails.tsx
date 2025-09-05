
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const farmData = {
  1: { name: 'Farm 1', location: 'Ilora, Nigeria', crop: 'Palm Trees', progress: '80%', healthStatus: 'Healthy', lastActivity: 'Planted new crops', soilMoisture: '80%', temperature: '25°C' },
  2: { name: 'Farm 2', location: 'Ghana', crop: 'Cocoa', progress: '60%', healthStatus: 'Needs attention', lastActivity: 'Irrigation adjustment', soilMoisture: '50%', temperature: '28°C' },
};

const FarmDetails: React.FC = () => {
  const { farmId } = useParams(); // Get farmId from the URL
  const [farm, setFarm] = useState<any>(null);

  useEffect(() => {
    // Fetch the farm details using the farmId
    if (farmId) {
        // @ts-ignore
      setFarm(farmData[Number(farmId)]); // Replace with API call
    }
  }, [farmId]);

  if (!farm) return <div>Farm not found.</div>;

  return (
    <div className="bg-gray-100 min-h-screen p-8">
      <h1 className="text-3xl font-semibold text-gray-700 mb-8">{farm.name} Details</h1>

      {/* Farm Information */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-700">Farm Overview</h3>
        <p className="text-sm text-gray-500">Location: {farm.location}</p>
        <p className="text-sm text-gray-500">Crop: {farm.crop}</p>
        <p className="text-sm text-gray-500">Progress: {farm.progress}</p>
        <p className="text-sm text-gray-500">Health Status: {farm.healthStatus}</p>
        <p className="text-sm text-gray-500">Last Activity: {farm.lastActivity}</p>
      </div>

      {/* Farm Metrics */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-700">Farm Metrics</h3>
        <p className="text-sm text-gray-500">Soil Moisture: {farm.soilMoisture}</p>
        <p className="text-sm text-gray-500">Temperature: {farm.temperature}</p>
      </div>

      {/* Recent Activities */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-700">Recent Activities</h3>
        <ul className="list-disc pl-5">
          <li className="text-sm text-gray-500">Irrigation systems checked</li>
          <li className="text-sm text-gray-500">New crop planted</li>
          <li className="text-sm text-gray-500">Pest control applied</li>
        </ul>
      </div>
    </div>
  );
};

export default FarmDetails;
