import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, Upload, Link as LinkIcon, ArrowLeft, Camera } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import '../admin/admin-pages.css';

const defaultForm = {
  name: '',
  description: '',
  brand: '',
  category: '',
  subcategory: '',
  gender: 'men',
  subGender: 'none',
  type: 'shirt',
  originalPrice: '',
  discount: '0',
  taxConfig: { isInclusive: true, cgstPercent: 6, sgstPercent: 6, additionalCharges: 0 },
  images: [],
  tryOnImage: '',
  variants: [],
  tags: [],
  isFeatured: false,
  isTrending: false,
  isReturnable: true,
  returnWindow: 14,
};

const VendorProductForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(isEdit);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadMode, setImageUploadMode] = useState('file');
  const [imageUrl, setImageUrl] = useState('');

  const [form, setForm] = useState(defaultForm);
  const [newVariantConfig, setNewVariantConfig] = useState({ sizes: [], colors: [], stock: '', sku: '' });
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [customColorInput, setCustomColorInput] = useState('');
  const [customColorHex, setCustomColorHex] = useState('#000000');

  const typeOptions = ['shirt', 'tshirt', 'jeans', 'lowers', 'trousers', 'kurta', 'dress', 'top', 'skirt', 'jacket', 'shorts', 'hoodie', 'sweater', 'ethnic', 'indo-western', 'party-wear', 'plus-size', 'other'];
  const [sizeOptions, setSizeOptions] = useState(['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36']);
  const [colorOptions, setColorOptions] = useState([
    { name: 'Black', hex: '#000000' },
    { name: 'White', hex: '#ffffff' },
    { name: 'Red', hex: '#ff0000' },
    { name: 'Blue', hex: '#3b82f6' },
    { name: 'Navy', hex: '#1e3a5f' },
    { name: 'Grey', hex: '#9e9e9e' },
    { name: 'Beige', hex: '#d4a373' },
    { name: 'Pink', hex: '#f48fb1' },
    { name: 'Green', hex: '#43a047' },
    { name: 'Olive', hex: '#827717' },
  ]);

  const [categoryTree, setCategoryTree] = useState([]);
  const [brandOptions, setBrandOptions] = useState([]);

  useEffect(() => {
    if (isEdit) fetchProduct();
    fetchCategoryTree();
    fetchBrands();
  }, [id]);

  const fetchCategoryTree = async () => {
    try {
      const { data } = await api.get('/categories/tree');
      setCategoryTree(data.categories || []);
    } catch {
      // non-fatal — category dropdowns will just be empty
    }
  };

  const fetchBrands = async () => {
    try {
      const { data } = await api.get('/brands');
      setBrandOptions(data.brands || []);
    } catch {
      // non-fatal
    }
  };

  const subcategoryOptions = categoryTree.find((c) => c._id === form.category)?.subcategories || [];

  const fetchProduct = async () => {
    try {
      const { data } = await api.get(`/vendor/products/${id}`);
      const product = data.product;
      if (product.isReturnable === undefined) product.isReturnable = true;
      if (product.returnWindow === undefined) product.returnWindow = 14;
      if (!product.taxConfig) product.taxConfig = { isInclusive: true, cgstPercent: 6, sgstPercent: 6, additionalCharges: 0 };
      setForm(product);
    } catch {
      toast.error('Failed to load product');
      navigate('/vendor/products');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files) return;
    setUploadingImage(true);
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        if (data.url) {
          setForm((f) => ({ ...f, images: [...f.images, data.url] }));
          toast.success('Image uploaded');
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Image upload failed');
      }
    }
    setUploadingImage(false);
  };

  const handleTryOnImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingTryOn(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/upload/try-on', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (data.url) {
        setForm((f) => ({ ...f, tryOnImage: data.url }));
        toast.success('Try-on image uploaded successfully');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Try-on image upload failed');
    } finally {
      setUploadingTryOn(false);
    }
  };

  const handleImageUrlAdd = () => {
    if (!imageUrl.trim()) return toast.error('Please enter an image URL');
    try {
      new URL(imageUrl);
      setForm({ ...form, images: [...form.images, imageUrl] });
      setImageUrl('');
      toast.success('Image URL added');
    } catch {
      toast.error('Please enter a valid image URL');
    }
  };

  const removeImage = (index) => setForm({ ...form, images: form.images.filter((_, i) => i !== index) });

  const addVariant = () => {
    if (!form.name || !form.description || !form.originalPrice || form.images.length === 0) {
      return toast.error('Please fill product name, description, price, and add images first');
    }
    if (newVariantConfig.sizes.length === 0 || newVariantConfig.colors.length === 0 || !newVariantConfig.stock) {
      return toast.error('Please select sizes, colors, and enter stock');
    }
    const variants = [];
    newVariantConfig.sizes.forEach((size) => {
      newVariantConfig.colors.forEach((colorName) => {
        const colorObj = colorOptions.find((c) => c.name === colorName);
        variants.push({
          size, color: colorName, colorHex: colorObj?.hex || '#000000',
          stock: Number(newVariantConfig.stock),
          sku: newVariantConfig.sku || `${size}-${colorName}`.toUpperCase(),
        });
      });
    });
    setForm({ ...form, variants: [...form.variants, ...variants] });
    setNewVariantConfig({ sizes: [], colors: [], stock: '', sku: '' });
    toast.success(`Added ${variants.length} variant(s)`);
  };

  const removeVariant = (index) => setForm({ ...form, variants: form.variants.filter((_, i) => i !== index) });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.description || !form.originalPrice || form.images.length === 0) {
      return toast.error('Please fill in all required fields and add at least one image');
    }
    if (form.variants.length === 0) {
      return toast.error('Please add at least one variant (size/color/stock)');
    }
    try {
      if (isEdit) {
        await api.put(`/vendor/products/${id}`, form);
        toast.success('Product updated');
      } else {
        await api.post('/vendor/products', form);
        toast.success('Product created');
      }
      navigate('/vendor/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    }
  };

  if (loading) return <div className="admin-page-title">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <button
          onClick={() => navigate('/vendor/products')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: '#a98478', fontWeight: 'bold', fontSize: '1rem' }}
        >
          <ArrowLeft size={20} /> Back to Products
        </button>
      </div>

      <div className="form-container" style={{ maxHeight: '85vh', overflowY: 'auto', marginBottom: '2rem', padding: '1.5rem' }}>
        <h2 style={{ marginBottom: '1.5rem', color: '#2d2d2d' }}>{isEdit ? 'Edit Product' : 'Add Product'}</h2>

        <form onSubmit={handleSubmit}>
          {/* Images */}
          <div className="form-group">
            <label>Product Images * (Upload multiple images or paste URLs)</label>
            {/* Toggle between Upload and URL */}
            <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.25rem', padding: '0.25rem', background: '#f1f5f9', borderRadius: '10px', width: 'fit-content' }}>
              <button
                type="button"
                onClick={() => setImageUploadMode('file')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.5rem 1.25rem',
                  border: 'none',
                  background: imageUploadMode === 'file' ? 'white' : 'transparent',
                  color: imageUploadMode === 'file' ? '#0f172a' : '#64748b',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  boxShadow: imageUploadMode === 'file' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                <Upload size={14} /> Upload File
              </button>
              <button
                type="button"
                onClick={() => setImageUploadMode('url')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.5rem 1.25rem',
                  border: 'none',
                  background: imageUploadMode === 'url' ? 'white' : 'transparent',
                  color: imageUploadMode === 'url' ? '#0f172a' : '#64748b',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  boxShadow: imageUploadMode === 'url' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                <LinkIcon size={14} /> Paste URL
              </button>
            </div>

            {/* File Upload */}
            {imageUploadMode === 'file' && (
              <div style={{ position: 'relative', marginBottom: '1rem' }}>
                <input
                  id="vendor-product-image-upload"
                  type="file"
                  multiple
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  style={{ display: 'none' }}
                  accept="image/*"
                />
                <label
                  htmlFor="vendor-product-image-upload"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2.5rem 1.5rem',
                    border: '2px dashed #C08A74',
                    borderRadius: '12px',
                    background: 'rgba(192, 138, 116, 0.02)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(192, 138, 116, 0.06)';
                    e.currentTarget.style.borderColor = '#A36B56';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(192, 138, 116, 0.02)';
                    e.currentTarget.style.borderColor = '#C08A74';
                  }}
                >
                  <Upload size={28} style={{ color: '#C08A74', marginBottom: '0.75rem' }} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>
                    {uploadingImage ? 'Uploading assets...' : 'Drag & drop files or click to browse'}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>
                    Supports PNG, JPG, JPEG, WEBP files
                  </span>
                </label>
              </div>
            )}

            {/* URL Input */}
            {imageUploadMode === 'url' && (
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="form-input"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!imageUrl.trim()) {
                      toast.error('Please enter a valid URL');
                      return;
                    }
                    try {
                      new URL(imageUrl); // Validate URL
                      setForm({ ...form, images: [...form.images, imageUrl] });
                      setImageUrl('');
                      toast.success('Image URL added');
                    } catch {
                      toast.error('Please enter a valid image URL');
                    }
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#C08A74',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#A36B56';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#C08A74';
                  }}
                >
                  Add
                </button>
              </div>
            )}

            <div className="image-preview-grid">
              {form.images.map((img, index) => (
                <div key={index} className="image-preview">
                  <img src={img} alt={`Preview ${index + 1}`} onError={(e) => e.target.src = 'https://placehold.co/90?text=Invalid'} />
                  <button type="button" onClick={() => removeImage(index)} className="image-remove-btn"><X size={14} /></button>
                </div>
              ))}
            </div>
          </div>

          {/* Virtual Try-On Image Field */}
          <div className="form-group" style={{ marginTop: '1.5rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
            <label style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Camera size={18} style={{ color: '#C08A74' }} /> Virtual Try-On Image (Front-Facing Overlay)
            </label>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0.4rem 0 0.75rem 0', lineHeight: '1.4' }}>
              Upload a straight-on, front-facing photo of this garment against a plain background. Center the item fully in frame, no folds or wrinkles, arms/sleeves laid flat if applicable.
            </p>
            {form.tryOnImage ? (
              <div style={{ position: 'relative', width: '130px', height: '150px', borderRadius: '10px', overflow: 'hidden', border: '2px solid #C08A74', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={form.tryOnImage} alt="Try On Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, tryOnImage: '' }))}
                  style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  title="Remove Try-On Image"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem', background: '#C08A74', color: 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                  <Upload size={16} /> {uploadingTryOn ? 'Uploading...' : 'Upload Try-On Photo'}
                  <input type="file" accept="image/*" onChange={handleTryOnImageUpload} disabled={uploadingTryOn} style={{ display: 'none' }} />
                </label>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>or paste URL:</span>
                <input
                  type="url"
                  placeholder="https://..."
                  value={form.tryOnImage || ''}
                  onChange={(e) => setForm((f) => ({ ...f, tryOnImage: e.target.value }))}
                  style={{ flex: 1, minWidth: '220px', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' }}
                />
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="form-row">
            <div className="form-group">
              <label>Product Name *</label>
              <input type="text" className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Brand</label>
              <select className="form-select" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })}>
                <option value="">Select a brand…</option>
                {brandOptions.map((b) => <option key={b._id} value={b.name}>{b.name}</option>)}
              </select>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                Don't see your brand? Ask an admin to add it.
              </p>
            </div>
          </div>

          {/* Marketplace Category */}
          <div className="form-row">
            <div className="form-group" style={{ width: '100%' }}>
              <label>Category *</label>
              <select
                className="form-select"
                value={form.category || ''}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                required
              >
                <option value="">Select a category…</option>
                {categoryTree.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '-0.5rem', marginBottom: '1.25rem' }}>
            Categories are managed by the platform admin or through your catalogue tab.
          </p>

          <div className="form-group">
            <label>Description *</label>
            <textarea className="form-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows="4" required />
          </div>

          {/* Pricing */}
          <div style={{ marginBottom: '1.5rem', padding: '1.25rem', background: '#fafafa', border: '1px solid #e0d5ce', borderRadius: '0.5rem' }}>
            <h4 style={{ marginBottom: '1rem', fontSize: '1rem', color: '#2d2d2d' }}>Pricing & Tax Config</h4>
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="radio" name="pricingType" checked={form.taxConfig.isInclusive} onChange={() => setForm({ ...form, taxConfig: { ...form.taxConfig, isInclusive: true } })} />
                <span style={{ fontWeight: 600 }}>GST Inclusive (Customer Price)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="radio" name="pricingType" checked={!form.taxConfig.isInclusive} onChange={() => setForm({ ...form, taxConfig: { ...form.taxConfig, isInclusive: false } })} />
                <span style={{ fontWeight: 600 }}>Manual Entry (Base + Tax)</span>
              </label>
            </div>

            {form.taxConfig.isInclusive ? (
              <div className="form-row">
                <div className="form-group">
                  <label>Final Price (Includes GST) *</label>
                  <input type="number" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: e.target.value })} className="form-input" placeholder="999" required />
                </div>
                <div className="form-group">
                  <label>Discount (%)</label>
                  <input type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} className="form-input" placeholder="0" />
                </div>
              </div>
            ) : (
              <div className="form-row" style={{ flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: '1 1 45%' }}>
                  <label>Base Price (Before Tax) *</label>
                  <input type="number" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: e.target.value })} className="form-input" placeholder="e.g. 800" required />
                </div>
                <div className="form-group" style={{ flex: '1 1 20%' }}>
                  <label>CGST (%)</label>
                  <input type="number" value={form.taxConfig.cgstPercent} onChange={(e) => setForm({ ...form, taxConfig: { ...form.taxConfig, cgstPercent: Number(e.target.value) } })} className="form-input" />
                </div>
                <div className="form-group" style={{ flex: '1 1 20%' }}>
                  <label>SGST (%)</label>
                  <input type="number" value={form.taxConfig.sgstPercent} onChange={(e) => setForm({ ...form, taxConfig: { ...form.taxConfig, sgstPercent: Number(e.target.value) } })} className="form-input" />
                </div>
                <div className="form-group" style={{ flex: '1 1 45%' }}>
                  <label>Additional Charges (Optional)</label>
                  <input type="number" value={form.taxConfig.additionalCharges} onChange={(e) => setForm({ ...form, taxConfig: { ...form.taxConfig, additionalCharges: Number(e.target.value) } })} className="form-input" placeholder="0" />
                </div>
                <div className="form-group" style={{ flex: '1 1 45%' }}>
                  <label>Discount (%)</label>
                  <input type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} className="form-input" placeholder="0" />
                </div>
              </div>
            )}
          </div>

          {/* Categories */}
          <div className="form-row">
            <div className="form-group">
              <label>Gender *</label>
              <select className="form-select" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option value="men">Men</option>
                <option value="women">Women</option>
                <option value="unisex">Unisex</option>
              </select>
            </div>
            <div className="form-group">
              <label>Sub Gender</label>
              <select className="form-select" value={form.subGender} onChange={(e) => setForm({ ...form, subGender: e.target.value })}>
                <option value="none">None</option>
                <option value="boys">Boys</option>
                <option value="girls">Girls</option>
              </select>
            </div>
            <div className="form-group">
              <label>Type *</label>
              <select className="form-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {typeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Tags (comma separated)</label>
              <input type="text" className="form-input" value={form.tags.join(', ')} onChange={(e) => setForm({ ...form, tags: e.target.value.split(',').map((t) => t.trim()).filter((t) => t) })} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} /> Featured Product
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.isTrending} onChange={(e) => setForm({ ...form, isTrending: e.target.checked })} /> Trending Product
            </label>
          </div>

          {/* Return Policy */}
          <div style={{ marginBottom: '2rem', padding: '1.25rem', background: '#f9f9f9', border: '1px solid #e0d5ce', borderRadius: '0.5rem' }}>
            <h4 style={{ marginBottom: '1rem', fontSize: '1rem', color: '#2d2d2d' }}>Return Policy</h4>
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="radio" name="returnPolicy" checked={form.isReturnable} onChange={() => setForm({ ...form, isReturnable: true, returnWindow: form.returnWindow || 14 })} />
                <span style={{ fontWeight: 600, color: '#16a34a' }}>✓ Returnable</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="radio" name="returnPolicy" checked={!form.isReturnable} onChange={() => setForm({ ...form, isReturnable: false, returnWindow: 0 })} />
                <span style={{ fontWeight: 600, color: '#dc2626' }}>✕ Non-Returnable</span>
              </label>
              {form.isReturnable && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>Return Window:</label>
                  <input type="number" value={form.returnWindow} onChange={(e) => setForm({ ...form, returnWindow: Number(e.target.value) })} className="form-input" style={{ width: 80 }} min="1" max="90" />
                  <span style={{ color: '#666', fontSize: '0.9rem' }}>days</span>
                </div>
              )}
            </div>
          </div>

          {/* Variants */}
          <div style={{ marginBottom: '2rem', borderTop: '1px solid #e0d5ce', paddingTop: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', color: '#2d2d2d' }}>Variants Management</h3>

            <div style={{ background: '#f9f9f9', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '2rem' }}>
              <h4 style={{ marginBottom: '1rem', color: '#2d2d2d' }}>Add New Variants</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Sizes</label>
                  <div className="checkbox-group">
                    {sizeOptions.map((size) => (
                      <label key={size} className="checkbox-item">
                        <input type="checkbox" checked={newVariantConfig.sizes.includes(size)}
                          onChange={(e) => setNewVariantConfig({
                            ...newVariantConfig,
                            sizes: e.target.checked ? [...newVariantConfig.sizes, size] : newVariantConfig.sizes.filter((s) => s !== size),
                          })} />
                        {size}
                      </label>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <input type="text" className="form-input" value={customSizeInput} onChange={(e) => setCustomSizeInput(e.target.value)} placeholder="Custom size" style={{ flex: 1 }} />
                    <button type="button" className="btn-primary" style={{ padding: '0.65rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                      onClick={() => {
                        const s = customSizeInput.trim();
                        if (!s) return toast.error('Enter a size');
                        if (sizeOptions.includes(s)) return toast.error('Size already exists');
                        setSizeOptions([...sizeOptions, s]); setCustomSizeInput('');
                      }}>+ Add Size</button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Colors</label>
                  <div className="checkbox-group">
                    {colorOptions.map((color) => (
                      <label key={color.name} className="checkbox-item">
                        <input type="checkbox" checked={newVariantConfig.colors.includes(color.name)}
                          onChange={(e) => setNewVariantConfig({
                            ...newVariantConfig,
                            colors: e.target.checked ? [...newVariantConfig.colors, color.name] : newVariantConfig.colors.filter((c) => c !== color.name),
                          })} />
                        <span className="color-preview" style={{ backgroundColor: color.hex }}></span>
                        {color.name}
                      </label>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', alignItems: 'center' }}>
                    <input type="color" value={customColorHex} onChange={(e) => setCustomColorHex(e.target.value)} style={{ width: 40, height: 36, padding: 2, border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer' }} />
                    <input type="text" className="form-input" value={customColorInput} onChange={(e) => setCustomColorInput(e.target.value)} placeholder="Color name" style={{ flex: 1 }} />
                    <button type="button" className="btn-primary" style={{ padding: '0.65rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                      onClick={() => {
                        const c = customColorInput.trim();
                        if (!c) return toast.error('Enter a color name');
                        if (colorOptions.find((o) => o.name.toLowerCase() === c.toLowerCase())) return toast.error('Color already exists');
                        setColorOptions([...colorOptions, { name: c, hex: customColorHex }]); setCustomColorInput(''); setCustomColorHex('#000000');
                      }}>+ Add Color</button>
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Stock Quantity</label>
                  <input type="number" className="form-input" value={newVariantConfig.stock} onChange={(e) => setNewVariantConfig({ ...newVariantConfig, stock: e.target.value })} placeholder="e.g., 50" />
                </div>
                <div className="form-group">
                  <label>SKU (optional)</label>
                  <input type="text" className="form-input" value={newVariantConfig.sku} onChange={(e) => setNewVariantConfig({ ...newVariantConfig, sku: e.target.value })} placeholder="Leave empty for auto-generate" />
                </div>
              </div>

              <button type="button" onClick={addVariant} className="btn-primary" style={{ marginTop: '1rem' }}>+ Add Variants</button>
            </div>

            {form.variants.length > 0 && (
              <table className="admin-table">
                <thead><tr><th>Size</th><th>Color</th><th>Stock</th><th>SKU</th><th>Action</th></tr></thead>
                <tbody>
                  {form.variants.map((variant, index) => (
                    <tr key={index}>
                      <td>{variant.size}</td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="color-preview" style={{ backgroundColor: variant.colorHex }}></span>
                          {variant.color}
                        </span>
                      </td>
                      <td>
                        <input type="number" value={variant.stock} onChange={(e) => {
                          const newVariants = [...form.variants];
                          newVariants[index].stock = Number(e.target.value);
                          setForm({ ...form, variants: newVariants });
                        }} style={{ width: 70, padding: '0.25rem', border: '1px solid #ddd', borderRadius: 4 }} />
                      </td>
                      <td>{variant.sku}</td>
                      <td>
                        <button type="button" onClick={() => removeVariant(index)} className="btn-danger" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="form-buttons">
            <button type="submit" className="btn-submit">{isEdit ? 'Save Changes' : 'Create Product'}</button>
            <button type="button" onClick={() => navigate('/vendor/products')} className="btn-cancel">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VendorProductForm;
