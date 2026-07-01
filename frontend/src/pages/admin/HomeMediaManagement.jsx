import { useState, useEffect } from 'react';
import { Trash2, Plus, Image as ImageIcon, Video, UploadCloud } from 'lucide-react';
import api from '../../../utils/api';
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
      <div className="admin-card" style={{ marginBottom: '2rem' }}>
        <h3 className="admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} className="icon-blue" />
          Add New Media
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
          
          <div className="admin-form-group">
            <label>Media Type</label>
            <select className="admin-input" value={newMedia.type} onChange={e => setNewMedia({...newMedia, type: e.target.value})}>
              <option value="video">Video (MP4/WebM)</option>
              <option value="image">Picture (JPG/PNG)</option>
            </select>
          </div>

          <div className="admin-form-group">
            <label>Optional Title</label>
            <input 
              className="admin-input" 
              type="text" 
              placeholder="e.g. Summer Collection" 
              value={newMedia.title}
              onChange={e => setNewMedia({...newMedia, title: e.target.value})}
            />
          </div>

          <div className="admin-form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Upload File</label>
            {fileUrl ? (
              <div style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ color: '#10b981', fontWeight: '600' }}>File Uploaded Successfully!</span>
                <button className="btn-cancel" onClick={() => setFileUrl('')}>Remove & Upload Another</button>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <input 
                  type="file" 
                  accept={newMedia.type === 'video' ? "video/*" : "image/*"} 
                  onChange={handleFileUpload} 
                  disabled={uploading}
                  style={{ display: 'none' }}
                  id="media-upload"
                />
                <label htmlFor="media-upload" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  border: '2px dashed #cbd5e1', padding: '2rem', borderRadius: '12px', cursor: 'pointer',
                  color: '#64748b', transition: 'all 0.2s', background: '#f8fafc'
                }}>
                  <UploadCloud size={24} />
                  {uploading ? 'Uploading to cloud... Please wait' : 'Click to Upload File'}
                </label>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button className="btn-primary" onClick={handleCreate} disabled={!fileUrl}>
            Add to Gallery
          </button>
        </div>
      </div>

      {/* Media Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {mediaItems.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', background: '#fff', borderRadius: '12px', color: '#94a3b8' }}>
            No media found. Upload a video to start the cinematic experience!
          </div>
        ) : (
          mediaItems.map(item => (
            <div key={item._id} style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', position: 'relative' }}>
              
              <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', zIndex: 10 }}>
                <button 
                  onClick={() => handleDelete(item._id)}
                  style={{ background: 'white', border: 'none', padding: '0.5rem', borderRadius: '50%', color: '#ef4444', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', zIndex: 10, background: 'rgba(0,0,0,0.6)', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                {item.type === 'video' ? <Video size={12} /> : <ImageIcon size={12} />}
                {item.type.toUpperCase()}
              </div>

              <div style={{ height: '220px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {item.type === 'video' ? (
                  <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} controls />
                ) : (
                  <img src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Media" />
                )}
              </div>
              
              <div style={{ padding: '1rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#1e293b' }}>
                  {item.title || 'Untitled Media'}
                </h4>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HomeMediaManagement;
