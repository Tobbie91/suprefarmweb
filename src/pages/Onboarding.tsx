// src/pages/Onboarding.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Onboarding: React.FC = () => {
  const [profileData, setProfileData] = useState({ name: '', phone: '' });
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you can save the profile data (to Supabase, local storage, etc.)
    console.log('Profile data:', profileData);

    // After onboarding, redirect to dashboard
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-3xl mb-6 text-center text-green-600">Onboarding</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm text-gray-600">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={profileData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              className="w-full p-2 mt-1 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="phone" className="block text-sm text-gray-600">Phone Number</label>
            <input
              type="text"
              id="phone"
              name="phone"
              value={profileData.phone}
              onChange={handleChange}
              placeholder="Enter your phone number"
              className="w-full p-2 mt-1 border border-gray-300 rounded-md"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
          >
            Complete Onboarding
          </button>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
