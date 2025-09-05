import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <header className="bg-green-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">Suprefarm</Link>
        <nav className="space-x-4">
          <Link to="/" className="hover:text-gray-200">Home</Link>
          <Link to="/dashboard" className="hover:text-gray-200">Dashboard</Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
