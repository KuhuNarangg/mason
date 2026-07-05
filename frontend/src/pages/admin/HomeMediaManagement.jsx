import { useState, useEffect } from 'react';
import { Trash2, Plus, Image as ImageIcon, Video, UploadCloud } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import './admin-pages.css';

const HomeMediaManagement = () => {
  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [uploading, setUploading] = useState(false);
  const [newMedia, setNewMedia] = useState({ title: '', type: 'video' });
  const [fileUrl, setFileUrl] = useState('');

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      const { data } = await api.get('/admin/homemedia');
      setMediaItems(data.media || []);
    } catch (err) {
      toast.error('Failed to load media');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (data.url) {
        setFileUrl(data.url);
        toast.success('File uploaded successfully to cloud!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async () => {
    if (!fileUrl) return toast.error('Please upload a file first');
    try {
      await api.post('/admin/homemedia', { ...newMedia, url: fileUrl });
      toast.success('Media added successfully');
      setNewMedia({ title: '', type: 'video' });
      setFileUrl('');
      fetchMedia();
    } catch (err) {
      toast.error('Failed to save media');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this media item?')) return;
    try {
      await api.delete(`/admin/homemedia/${id}`);
      toast.success('Media removed');
      fetchMedia();
    } catch (err) {
      toast.error('Failed to delete media');
    }
  };

  if (loading) return <div className="p-4 text-muted">Loading cinematic gallery...</div>;

  return (
    <div className="admin-fade-in" style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 className="admin-page-title">Cinematic Gallery</h2>
          <p className="admin-page-subtitle">Manage videos and pictures shown in the middle of the home page</p>
        </div>
      </div>

      {/* Add New Media Form */}
      <div className="admin-card" style={{ marginBottom: '3rem', borderTop: '4px solid #10b981', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)' }}>
        <h3 className="admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ background: '#ecfdf5', padding: '0.5rem', borderRadius: '8px', color: '#10b981' }}>
            <Plus size={20} />
          </div>
          Add New Media
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '1rem' }}>
          
          {/* Top Row: Form Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            <div className="admin-form-group">
              <label style={{ fontWeight: 600, color: '#334155' }}>Media Format</label>
              <select 
                className="admin-input" 
                value={newMedia.type} 
                onChange={e => setNewMedia({...newMedia, type: e.target.value})}
                style={{ padding: '0.75rem', fontSize: '1rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              >
                <option value="video">Video (MP4/WebM)</option>
                <option value="image">Picture (JPG/PNG)</option>
              </select>
            </div>

            <div className="admin-form-group">
              <label style={{ fontWeight: 600, color: '#334155' }}>Optional Title</label>
              <input 
                className="admin-input" 
                type="text" 
                placeholder="e.g. Summer Collection 2026" 
                value={newMedia.title}
                onChange={e => setNewMedia({...newMedia, title: e.target.value})}
                style={{ padding: '0.75rem', fontSize: '1rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>
            
            <button 
              className="btn-primary" 
              onClick={handleCreate} 
              disabled={!fileUrl}
              style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', borderRadius: '8px', marginTop: 'auto', opacity: !fileUrl ? 0.6 : 1 }}
            >
              Publish to Home Page
            </button>
          </div>

          {/* Upload Area */}
          <div className="admin-form-group" style={{ margin: 0, height: '100%' }}>
            {fileUrl ? (
              <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '250px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                {newMedia.type === 'video' ? (
                  <video src={fileUrl} style={{ width: '100%', height: '100%', minHeight: '250px', objectFit: 'cover' }} autoPlay loop muted />
                ) : (
                  <img src={fileUrl} style={{ width: '100%', height: '100%', minHeight: '250px', objectFit: 'cover' }} alt="Preview" />
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent 50%)', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '1.5rem' }}>
                  <span style={{ color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}></div>
                    Ready to Publish
                  </span>
                  <button 
                    onClick={() => setFileUrl('')} 
                    style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                    onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                  >
                    Change File
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ position: 'relative', height: '100%', minHeight: '250px' }}>
                <input 
                  type="file" 
                  accept={newMedia.type === 'video' ? "video/*" : "image/*"} 
                  onChange={handleFileUpload} 
                  disabled={uploading}
                  style={{ display: 'none' }}
                  id="media-upload"
                />
                <label htmlFor="media-upload" style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem',
                  border: '2px dashed #cbd5e1', height: '100%', minHeight: '250px', borderRadius: '12px', cursor: 'pointer',
                  color: '#64748b', transition: 'all 0.3s ease', background: uploading ? '#f1f5f9' : '#f8fafc',
                  opacity: uploading ? 0.7 : 1
                }}
                onMouseOver={e => !uploading && (e.currentTarget.style.background = '#f1f5f9', e.currentTarget.style.borderColor = '#94a3b8')}
                onMouseOut={e => !uploading && (e.currentTarget.style.background = '#f8fafc', e.currentTarget.style.borderColor = '#cbd5e1')}
                >
                  <div style={{ background: '#fff', padding: '1rem', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    {uploading ? (
                      <div style={{ width: '24px', height: '24px', border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <UploadCloud size={32} color="#3b82f6" />
                    )}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: 0, fontWeight: 600, color: '#334155', fontSize: '1.1rem' }}>
                      {uploading ? 'Uploading to Cloudinary...' : 'Click to Browse Files'}
                    </p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>
                      {uploading ? 'Please wait, this may take a moment' : `Supports high-res ${newMedia.type === 'video' ? 'MP4, WebM' : 'JPG, PNG, WebP'}`}
                    </p>
                  </div>
                </label>
                <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Media Grid */}
      <h3 className="admin-page-title" style={{ fontSize: '1.3rem', marginBottom: '1.5rem', color: '#1e293b' }}>Published Media</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
        {mediaItems.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem 2rem', background: '#fff', borderRadius: '16px', color: '#94a3b8', border: '1px dashed #cbd5e1' }}>
            <Video size={48} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
            <p style={{ fontSize: '1.1rem', margin: 0 }}>Your cinematic gallery is empty.</p>
            <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Upload your first video or image above to showcase it on the homepage!</p>
          </div>
        ) : (
          mediaItems.map(item => (
            <div key={item._id} style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.08)', position: 'relative', transition: 'transform 0.2s ease', cursor: 'default' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
              
              <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', zIndex: 10 }}>
                <button 
                  onClick={() => handleDelete(item._id)}
                  style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)', border: 'none', padding: '0.6rem', borderRadius: '50%', color: '#ef4444', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                  onMouseOver={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.9)'; e.currentTarget.style.color = '#ef4444'; }}
                  title="Delete from Gallery"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', zIndex: 10, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', color: 'white', padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid rgba(255,255,255,0.2)' }}>
                {item.type === 'video' ? <Video size={14} color="#60a5fa" /> : <ImageIcon size={14} color="#34d399" />}
                {item.type.toUpperCase()}
              </div>

              <div style={{ height: '240px', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {item.type === 'video' ? (
                  <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }} controls />
                ) : (
                  <img src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Media" />
                )}
              </div>
              
              <div style={{ padding: '1.25rem', borderTop: '1px solid #f1f5f9' }}>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {item.title || 'Untitled Media'}
                </h4>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Published on Home Page
                </p>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HomeMediaManagement;
