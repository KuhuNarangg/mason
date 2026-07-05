import { useState, useEffect } from 'react';
import { Trash2, Plus, Image as ImageIcon, Video, UploadCloud, CheckCircle, X } from 'lucide-react';
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
        toast.success('Media uploaded to cloud!');
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
      toast.success('Media published successfully');
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

  const resetUpload = () => {
    setFileUrl('');
    setNewMedia({ title: '', type: 'video' });
  };

  if (loading) return <div className="p-5 text-center text-muted">Loading cinematic gallery...</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-1px', margin: '0 0 0.5rem 0' }}>Cinematic Gallery</h1>
        <p style={{ fontSize: '1.1rem', color: '#64748b', margin: 0 }}>Curate the immersive media experience for your homepage.</p>
      </div>

      {/* Upload Studio */}
      <div style={{ background: '#fff', borderRadius: '24px', padding: '2rem', boxShadow: '0 20px 40px -15px rgba(0,0,0,0.05)', marginBottom: '4rem', border: '1px solid #f1f5f9' }}>
        
        {!fileUrl ? (
          /* Empty Upload State */
          <div style={{ position: 'relative' }}>
            <input 
              type="file" 
              accept="video/*,image/*" 
              onChange={handleFileUpload} 
              disabled={uploading}
              style={{ display: 'none' }}
              id="media-studio-upload"
            />
            <label htmlFor="media-studio-upload" style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              border: '2px dashed #cbd5e1', borderRadius: '16px', padding: '4rem 2rem',
              cursor: 'pointer', transition: 'all 0.3s ease', background: uploading ? '#f8fafc' : '#ffffff',
              opacity: uploading ? 0.6 : 1
            }}
            onMouseOver={e => !uploading && (e.currentTarget.style.borderColor = '#3b82f6', e.currentTarget.style.background = '#f0f9ff')}
            onMouseOut={e => !uploading && (e.currentTarget.style.borderColor = '#cbd5e1', e.currentTarget.style.background = '#ffffff')}
            >
              <div style={{ background: uploading ? 'transparent' : '#f1f5f9', padding: '1.5rem', borderRadius: '50%', marginBottom: '1.5rem', transition: 'all 0.3s' }}>
                {uploading ? (
                  <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                ) : (
                  <UploadCloud size={40} color="#3b82f6" />
                )}
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 600, color: '#1e293b' }}>
                {uploading ? 'Uploading to cloud...' : 'Drag & Drop Media'}
              </h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '1rem' }}>
                {uploading ? 'Please wait a moment' : 'Supports high-res MP4, WebM, JPG, PNG'}
              </p>
            </label>
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          /* Success & Configuration State */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#10b981' }}>
                <CheckCircle size={24} />
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Media Ready</h3>
              </div>
              <button onClick={resetUpload} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem', transition: 'color 0.2s' }} onMouseOver={e=>e.currentTarget.style.color='#ef4444'} onMouseOut={e=>e.currentTarget.style.color='#64748b'}>
                <X size={18} /> Discard
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', alignItems: 'center' }}>
              {/* Media Preview Player */}
              <div style={{ width: '100%', height: '300px', borderRadius: '16px', overflow: 'hidden', background: '#000', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
                {newMedia.type === 'video' ? (
                  <video src={fileUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} autoPlay loop muted controls />
                ) : (
                  <img src={fileUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Preview" />
                )}
              </div>

              {/* Media Details Form */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: '#f8fafc', padding: '2rem', borderRadius: '16px' }}>
                
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>Media Type</label>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <label style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem', background: newMedia.type === 'video' ? '#3b82f6' : '#fff', color: newMedia.type === 'video' ? '#fff' : '#64748b', border: '1px solid', borderColor: newMedia.type === 'video' ? '#3b82f6' : '#cbd5e1', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 500 }}>
                      <input type="radio" name="mediaType" value="video" checked={newMedia.type === 'video'} onChange={() => setNewMedia({...newMedia, type: 'video'})} style={{ display: 'none' }} />
                      <Video size={18} /> Video
                    </label>
                    <label style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem', background: newMedia.type === 'image' ? '#3b82f6' : '#fff', color: newMedia.type === 'image' ? '#fff' : '#64748b', border: '1px solid', borderColor: newMedia.type === 'image' ? '#3b82f6' : '#cbd5e1', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 500 }}>
                      <input type="radio" name="mediaType" value="image" checked={newMedia.type === 'image'} onChange={() => setNewMedia({...newMedia, type: 'image'})} style={{ display: 'none' }} />
                      <ImageIcon size={18} /> Image
                    </label>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>Title (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Summer Campaign" 
                    value={newMedia.title}
                    onChange={e => setNewMedia({...newMedia, title: e.target.value})}
                    style={{ width: '100%', padding: '1rem', fontSize: '1rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', transition: 'border-color 0.2s' }}
                    onFocus={e => e.target.style.borderColor = '#3b82f6'}
                    onBlur={e => e.target.style.borderColor = '#cbd5e1'}
                  />
                </div>

                <button 
                  onClick={handleCreate} 
                  style={{ width: '100%', padding: '1rem', background: '#0f172a', color: '#fff', fontSize: '1.1rem', fontWeight: 600, border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '0.5rem', transition: 'background 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.background = '#1e293b'}
                  onMouseOut={e => e.currentTarget.style.background = '#0f172a'}
                >
                  Publish to Gallery
                </button>

              </div>
            </div>

          </div>
        )}
      </div>

      {/* Gallery Grid */}
      <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '2rem' }}>Live Gallery</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
        {mediaItems.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem 2rem', background: '#f8fafc', borderRadius: '24px', color: '#94a3b8' }}>
            <ImageIcon size={48} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
            <p style={{ fontSize: '1.2rem', margin: 0, fontWeight: 500 }}>Your gallery is currently empty.</p>
          </div>
        ) : (
          mediaItems.map(item => (
            <div key={item._id} style={{ borderRadius: '20px', overflow: 'hidden', position: 'relative', background: '#000', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', cursor: 'default', height: '400px' }}>
              
              {/* Media Content */}
              {item.type === 'video' ? (
                <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} autoPlay loop muted playsInline />
              ) : (
                <img src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }} alt="Media" />
              )}

              {/* Gradient Overlay for Text Visibility */}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 50%)', pointerEvents: 'none' }} />

              {/* Top Right: Type Badge */}
              <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', padding: '0.4rem 0.8rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fff', fontSize: '0.8rem', fontWeight: 600, border: '1px solid rgba(255,255,255,0.2)' }}>
                {item.type === 'video' ? <Video size={14} /> : <ImageIcon size={14} />}
                {item.type.toUpperCase()}
              </div>

              {/* Bottom Left: Title */}
              <div style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem', right: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.4rem', fontWeight: 700, color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                  {item.title || 'Cinematic Shot'}
                </h4>
              </div>

              {/* Hover Delete Button */}
              <div className="gallery-delete-btn" style={{ position: 'absolute', top: '1rem', left: '1rem' }}>
                <button 
                  onClick={() => handleDelete(item._id)}
                  style={{ background: '#ef4444', border: 'none', padding: '0.75rem', borderRadius: '50%', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(239,68,68,0.4)', transition: 'transform 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                  title="Remove from Gallery"
                >
                  <Trash2 size={18} />
                </button>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
};

export default HomeMediaManagement;
