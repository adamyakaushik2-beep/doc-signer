import { useState, useEffect } from 'react';
import axios from 'axios';
import SignatureModal from './SignatureModal'; // 1. Import our custom modal canvas

const Dashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState('');
  const [uploadStatus, setUploadStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  // Modal tracking states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeDocId, setActiveDocId] = useState(null);

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/documents/my-docs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDocuments(response.data);
    } catch (err) {
      console.error('Error fetching documents:', err);
    }
  };

  useEffect(() => { fetchDocuments(); }, []);

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
    if (!selectedFile) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('pdf', selectedFile);
    formData.append('title', title || selectedFile.name);

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
      });
      setUploadStatus({ type: 'success', message: 'Uploaded successfully!' });
      setSelectedFile(null);
      setTitle('');
      fetchDocuments();
    } catch (err) {
      setUploadStatus({ type: 'error', message: 'Upload failed.' });
    } finally { setLoading(false); }
  };

  // 2. Core Execution: Send signature data string straight to your new backend route
  const handleExecuteSignature = async (signatureImageBase64) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/documents/${activeDocId}/sign`, 
        { signatureImage: signatureImageBase64 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setIsModalOpen(false);
      fetchDocuments(); // Refresh table status layout automatically!
    } catch (err) {
      alert(err.response?.data?.message || 'Error executing digital signature matrix.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">🖋️ DocSigner Workspace</h1>
        <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} className="text-sm font-medium text-red-600 hover:underline cursor-pointer">Sign Out</button>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column Form */}
        <div className="md:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-fit">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Upload New Document</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Document Title</label>
              <input type="text" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 bg-gray-50">
              <input type="file" accept=".pdf" id="pdf-upload" className="hidden" onChange={handleFileChange} />
              <label htmlFor="pdf-upload" className="cursor-pointer block"><span className="block text-sm font-semibold text-blue-600 hover:underline">Choose a PDF</span></label>
            </div>
            <button type="submit" disabled={loading} className="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white text-sm">{loading ? 'Processing...' : 'Upload Document'}</button>
          </form>
        </div>

        {/* Right Column Files Table */}
        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Your Documents</h2>
          {documents.length === 0 ? <p className="text-sm text-gray-500">No documents found.</p> : (
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-600 font-medium bg-gray-50"><th className="p-3">File Name</th><th className="p-3">Status</th><th className="p-3">Action</th></tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc._id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="p-3 font-medium text-gray-900">{doc.title}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${doc.status === 'Signed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{doc.status}</span>
                    </td>
                    <td className="p-3">
                      {doc.status !== 'Signed' ? (
                        <button 
                          onClick={() => { setActiveDocId(doc._id); setIsModalOpen(true); }}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 cursor-pointer"
                        >
                          Sign Now
                        </button>
                      ) : <span className="text-xs text-gray-400 font-medium">Completed</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* 3. Drop the Modal Trigger Layer right at the root layer */}
      <SignatureModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleExecuteSignature} 
      />
    </div>
  );
};

export default Dashboard;