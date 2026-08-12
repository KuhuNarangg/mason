import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Trash2, Plus, Upload, ArrowLeft } from 'lucide-react';
import api from '../utils/api';

const emptyVariant = () => ({ size: '', color: '', colorHex: '#000000', stock: 0, sku: '' });

const initialForm = {
  name: '',
  description: '',
  brand: '',
  gender: 'unisex',
  subGender: '',
  type: '',
  images: [],
  tryOnImage: '',
  originalPrice: '',
  discount: 0,
  tags: '',
  sizeGuide: '',
  isFeatured: false,
  isTrending: false,
  isActive: true,
  isReturnable: true,
  returnWindow: 7,
  lowStockThreshold: 5,
  variants: [emptyVariant()],
};

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/vendor/products/${id}`)
      .then(({ data }) => {
        const p = data.product || data;
        setForm({
          ...initialForm,
          ...p,
          tags: Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || ''),
          variants: p.variants?.length ? p.variants : [emptyVariant()],
        });
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load product'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleVariantChange = (idx, field, value) => {
    setForm((f) => {
      const variants = [...f.variants];
      variants[idx] = { ...variants[idx], [field]: value };
      return { ...f, variants };
    });
  };

  const addVariant = () => setForm((f) => ({ ...f, variants: [...f.variants, emptyVariant()] }));
  const removeVariant = (idx) => setForm((f) => ({ ...f, variants: f.variants.filter((_, i) => i !== idx) }));

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        const { data } = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        urls.push(data.url);
      }
      setForm((f) => ({ ...f, images: [...f.images, ...urls] }));
      toast.success('Image(s) uploaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Image upload failed');
    } finally {
      setUploading(false);
    }
  const [uploadingTryOn, setUploadingTryOn] = useState(false);

  const handleTryOnUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingTryOn(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post('/upload/try-on', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (data.url) {
        setForm((f) => ({ ...f, tryOnImage: data.url }));
        toast.success('Try-on image uploaded');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Try-on upload failed');
    } finally {
      setUploadingTryOn(false);
    }
  };

  const removeImage = (idx) => setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.images.length) { toast.error('Add at least one product image'); return; }
    if (!form.variants.length || form.variants.some((v) => !v.size || !v.color)) {
      toast.error('Each variant needs at least a size and color');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        originalPrice: Number(form.originalPrice),
        discount: Number(form.discount) || 0,
        returnWindow: Number(form.returnWindow) || 0,
        lowStockThreshold: Number(form.lowStockThreshold) || 5,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        variants: form.variants.map((v) => ({ ...v, stock: Number(v.stock) || 0 })),
      };
      if (isEdit) {
        await api.put(`/vendor/products/${id}`, payload);
        toast.success('Product updated');
      } else {
        await api.post('/vendor/products', payload);
        toast.success('Product created');
      }
      navigate('/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="empty-state">Loading…</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <Link to="/products" className="btn btn-sm" style={{ marginBottom: 10 }}><ArrowLeft size={14} /> Back</Link>
          <h1>{isEdit ? 'Edit Product' : 'Add Product'}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div className="form-section-title">Basic Info</div>
        <div className="form-grid">
          <div className="form-group">
            <label>Product Name</label>
            <input name="name" required value={form.name} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Brand</label>
            <input name="brand" value={form.brand} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Type (e.g. T-Shirt, Jeans)</label>
            <input name="type" required value={form.type} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Gender</label>
            <select name="gender" value={form.gender} onChange={handleChange}>
              <option value="men">Men</option>
              <option value="women">Women</option>
              <option value="kids">Kids</option>
              <option value="unisex">Unisex</option>
            </select>
          </div>
          <div className="form-group">
            <label>Sub-category</label>
            <input name="subGender" value={form.subGender} onChange={handleChange} placeholder="e.g. topwear, bottomwear" />
          </div>
          <div className="form-group">
            <label>Tags (comma separated)</label>
            <input name="tags" value={form.tags} onChange={handleChange} placeholder="casual, cotton, summer" />
          </div>
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea name="description" rows={4} value={form.description} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Size Guide (optional notes)</label>
          <textarea name="sizeGuide" rows={2} value={form.sizeGuide} onChange={handleChange} />
        </div>

        <div className="form-section-title">Pricing</div>
        <div className="form-grid">
          <div className="form-group">
            <label>Original Price (₹)</label>
            <input type="number" name="originalPrice" required min="0" value={form.originalPrice} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Discount (%)</label>
            <input type="number" name="discount" min="0" max="100" value={form.discount} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Low Stock Threshold</label>
            <input type="number" name="lowStockThreshold" min="0" value={form.lowStockThreshold} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Return Window (days)</label>
            <input type="number" name="returnWindow" min="0" value={form.returnWindow} onChange={handleChange} />
          </div>
        </div>

        <div className="form-section-title">Images</div>
        <div className="tag-row" style={{ marginBottom: 10 }}>
          {form.images.map((img, idx) => (
            <div key={idx} style={{ position: 'relative' }}>
              <img src={img} alt="" className="thumb" style={{ width: 64, height: 64 }} />
              <button type="button" className="btn btn-sm btn-danger" style={{ position: 'absolute', top: -8, right: -8, padding: '2px 6px' }} onClick={() => removeImage(idx)}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
        <label className="btn btn-sm" style={{ display: 'inline-flex', cursor: 'pointer' }}>
          <Upload size={14} /> {uploading ? 'Uploading…' : 'Upload Images'}
          <input type="file" accept="image/*" multiple hidden onChange={handleImageUpload} disabled={uploading} />
        </label>

        <div className="form-section-title" style={{ marginTop: 20 }}>Virtual Try-On Image (Front-Facing Overlay)</div>
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 10, lineHeight: '1.4' }}>
          Upload a straight-on, front-facing photo of this garment against a plain background. Center the item fully in frame, no folds or wrinkles, arms/sleeves laid flat if applicable.
        </p>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 15 }}>
          {form.tryOnImage ? (
            <div style={{ position: 'relative', width: 80, height: 100, borderRadius: 8, overflow: 'hidden', border: '2px solid var(--primary, #6366f1)' }}>
              <img src={form.tryOnImage} alt="Try On" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              <button type="button" className="btn btn-sm btn-danger" style={{ position: 'absolute', top: 2, right: 2, padding: '2px 4px' }} onClick={() => setForm((f) => ({ ...f, tryOnImage: '' }))}>
                <Trash2 size={10} />
              </button>
            </div>
          ) : (
            <label className="btn btn-sm" style={{ display: 'inline-flex', cursor: 'pointer' }}>
              <Upload size={14} /> {uploadingTryOn ? 'Uploading…' : 'Upload Try-On Photo'}
              <input type="file" accept="image/*" hidden onChange={handleTryOnUpload} disabled={uploadingTryOn} />
            </label>
          )}
        </div>

        <div className="form-section-title">Variants (Size / Color / Stock)</div>
        {form.variants.map((v, idx) => (
          <div key={idx} className="form-grid" style={{ alignItems: 'end', borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 10 }}>
            <div className="form-group">
              <label>Size</label>
              <input value={v.size} onChange={(e) => handleVariantChange(idx, 'size', e.target.value)} placeholder="S, M, L, XL" required />
            </div>
            <div className="form-group">
              <label>Color Name</label>
              <input value={v.color} onChange={(e) => handleVariantChange(idx, 'color', e.target.value)} placeholder="Navy Blue" required />
            </div>
            <div className="form-group">
              <label>Color Hex</label>
              <input type="color" value={v.colorHex || '#000000'} onChange={(e) => handleVariantChange(idx, 'colorHex', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Stock</label>
              <input type="number" min="0" value={v.stock} onChange={(e) => handleVariantChange(idx, 'stock', e.target.value)} />
            </div>
            <div className="form-group">
              <label>SKU</label>
              <input value={v.sku} onChange={(e) => handleVariantChange(idx, 'sku', e.target.value)} />
            </div>
            <div className="form-group">
              <button type="button" className="btn btn-sm btn-danger" onClick={() => removeVariant(idx)} disabled={form.variants.length === 1}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        <button type="button" className="btn btn-sm" onClick={addVariant}><Plus size={14} /> Add Variant</button>

        <div className="form-section-title">Flags</div>
        <div className="checkbox-row">
          <label><input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} /> Active (visible to customers)</label>
          <label><input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={handleChange} /> Featured</label>
          <label><input type="checkbox" name="isTrending" checked={form.isTrending} onChange={handleChange} /> Trending</label>
          <label><input type="checkbox" name="isReturnable" checked={form.isReturnable} onChange={handleChange} /> Returnable</label>
        </div>

        <button className="btn btn-primary" type="submit" disabled={saving} style={{ marginTop: 16 }}>
          {saving ? 'Saving…' : isEdit ? 'Update Product' : 'Create Product'}
        </button>
      </form>
    </div>
  );
}
