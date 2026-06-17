import { useState, useEffect } from 'react';
import axios from 'axios';
import SignatureModal from './SignatureModal';

const Dashboard = () => {
  // Split feed states
  const [ownedDocs, setOwnedDocs] = useState([]);
  const [inboundDocs, setInboundDocs] = useState([]);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState('');
  const [recipients, setRecipients] = useState(''); // Tracks recipient emails
  const [uploadStatus, setUploadStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeDocId, setActiveDocId] = useState(null);

  // Sync both dashboard tables
  const fetchDashboardFeeds = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/documents/my-docs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Capture data from the split endpoints
      setOwnedDocs(response.data.ownedDocs || []);
      setInboundDocs(response.data.pendingInboundDocs || []);
    } catch (err) {
      console.error('Error syncing dashboard feeds:', err);
    }
  };

  useEffect(() => { fetchDashboardFeeds(); }, []);

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
    setUploadStatus({ type: '', message: '' });

    const formData = new FormData();
    formData.append('pdf', selectedFile);
    formData.append('title', title || selectedFile.name);
    formData.append('recipients', recipients); // Pass the comma-separated emails string

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
      });
      setUploadStatus({ type: 'success', message: 'Document shared and tracking active!' });
      setSelectedFile(null);
      setTitle('');
      setRecipients('');
      fetchDashboardFeeds(); // Force reload both feeds
    } catch (err) {
      setUploadStatus({ type: 'error', message: 'Upload or processing failed.' });
    } finally { setLoading(false); }
  };

  const handleExecuteSignature = async (signatureImageBase64) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/documents/${activeDocId}/sign`, 
        { signatureImage: signatureImageBase64 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsModalOpen(false);
      fetchDashboardFeeds(); // Instantly clears the signed item into complete status
    } catch (err) {
      alert(err.response?.data?.message || 'Error executing digital signature.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">🖋️ DocSigner Collaborative Workspace</h1>
        <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} className="text-sm font-medium text-red-600 hover:underline cursor-pointer">Sign Out</button>
      </nav>

      {/* Main Grid Workspace */}
      <main className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Upload Column */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-fit">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Upload & Request Signatures</h2>
          {uploadStatus.message && (
            <div className={`mb-4 p-3 rounded-lg text-sm border ${uploadStatus.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{uploadStatus.message}</div>
          )}
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Document Title</label>
              <input type="text" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white" placeholder="NDA Agreement" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Signer Emails</label>
              <input type="text" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white" placeholder="friend1@gmail.com, colleague@gmail.com" value={recipients} onChange={(e) => setRecipients(e.target.value)} />
              <p className="text-[10px] text-gray-400 mt-1">Separate multiple emails with commas</p>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center bg-gray-50">
              <input type="file" accept=".pdf" id="pdf-upload" className="hidden" onChange={handleFileChange} />
              <label htmlFor="pdf-upload" className="cursor-pointer block"><span className="block text-sm font-semibold text-blue-600 hover:underline">Choose PDF</span></label>
            </div>
            <button type="submit" disabled={loading} className="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white text-sm cursor-pointer">{loading ? 'Processing...' : 'Upload & Route Document'}</button>
          </form>
        </div>

        {/* Workspace Tables Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Table 1: Inbound Pending Documents */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-md font-bold text-amber-800 flex items-center gap-2 mb-4">📥 Action Required: Waiting for Your Signature</h2>
            {inboundDocs.length === 0 ? <p className="text-xs text-gray-400 italic py-4">Your inbox is clear! No external pending signature invitations.</p> : (
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 font-medium bg-gray-50"><th className="p-3">File Name</th><th className="p-3">Action</th></tr>
                </thead>
                <tbody>
                  {inboundDocs.map((doc) => (
                    <tr key={doc._id} className="border-b border-gray-100 hover:bg-orange-50/20">
                      <td className="p-3 font-medium text-gray-900">{doc.title}</td>
                      <td className="p-3">
                        <button onClick={() => { setActiveDocId(doc._id); setIsModalOpen(true); }} className="px-3 py-1 bg-amber-600 text-white rounded text-xs font-semibold hover:bg-amber-700 cursor-pointer">Sign Document</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Table 2: Documents Owned / Sent */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-md font-bold text-gray-900 mb-4">Outbox: Documents You Sent / Own</h2>
            {ownedDocs.length === 0 ? <p className="text-xs text-gray-500 py-4">No documents sent or created yet.</p> : (
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 font-medium bg-gray-50"><th className="p-3">File Name</th><th className="p-3">Recipients</th><th className="p-3">Global Status</th></tr>
                </thead>
                <tbody>
                  {ownedDocs.map((doc) => (
                    <tr key={doc._id} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <td className="p-3 font-medium text-gray-900">{doc.title}</td>
                      <td className="p-3 text-xs text-gray-500 truncate max-w-[150px]">{doc.recipients.join(', ') || 'Self Only'}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${doc.status === 'Signed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{doc.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      </main>

      <SignatureModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleExecuteSignature} />
    </div>
  );
};

export default Dashboard;