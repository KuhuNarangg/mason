import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Edit, Plus, X, Upload, Link as LinkIcon, Eye } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import '../pages/admin-pages.css';

const ProductsManagement = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProductStock, setSelectedProductStock] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadMode, setImageUploadMode] = useState('file');
  const [imageUrl, setImageUrl] = useState('');
  
  const [form, setForm] = useState({
    name: '',
    description: '',
    brand: '',
    gender: 'men',
    subGender: 'none',
    type: 'shirt',
    originalPrice: '',
    discount: '0',
    images: [],
    variants: [],
    tags: [],
    isFeatured: false,
    isTrending: false,
    isReturnable: true,
    returnWindow: 14,
  });

  const [newVariantConfig, setNewVariantConfig] = useState({
    sizes: [],
    colors: [],
    stock: '',
    sku: '',
  });

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

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products?limit=100');
      setProducts(data.products);
    } catch {
      toast.error('Failed to fetch products');
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
        
        const { data } = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        
        if (data.url) {
          setForm({ ...form, images: [...form.images, data.url] });
          toast.success('Image uploaded successfully');
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Image upload failed');
      }
    }
    setUploadingImage(false);
  };

  const addVariant = () => {
    // First check if product info is filled
    if (!form.name || !form.description || !form.originalPrice || form.images.length === 0) {
      toast.error('Please fill product name, description, price, and add images first');
      return;
    }

    // Then check variant config
    if (newVariantConfig.sizes.length === 0 || newVariantConfig.colors.length === 0 || !newVariantConfig.stock) {
      toast.error('Please select sizes, colors, and enter stock');
      return;
    }

    // Create all combinations of selected sizes and colors
    const variants = [];
    newVariantConfig.sizes.forEach(size => {
      newVariantConfig.colors.forEach(colorName => {
        const colorObj = colorOptions.find(c => c.name === colorName);
        variants.push({
          size,
          color: colorName,
          colorHex: colorObj?.hex || '#000000',
          stock: Number(newVariantConfig.stock),
          sku: newVariantConfig.sku || `${size}-${colorName}`.toUpperCase(),
        });
      });
    });

    setForm({
      ...form,
      variants: [...form.variants, ...variants],
    });
    setNewVariantConfig({ sizes: [], colors: [], stock: '', sku: '' });
    toast.success(`Added ${variants.length} variant(s)`);
  };

  const removeVariant = (index) => {
    setForm({
      ...form,
      variants: form.variants.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!form.name || !form.description || !form.originalPrice || form.images.length === 0) {
        toast.error('Please fill in all required fields and add at least one image');
        return;
      }
      if (form.variants.length === 0) {
        toast.error('Please add at least one variant (size/color/stock)');
        return;
      }

      await api.post('/products', form);
      toast.success('Product created');
      resetForm();
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this product?')) {
      try {
        await api.delete(`/products/${id}`);
        toast.success('Product deleted');
        fetchProducts();
      } catch {
        toast.error('Failed to delete product');
      }
    }
  };

  const handleEdit = (product) => {
    navigate(`/products/${product._id}/edit`);
  };

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      brand: '',
      gender: 'men',
      subGender: 'none',
      type: 'shirt',
      originalPrice: '',
      discount: '0',
      images: [],
      variants: [],
      tags: [],
      isFeatured: false,
      isTrending: false,
      isReturnable: true,
      returnWindow: 14,
    });
    setImageUrl('');
    setImageUploadMode('file');
    setShowForm(false);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="admin-page-title">Products Management</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={20} /> Add Product
        </button>
      </div>

      {showForm && (
        <div className="form-container" style={{ maxHeight: '85vh', overflowY: 'auto', marginBottom: '2rem' }}>
          <form onSubmit={handleSubmit}>
            {/* Images Upload */}
            <div className="form-group">
              <label>Product Images * (Upload multiple images or paste URLs)</label>
              
              {/* Toggle between Upload and URL */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #ddd' }}>
                <button
                  type="button"
                  onClick={() => setImageUploadMode('file')}
                  style={{
                    padding: '0.5rem 1rem',
                    border: 'none',
                    background: imageUploadMode === 'file' ? '#2563eb' : '#e5e7eb',
                    color: imageUploadMode === 'file' ? 'white' : '#666',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    fontWeight: imageUploadMode === 'file' ? 600 : 400,
                  }}
                >
                  <Upload size={16} style={{ display: 'inline', marginRight: '0.5rem' }} /> Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setImageUploadMode('url')}
                  style={{
                    padding: '0.5rem 1rem',
                    border: 'none',
                    background: imageUploadMode === 'url' ? '#2563eb' : '#e5e7eb',
                    color: imageUploadMode === 'url' ? 'white' : '#666',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    fontWeight: imageUploadMode === 'url' ? 600 : 400,
                  }}
                >
                  <LinkIcon size={16} style={{ display: 'inline', marginRight: '0.5rem' }} /> Paste URL
                </button>
              </div>

              {/* File Upload */}
              {imageUploadMode === 'file' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: '2px dashed #ddd', borderRadius: '0.5rem', background: '#f9fafb' }}>
                  <input
                    type="file"
                    multiple
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    style={{ flex: 1 }}
                    accept="image/*"
                  />
                  {uploadingImage && <span style={{ color: '#2563eb', fontWeight: 600 }}>Uploading...</span>}
                </div>
              )}

              {/* URL Input */}
              {imageUploadMode === 'url' && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
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
                      background: '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Add
                  </button>
                </div>
              )}

              {form.images.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Images: <strong>{form.images.length}</strong></p>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {form.images.map((img, i) => (
                      <div key={i} className="image-preview">
                        <img src={img} alt="preview" onError={(e) => e.target.src = 'https://via.placeholder.com/90?text=Invalid'} />
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, images: form.images.filter((_, idx) => idx !== i) })}
                          className="image-remove-btn"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <input
                      type="text"
                      className="form-input"
                      value={customSizeInput}
                      onChange={(e) => setCustomSizeInput(e.target.value)}
                      placeholder="Custom size (e.g. 38, Free Size)"
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ padding: '0.65rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                      onClick={() => {
                        const s = customSizeInput.trim();
                        if (!s) return toast.error('Enter a size');
                        if (sizeOptions.includes(s)) return toast.error('Size already exists');
                        setSizeOptions([...sizeOptions, s]);
                        setCustomSizeInput('');
                        toast.success(`Size "${s}" added`);
                      }}
                    >
                      + Add Size
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="form-row">
              <div className="form-group">
                <label>Product Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="form-input" placeholder="e.g., Classic T-Shirt" required />
              </div>
              <div className="form-group">
                <label>Brand</label>
                <input type="text" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="form-input" placeholder="e.g., Nike" />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label>Description *</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="form-input" rows="3" placeholder="Add product details here..." required />
            </div>

            {/* Category */}
            <div className="form-row">
              <div className="form-group">
                <label>Gender *</label>
                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="form-input">
                  <option value="men">Men</option>
                  <option value="women">Women</option>
                  <option value="kids">Kids</option>
                </select>
              </div>
              <div className="form-group">
                <label>Sub Gender</label>
                <select value={form.subGender} onChange={(e) => setForm({ ...form, subGender: e.target.value })} className="form-input">
                  <option value="none">None</option>
                  <option value="boys">Boys</option>
                  <option value="girls">Girls</option>
                  <option value="unisex">Unisex</option>
                </select>
              </div>
              <div className="form-group">
                <label>Type *</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="form-input">
                  {typeOptions.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
            </div>

            {/* Tags */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label>Tags (comma separated)</label>
              <input type="text" placeholder="casual, summer, trending, sale" value={form.tags.join(',')} onChange={(e) => setForm({ ...form, tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) })} className="form-input" />
              {form.tags.length > 0 && (
                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {form.tags.map((tag, i) => (
                    <span key={i} style={{ background: '#e0e7ff', color: '#4f46e5', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.9rem' }}>{tag}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Pricing */}
            <div className="form-row">
              <div className="form-group">
                <label>Original Price *</label>
                <input type="number" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: e.target.value })} className="form-input" placeholder="999" required />
              </div>
              <div className="form-group">
                <label>Discount (%)</label>
                <input type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} className="form-input" placeholder="0" />
              </div>
            </div>

            {/* Flags */}
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="checkbox" />
                <span style={{ fontWeight: 600 }}>Featured</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.isTrending} onChange={(e) => setForm({ ...form, isTrending: e.target.checked })} className="checkbox" />
                <span style={{ fontWeight: 600 }}>Trending</span>
              </label>
            </div>

            {/* Return Policy */}
            <div style={{ marginBottom: '1.5rem', padding: '1.25rem', background: '#fafafa', border: '1px solid #e0d5ce', borderRadius: '0.5rem' }}>
              <h4 style={{ marginBottom: '1rem', fontSize: '1rem', color: '#2d2d2d' }}>Return Policy</h4>
              <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="returnPolicy"
                    checked={form.isReturnable}
                    onChange={() => setForm({ ...form, isReturnable: true })}
                  />
                  <span style={{ fontWeight: 600, color: '#16a34a' }}>✓ Returnable</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="returnPolicy"
                    checked={!form.isReturnable}
                    onChange={() => setForm({ ...form, isReturnable: false, returnWindow: 0 })}
                  />
                  <span style={{ fontWeight: 600, color: '#dc2626' }}>✕ Non-Returnable</span>
                </label>
                {form.isReturnable && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>Return Window:</label>
                    <input
                      type="number"
                      value={form.returnWindow}
                      onChange={(e) => setForm({ ...form, returnWindow: Number(e.target.value) })}
                      className="form-input"
                      style={{ width: '80px' }}
                      min="1"
                      max="90"
                    />
                    <span style={{ color: '#666', fontSize: '0.9rem' }}>days</span>
                  </div>
                )}
              </div>
            </div>

            {/* Variants */}
            <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: '#fafafa', border: '1px solid #e0d5ce', borderRadius: '0.5rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Variants (Sizes & Colors) *</h3>
              
              {/* Select Multiple Sizes */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ marginBottom: '0.75rem' }}>Sizes *</label>
                <div className="checkbox-group">
                  {sizeOptions.map(size => (
                    <label key={size} className="checkbox-item">
                      <input type="checkbox" checked={newVariantConfig.sizes.includes(size)} onChange={(e) => {
                        if (e.target.checked) {
                          setNewVariantConfig({ ...newVariantConfig, sizes: [...newVariantConfig.sizes, size] });
                        } else {
                          setNewVariantConfig({ ...newVariantConfig, sizes: newVariantConfig.sizes.filter(s => s !== size) });
                        }
                      }} className="checkbox" />
                      <label>{size}</label>
                    </label>
                  ))}
                </div>
              </div>

              {/* Select Multiple Colors */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ marginBottom: '0.75rem' }}>Colors *</label>
                <div className="checkbox-group">
                  {colorOptions.map(color => (
                    <label key={color.name} className="checkbox-item">
                      <input type="checkbox" checked={newVariantConfig.colors.includes(color.name)} onChange={(e) => {
                        if (e.target.checked) {
                          setNewVariantConfig({ ...newVariantConfig, colors: [...newVariantConfig.colors, color.name] });
                        } else {
                          setNewVariantConfig({ ...newVariantConfig, colors: newVariantConfig.colors.filter(c => c !== color.name) });
                        }
                      }} className="checkbox" />
                      <span className="color-preview" style={{ backgroundColor: color.hex }}></span>
                      <label>{color.name}</label>
                    </label>
                  ))}
                </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={customColorHex}
                      onChange={(e) => setCustomColorHex(e.target.value)}
                      style={{ width: '40px', height: '36px', padding: '2px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={customColorInput}
                      onChange={(e) => setCustomColorInput(e.target.value)}
                      placeholder="Color name (e.g. Maroon)"
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ padding: '0.65rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                      onClick={() => {
                        const c = customColorInput.trim();
                        if (!c) return toast.error('Enter a color name');
                        if (colorOptions.find(o => o.name.toLowerCase() === c.toLowerCase())) return toast.error('Color already exists');
                        setColorOptions([...colorOptions, { name: c, hex: customColorHex }]);
                        setCustomColorInput('');
                        setCustomColorHex('#000000');
                        toast.success(`Color "${c}" added`);
                      }}
                    >
                      + Add Color
                    </button>
                  </div>
                </div>

              {/* Stock & SKU */}
              <div className="form-row">
                <div className="form-group">
                  <label>Stock per Variant *</label>
                  <input type="number" placeholder="100" value={newVariantConfig.stock} onChange={(e) => setNewVariantConfig({ ...newVariantConfig, stock: e.target.value })} className="form-input" />
                </div>
                <div className="form-group">
                  <label>SKU Prefix (Optional)</label>
                  <input type="text" placeholder="Auto-generated" value={newVariantConfig.sku} onChange={(e) => setNewVariantConfig({ ...newVariantConfig, sku: e.target.value })} className="form-input" />
                </div>
              </div>

              <button type="button" onClick={addVariant} style={{ width: '100%', padding: '0.75rem', background: '#4caf50', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600, marginBottom: '1rem' }}>
                Add Variants ({newVariantConfig.sizes.length * newVariantConfig.colors.length} combinations)
              </button>

              {/* Variants Table */}
              {form.variants.length > 0 && (
                <div style={{ marginTop: '1.5rem' }}>
                  <p style={{ fontWeight: 600, marginBottom: '1rem' }}>Added Variants: {form.variants.length}</p>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Size</th>
                        <th>Color</th>
                        <th>Stock</th>
                        <th>SKU</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.variants.map((v, i) => (
                        <tr key={i}>
                          <td>{v.size}</td>
                          <td>
                            <span className="color-preview" style={{ backgroundColor: v.colorHex }}></span>
                            {v.color}
                          </td>
                          <td>
                            <input 
                              type="number" 
                              value={v.stock} 
                              onChange={(e) => {
                                const newVariants = [...form.variants];
                                newVariants[i].stock = Number(e.target.value);
                                setForm({ ...form, variants: newVariants });
                              }}
                              style={{ width: '70px', padding: '0.25rem', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                          </td>
                          <td>{v.sku}</td>
                          <td style={{ textAlign: 'center' }}>
                            <button type="button" onClick={() => removeVariant(i)} className="btn-small btn-danger">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="form-buttons" style={{ marginTop: '1.5rem' }}>
              <button type="submit" className="btn-submit">
                Create Product
              </button>
              <button type="button" onClick={resetForm} className="btn-cancel">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products Table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Brand</th>
              <th>Category</th>
              <th>Price</th>
              <th>Discount</th>
              <th>Variants</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan="8" className="no-data">No products yet. Create one to get started!</td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p._id}>
                  <td>
                    {p.images && p.images.length > 0 ? (
                      <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                        <img
                          src={p.images[0]}
                          alt={p.name}
                          style={{
                            width: '50px',
                            height: '50px',
                            objectFit: 'cover',
                            borderRadius: '0.25rem',
                            border: '1px solid #e0d5ce',
                          }}
                          onError={(e) => e.target.src = 'https://via.placeholder.com/50?text=No+Image'}
                          title={`${p.images.length} image(s)`}
                        />
                        {p.images.length > 1 && (
                          <div style={{
                            width: '40px',
                            height: '50px',
                            background: '#f5f0ed',
                            borderRadius: '0.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            color: '#a98478',
                          }}>
                            +{p.images.length - 1}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{
                        width: '50px',
                        height: '50px',
                        background: '#f5f0ed',
                        borderRadius: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        color: '#888',
                      }}>
                        No Image
                      </div>
                    )}
                  </td>
                  <td>{p.name.substring(0, 30)}</td>
                  <td>{p.brand}</td>
                  <td>{p.gender}/{p.type}</td>
                  <td>₹{p.originalPrice}</td>
                  <td>{p.discount}%</td>
                  <td>
                    <button 
                      onClick={() => { setSelectedProductStock(p); setShowStockModal(true); }}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.4rem', 
                        background: 'none', 
                        border: 'none', 
                        color: '#2563eb', 
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        transition: 'background 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.background = '#eff6ff'}
                      onMouseOut={(e) => e.target.style.background = 'none'}
                    >
                      <Eye size={14} /> {p.variants?.length || 0} variants
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => handleEdit(p)} className="btn-small" title="Edit">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(p._id)} className="btn-small btn-danger" title="Delete">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Stock Details Modal */}
      {showStockModal && selectedProductStock && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }} onClick={() => setShowStockModal(false)}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#111827' }}>Stock Details</h3>
              <button onClick={() => setShowStockModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <p style={{ margin: 0, fontWeight: 600, color: '#374151' }}>{selectedProductStock.name}</p>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>{selectedProductStock.brand}</p>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f9fafb' }}>
                  <tr>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', textTransform: 'uppercase' }}>Size</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', textTransform: 'uppercase' }}>Color</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', textTransform: 'uppercase' }}>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedProductStock.variants.map((v, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#111827' }}>{v.size}</td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#111827' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: v.colorHex, border: '1px solid #e5e7eb' }}></div>
                          {v.color}
                        </div>
                      </td>
                      <td style={{ 
                        padding: '0.75rem', 
                        fontSize: '0.875rem', 
                        textAlign: 'right', 
                        fontWeight: v.stock <= 5 ? 700 : 500,
                        color: v.stock <= 5 ? '#ef4444' : '#111827'
                      }}>
                        {v.stock}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '1.25rem 1.5rem', backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb', textAlign: 'right' }}>
              <button 
                onClick={() => setShowStockModal(false)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsManagement;
