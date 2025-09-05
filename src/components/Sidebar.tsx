

import React from "react";
import { Link } from "react-router-dom";
import { Home, Sun, Leaf, DollarSign, Settings, BarChart } from "lucide-react"; // Import relevant icons

const Sidebar: React.FC = () => {
  return (
    <div className="bg-green-600 text-white w-64 h-screen p-6">
      <h2 className="text-3xl font-bold mb-8">Suprefarm</h2>
      <ul>
        <li className="text-lg mb-4">
          <Link to="/dashboard" className="flex items-center gap-2 hover:text-green-200">
            <Home size={20} /> Dashboard
          </Link>
        </li>
        <li className="text-lg mb-4">
          <Link to="/farm-updates" className="flex items-center gap-2 hover:text-green-200">
            <Sun size={20} /> Farm Updates
          </Link>
        </li>
        <li className="text-lg mb-4">
          <Link to="/farms" className="flex items-center gap-2 hover:text-green-200">
            <Leaf size={20} /> My Farms
          </Link>
        </li>
        <li className="text-lg mb-4">
          <Link to="/land-purchase" className="flex items-center gap-2 hover:text-green-200">
            <DollarSign size={20} /> Land Purchase
          </Link>
        </li>
        <li className="text-lg mb-4">
          <Link to="/weather" className="flex items-center gap-2 hover:text-green-200">
            <Sun size={20} /> Weather Forecast
          </Link>
        </li>
        <li className="text-lg mb-4">
          <Link to="/reports" className="flex items-center gap-2 hover:text-green-200">
            <BarChart size={20} /> Reports
          </Link>
        </li>
        <li className="text-lg mb-4">
          <Link to="/admin" className="flex items-center gap-2 hover:text-green-200">
            <Settings size={20} /> Admin Panel
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;



