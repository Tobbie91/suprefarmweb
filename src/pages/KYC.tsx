// src/pages/KYC.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const KYC: React.FC = () => {
  const [document, setDocument] = useState<File | null>(null);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDocument(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!document) {
      alert('Please upload your document');
      return;
    }

    // Upload the document or handle verification process here
    console.log('Uploading document:', document);

    // After successful KYC, navigate to onboarding page
    navigate('/onboarding');
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-3xl mb-6 text-center text-green-600">KYC Verification</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="document" className="block text-sm text-gray-600">Upload Your ID</label>
            <input
              type="file"
              id="document"
              onChange={handleFileChange}
              className="w-full p-2 mt-1 border border-gray-300 rounded-md"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
          >
            Submit for Verification
          </button>
        </form>
      </div>
    </div>
  );
};

export default KYC;
