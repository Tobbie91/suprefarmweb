// src/pages/Farms.tsx
// import React from "react";
// import { Link } from "react-router-dom";
// import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
// import { LatLngExpression } from "leaflet"; // Type for coordinates

// const farmData = [
//   {
//     id: 1,
//     name: "Farm 1",
//     location: "Ilora, Nigeria",
//     crop: "Palm Tree",
//     progress: "80%",
//     coordinates: [7.5000, 3.7500] as LatLngExpression, // Sample coordinates for Farm 1
//   },
//   {
//     id: 2,
//     name: "Farm 2",
//     location: "Ghana",
//     crop: "Cocoa",
//     progress: "50%",
//     coordinates: [5.6100, -0.2050] as LatLngExpression, // Sample coordinates for Farm 2
//   },
// ];

// const Farms: React.FC = () => {
//   return (
//     <div>
//       <h2 className="text-3xl font-semibold text-gray-700 mb-4">Your Farms</h2>
//       <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
//         {farmData.map((farm) => (
//           <div key={farm.id} className="bg-white shadow-md rounded-lg p-6">
//             <h3 className="text-lg font-semibold text-gray-700">{farm.name}</h3>
//             <p className="text-sm text-gray-500">Location: {farm.location}</p>
//             <p className="text-sm text-gray-500">Crop: {farm.crop}</p>
//             <p className="text-sm text-gray-500">Progress: {farm.progress}</p>
            
//             {/* Map of the farm */}
//             <div className="mt-4">
//               <MapContainer
//                 center={farm.coordinates}
//                 zoom={13}
//                 style={{ height: "300px", width: "100%" }}
//               >
//                 <TileLayer
//                   url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//                   attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//                 />
//                 <Marker position={farm.coordinates}>
//                   <Popup>
//                     {farm.name} is located here.
//                     <br />
//                     Crop: {farm.crop}
//                   </Popup>
//                 </Marker>
//               </MapContainer>
//             </div>
            
//             <Link to={`/farm/${farm.id}`} className="text-green-600 hover:underline mt-4 block">
//               View Farm Details
//             </Link>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default Farms;

// src/pages/FarmOverview.tsx
// src/pages/MyFarms.tsx
// src/pages/FarmUpdateDetail.tsx
import React from 'react';
import { useParams } from 'react-router-dom';

const sampleUpdates = [
  {
    id: 1,
    title: 'New Crop Planting in Farm 1',
    content: 'Farm 1 in Ilora has started planting a new crop of palm trees...',
    videoUrl: 'farm_update_video_1.mp4',
    date: '2023-09-15',
  },
  {
    id: 2,
    title: 'Sustainability Practices in Farm 2',
    content: 'Farm 2 in Ghana is adopting new sustainable practices...',
    videoUrl: 'farm_update_video_2.mp4',
    date: '2023-09-12',
  },
  {
    id: 3,
    title: 'Weather Impact on Farm Health',
    content: 'Unusual rainfall has affected soil health, causing some challenges...',
    videoUrl: 'farm_update_video_3.mp4',
    date: '2023-09-10',
  }
];

const Farms: React.FC = () => {
  const { updateId } = useParams(); // Get updateId from the URL
  const update = sampleUpdates.find((u) => u.id.toString() === updateId);

  if (!update) return <div>Update not found</div>;

  return (
    <div className="bg-gray-100 min-h-screen p-8">
      <h1 className="text-3xl font-semibold text-gray-700 mb-8">{update.title}</h1>
      <p className="text-sm text-gray-500 mb-4">Posted on: {update.date}</p>

      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <p className="text-lg text-gray-700">{update.content}</p>
        <video controls className="w-full mt-4">
          <source src={update.videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
};

export default Farms;;


