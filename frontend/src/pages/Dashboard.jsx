import { useState } from 'react';
import axios from 'axios';

const Dashboard = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState('');
  const [uploadStatus, setUploadStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setUploadStatus({ type: '', message: '' });
    } else {
      setSelectedFile(null);
      setUploadStatus({ type: 'error', message: 'Only PDF documents are allowed.' });
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadStatus({ type: 'error', message: 'Please select a PDF file first.' });
      return;
    }

    setLoading(true);
    setUploadStatus({ type: '', message: '' });

    // Since we are uploading a raw physical file, we MUST use FormData instead of a regular JSON object
    const formData = new FormData();
    formData.append('pdf', selectedFile);
    formData.append('title', title || selectedFile.name);
    // Temporary hardcoded user ID until we link the auth headers tomorrow
    formData.append('userId', '65f1a2b3c4d5e6f7a8b9c0d1'); 

    try {
      const response = await axios.post('http://localhost:5000/api/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadStatus({ type: 'success', message: response.data.message });
      setSelectedFile(null);
      setTitle('');
    } catch (err) {
      setUploadStatus({
        type: 'error',
        message: err.response?.data?.message || 'Upload failed. Check server connectivity.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">🖋️ DocSigner Workspace</h1>
        <button 
          onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
          className="text-sm font-medium text-red-600 hover:underline cursor-pointer"
        >
          Sign Out
        </button>
      </nav>

      {/* Main Workspace Grid */}
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Upload Document for Signing</h2>
          
          {uploadStatus.message && (
            <div className={`mb-4 p-3 rounded-lg text-sm border ${
              uploadStatus.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
            }`}>
              {uploadStatus.message}
            </div>
          )}

          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Document Custom Title (Optional)</label>
              <input
                type="text"
                placeholder="e.g., NDA Agreement"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* File Input Box */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors bg-gray-50">
              <input
                type="file"
                accept=".pdf"
                id="pdf-upload"
                className="hidden"
                onChange={handleFileChange}
              />
              <label htmlFor="pdf-upload" className="cursor-pointer block">
                <span className="block text-sm font-semibold text-blue-600 hover:underline mb-1">
                  {selectedFile ? 'Change selected file' : 'Click to upload a PDF'}
                </span>
                <span className="text-xs text-gray-500 block">
                  {selectedFile ? `Selected: ${selectedFile.name}` : 'PDF files up to 10MB allowed'}
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50 cursor-pointer text-sm"
            >
              {loading ? 'Uploading File...' : 'Upload and Process Document'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;