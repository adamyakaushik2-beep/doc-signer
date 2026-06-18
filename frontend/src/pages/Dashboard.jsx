import { useState, useEffect } from 'react';
import axios from 'axios';
import SignatureModal from './SignatureModal';

const Dashboard = () => {
  const [ownedDocs, setOwnedDocs] = useState([]);
  const [inboundDocs, setInboundDocs] = useState([]);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState('');
  const [recipients, setRecipients] = useState('');
  const [uploadStatus, setUploadStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeDocId, setActiveDocId] = useState(null);
  
  // State to track which document's audit trail is expanded
  const [expandedDocId, setExpandedDocId] = useState(null);

  const fetchDashboardFeeds = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/documents/my-docs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOwnedDocs(response.data.ownedDocs || []);
      setInboundDocs(response.data.pendingInboundDocs || []);
    } catch (err) {
      console.error('Error syncing dashboard feeds:', err);
    }
  };

  useEffect(() => { fetchDashboardFeeds(); }, []);

  // 📊 Calculate high-level workspace analytics metrics
  const totalUploads = ownedDocs.length;
  const pendingActions = inboundDocs.length;
  const completedDocuments = ownedDocs.filter(d => d.status === 'Signed').length;

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
    formData.append('recipients', recipients);

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
      });
      setUploadStatus({ type: 'success', message: 'Document shared and tracking active!' });
      setSelectedFile(null);
      setTitle('');
      setRecipients('');
      fetchDashboardFeeds();
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
      fetchDashboardFeeds();
    } catch (err) {
      alert(err.response?.data?.message || 'Error executing digital signature.');
    }
  };

  const toggleAuditTrail = (id) => {
    setExpandedDocId(expandedDocId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">🖋️ DocSigner Premium Workspace</h1>
        <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} className="text-sm font-medium text-red-600 hover:underline cursor-pointer">Sign Out</button>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Task 1: Visual Analytics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Total Uploads</span>
            <span className="text-3xl font-extrabold text-gray-900 mt-1 block">{totalUploads}</span>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm border-l-4 border-l-amber-500">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider block">Action Required</span>
            <span className="text-3xl font-extrabold text-amber-900 mt-1 block">{pendingActions}</span>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm border-l-4 border-l-green-500">
            <span className="text-xs font-semibold text-green-600 uppercase tracking-wider block">Completed Contracts</span>
            <span className="text-3xl font-extrabold text-green-900 mt-1 block">{completedDocuments}</span>
          </div>
        </div>

        {/* Main Grid Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Upload Form Panel */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-fit">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Upload & Route Contract</h2>
            {uploadStatus.message && (
              <div className={`mb-4 p-3 rounded-lg text-sm border ${uploadStatus.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{uploadStatus.message}</div>
            )}
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Title</label>
                <input type="text" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-500" placeholder="e.g., Lease Agreement" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Signer Emails</label>
                <input type="text" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-500" placeholder="partner@gmail.com, thirdparty@gmail.com" value={recipients} onChange={(e) => setRecipients(e.target.value)} />
                <p className="text-[10px] text-gray-400 mt-1">Separate multiple emails with commas</p>
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center bg-gray-50">
                <input type="file" accept=".pdf" id="pdf-upload" className="hidden" onChange={handleFileChange} />
                <label htmlFor="pdf-upload" className="cursor-pointer block"><span className="block text-sm font-semibold text-blue-600 hover:underline">Choose PDF</span></label>
              </div>
              <button type="submit" disabled={loading} className="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white text-sm cursor-pointer">{loading ? 'Processing...' : 'Upload & Route Document'}</button>
            </form>
          </div>

          {/* Tables Workspace */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Table 1: Inbound Pending Documents */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-md font-bold text-amber-800 flex items-center gap-2 mb-4">📥 Pending Action: Waiting for Your Signature</h2>
              {inboundDocs.length === 0 ? <p className="text-xs text-gray-400 italic py-2">Your inbox is clear! No external documents pending.</p> : (
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 font-medium bg-gray-50"><th className="p-3">File Name</th><th className="p-3">Action</th></tr>
                  </thead>
                  <tbody>
                    {inboundDocs.map((doc) => (
                      <tr key={doc._id} className="border-b border-gray-100 hover:bg-orange-50/10">
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

            {/* Table 2: Outbox Documents with Task 2 Audit Trails */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-md font-bold text-gray-900 mb-4">Outbox: Sent Documents & Tracking Profiles</h2>
              {ownedDocs.length === 0 ? <p className="text-xs text-gray-500 py-2">No documents sent yet.</p> : (
                <div className="space-y-3">
                  {ownedDocs.map((doc) => (
                    <div key={doc._id} className="border border-gray-100 rounded-lg p-3 bg-white hover:border-gray-300 transition-colors">
                      <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleAuditTrail(doc._id)}>
                        <div>
                          <h3 className="font-semibold text-sm text-gray-900">{doc.title}</h3>
                          <p className="text-[11px] text-gray-400 mt-0.5">Recipients: {doc.recipients.join(', ') || 'Self Only'}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${doc.status === 'Signed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{doc.status}</span>
                          <span className="text-gray-400 text-xs">{expandedDocId === doc._id ? '▲' : '▼'}</span>
                        </div>
                      </div>

                      {/* Dropdown Task 2 Audit Trail */}
                      {expandedDocId === doc._id && (
                        <div className="mt-3 pt-3 border-t border-gray-100 bg-gray-50/50 rounded p-3 text-xs space-y-2">
                          <h4 className="font-bold text-gray-700">🔒 System Audit Trail Tracking</h4>
                          <div><span className="font-medium text-gray-500">Created:</span> {new Date(doc.createdAt).toLocaleString()}</div>
                          <div>
                            <span className="font-medium text-gray-500">Signature Logs:</span>
                            {doc.signatures.length === 0 ? (
                              <span className="text-red-500 ml-1 italic">No signatures injected yet</span>
                            ) : (
                              <ul className="mt-1 list-disc list-inside text-green-700 pl-1 space-y-1">
                                {doc.signatures.map((sig, idx) => (
                                  <li key={idx}>Signed securely by <span className="font-bold">{sig.email || 'Author'}</span> on {new Date(sig.signedAt).toLocaleString()}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </main>

      <SignatureModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleExecuteSignature} />
    </div>
  );
};

export default Dashboard;