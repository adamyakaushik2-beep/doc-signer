import { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState('');
  const [uploadStatus, setUploadStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  // 1. Fetch user's documents from the backend
  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/documents/my-docs', {
        headers: {
          Authorization: `Bearer ${token}`, // Pass the JWT security token
        },
      });
      setDocuments(response.data);
    } catch (err) {
      console.error('Error fetching documents:', err);
    }
  };

  // Run on page load
  useEffect(() => {
    // call async function so state updates happen asynchronously (avoid sync setState in effect body)
    const load = async () => {
      await fetchDocuments();
    };
    load();
  }, []);

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

  // 2. Upload document with authorization headers
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadStatus({ type: 'error', message: 'Please select a PDF file first.' });
      return;
    }

    setLoading(true);
    setUploadStatus({ type: '', message: '' });

    const formData = new FormData();
    formData.append('pdf', selectedFile);
    formData.append('title', title || selectedFile.name);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`, // Inject token into headers
        },
      });

      setUploadStatus({ type: 'success', message: response.data.message });
      setSelectedFile(null);
      setTitle('');
      fetchDocuments(); // Refresh the list automatically on success!
    } catch (err) {
      setUploadStatus({
        type: 'error',
        message: err.response?.data?.message || 'Upload failed. Security validation rejected.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">🖋️ DocSigner Workspace</h1>
        <button 
          onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
          className="text-sm font-medium text-red-600 hover:underline cursor-pointer"
        >
          Sign Out
        </button>
      </nav>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Upload Form */}
        <div className="md:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-fit">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Upload New Document</h2>
          
          {uploadStatus.message && (
            <div className={`mb-4 p-3 rounded-lg text-sm border ${
              uploadStatus.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
            }`}>
              {uploadStatus.message}
            </div>
          )}

          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Document Title</label>
              <input
                type="text"
                placeholder="e.g., Project Agreement"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 bg-gray-50">
              <input type="file" accept=".pdf" id="pdf-upload" className="hidden" onChange={handleFileChange} />
              <label htmlFor="pdf-upload" className="cursor-pointer block">
                <span className="block text-sm font-semibold text-blue-600 hover:underline mb-1">
                  {selectedFile ? 'Change file' : 'Choose a PDF'}
                </span>
                <span className="text-xs text-gray-500 block truncate">
                  {selectedFile ? selectedFile.name : 'PDF up to 10MB'}
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50 cursor-pointer text-sm"
            >
              {loading ? 'Processing...' : 'Upload Document'}
            </button>
          </form>
        </div>

        {/* Right Column: Dynamic Files Table */}
        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Your Documents</h2>
          
          {documents.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm">
              No documents uploaded yet. Upload a PDF on the left to see it listed here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-600 font-medium bg-gray-50">
                    <th className="p-3">File Name</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Date Uploaded</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc._id} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <td className="p-3 font-medium text-gray-900">{doc.title}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          doc.status === 'Signed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="p-3 text-gray-500">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default Dashboard;