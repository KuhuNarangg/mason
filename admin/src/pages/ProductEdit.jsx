import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, Upload, Link as LinkIcon, ArrowLeft } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import '../pages/admin-pages.css';

const ProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
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
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data } = await api.get(`/products/${id}`);
      // Ensure return policy fields have defaults for older products
      const product = data.product;
      if (product.isReturnable === undefined) product.isReturnable = true;
      if (product.returnWindow === undefined) product.returnWindow = 14;
      setForm(product);
      setLoading(false);
    } catch (err) {
      toast.error('Failed to load product');
      setLoading(false);
      navigate('/products');
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

  const handleImageUrlAdd = () => {
    if (!imageUrl.trim()) {
      toast.error('Please enter an image URL');
      return;
    }
    setForm({ ...form, images: [...form.images, imageUrl] });
    setImageUrl('');
    toast.success('Image URL added');
  };

  const removeImage = (index) => {
    setForm({
      ...form,
      images: form.images.filter((_, i) => i !== index),
    });
  };

  const addVariant = () => {
    if (!form.name || !form.description || !form.originalPrice || form.images.length === 0) {
      toast.error('Please fill product name, description, price, and add images first');
      return;
    }

    if (newVariantConfig.sizes.length === 0 || newVariantConfig.colors.length === 0 || !newVariantConfig.stock) {
      toast.error('Please select sizes, colors, and enter stock');
      return;
    }

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

      await api.put(`/products/${id}`, form);
      toast.success('Product updated successfully');
      navigate('/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    }
  };

  if (loading) return <div className="admin-page-title">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <button 
          onClick={() => navigate('/products')} 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#a98478',
            fontWeight: 'bold',
            fontSize: '1rem'
          }}
        >
          <ArrowLeft size={20} /> Back to Products
        </button>
      </div>

      <div className="form-container" style={{ maxHeight: '85vh', overflowY: 'auto', marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem', color: '#2d2d2d' }}>Edit Product</h2>
        
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

            {imageUploadMode === 'file' && (
              <input
                type="file"
                multiple
                onChange={handleImageUpload}
                disabled={uploadingImage}
                accept="image/*"
                style={{ marginBottom: '1rem' }}
              />
            )}

            {imageUploadMode === 'url' && (
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Paste image URL and click Add"
                  className="form-input"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={handleImageUrlAdd}
                  className="btn-primary"
                  style={{ padding: '0.5rem 1rem' }}
                >
                  Add
                </button>
              </div>
            )}

            {/* Image Preview Grid */}
            <div className="image-preview-grid">
              {form.images.map((img, index) => (
                <div key={index} className="image-preview">
                  <img src={img} alt={`Preview ${index + 1}`} />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="image-remove-btn"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Basic Info */}
          <div className="form-row">
            <div className="form-group">
              <label>Product Name *</label>
              <input
                type="text"
                className="form-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Brand</label>
              <input
                type="text"
                className="form-input"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              className="form-textarea"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows="4"
              required
            />
          </div>

          {/* Pricing */}
          <div className="form-row">
            <div className="form-group">
              <label>Original Price *</label>
              <input
                type="number"
                className="form-input"
                value={form.originalPrice}
                onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Discount (%)</label>
              <input
                type="number"
                className="form-input"
                value={form.discount}
                onChange={(e) => setForm({ ...form, discount: e.target.value })}
                min="0"
                max="100"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="form-row">
            <div className="form-group">
              <label>Gender *</label>
              <select
                className="form-select"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              >
                <option value="men">Men</option>
                <option value="women">Women</option>
                <option value="unisex">Unisex</option>
              </select>
            </div>
            <div className="form-group">
              <label>Sub Gender</label>
              <select
                className="form-select"
                value={form.subGender}
                onChange={(e) => setForm({ ...form, subGender: e.target.value })}
              >
                <option value="none">None</option>
                <option value="boys">Boys</option>
                <option value="girls">Girls</option>
              </select>
            </div>
            <div className="form-group">
              <label>Type *</label>
              <select
                className="form-select"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {typeOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Tags & Featured */}
          <div className="form-row">
            <div className="form-group">
              <label>Tags (comma separated)</label>
              <input
                type="text"
                className="form-input"
                value={form.tags.join(', ')}
                onChange={(e) => setForm({ ...form, tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
              />
              Featured Product
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.isTrending}
                onChange={(e) => setForm({ ...form, isTrending: e.target.checked })}
              />
              Trending Product
            </label>
          </div>

          {/* Return Policy */}
          <div style={{ marginBottom: '2rem', padding: '1.25rem', background: '#f9f9f9', border: '1px solid #e0d5ce', borderRadius: '0.5rem' }}>
            <h4 style={{ marginBottom: '1rem', fontSize: '1rem', color: '#2d2d2d' }}>Return Policy</h4>
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="returnPolicyEdit"
                  checked={form.isReturnable}
                  onChange={() => setForm({ ...form, isReturnable: true, returnWindow: form.returnWindow || 14 })}
                />
                <span style={{ fontWeight: 600, color: '#16a34a' }}>✓ Returnable</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="returnPolicyEdit"
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

          {/* Variants Section */}
          <div style={{ marginBottom: '2rem', borderTop: '1px solid #e0d5ce', paddingTop: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', color: '#2d2d2d' }}>Variants Management</h3>

            {/* Add Variant Config */}
            <div style={{ background: '#f9f9f9', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '2rem' }}>
              <h4 style={{ marginBottom: '1rem', color: '#2d2d2d' }}>Add New Variants</h4>

              <div className="form-row">
                <div className="form-group">
                  <label>Sizes</label>
                  <div className="checkbox-group">
                    {sizeOptions.map(size => (
                      <label key={size} className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={newVariantConfig.sizes.includes(size)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewVariantConfig({
                                ...newVariantConfig,
                                sizes: [...newVariantConfig.sizes, size],
                              });
                            } else {
                              setNewVariantConfig({
                                ...newVariantConfig,
                                sizes: newVariantConfig.sizes.filter(s => s !== size),
                              });
                            }
                          }}
                        />
                        {size}
                      </label>
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

                <div className="form-group">
                  <label>Colors</label>
                  <div className="checkbox-group">
                    {colorOptions.map(color => (
                      <label key={color.name} className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={newVariantConfig.colors.includes(color.name)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewVariantConfig({
                                ...newVariantConfig,
                                colors: [...newVariantConfig.colors, color.name],
                              });
                            } else {
                              setNewVariantConfig({
                                ...newVariantConfig,
                                colors: newVariantConfig.colors.filter(c => c !== color.name),
                              });
                            }
                          }}
                        />
                        <span className="color-preview" style={{ backgroundColor: color.hex }}></span>
                        {color.name}
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
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Stock Quantity</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newVariantConfig.stock}
                    onChange={(e) => setNewVariantConfig({ ...newVariantConfig, stock: e.target.value })}
                    placeholder="e.g., 50"
                  />
                </div>
                <div className="form-group">
                  <label>SKU (optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newVariantConfig.sku}
                    onChange={(e) => setNewVariantConfig({ ...newVariantConfig, sku: e.target.value })}
                    placeholder="Leave empty for auto-generate"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={addVariant}
                className="btn-primary"
                style={{ marginTop: '1rem' }}
              >
                + Add Variants
              </button>
            </div>

            {/* Variants Table */}
            {form.variants.length > 0 && (
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
                        <input 
                          type="number" 
                          value={variant.stock} 
                          onChange={(e) => {
                            const newVariants = [...form.variants];
                            newVariants[index].stock = Number(e.target.value);
                            setForm({ ...form, variants: newVariants });
                          }}
                          style={{ width: '70px', padding: '0.25rem', border: '1px solid #ddd', borderRadius: '4px' }}
                        />
                      </td>
                      <td>{variant.sku}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => removeVariant(index)}
                          className="btn-danger"
                          style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Size Guide Section */}
          <div style={{ marginBottom: '2rem', borderTop: '1px solid #e0d5ce', paddingTop: '2rem' }}>
            <h3 style={{ marginBottom: '0.5rem', color: '#2d2d2d' }}>Custom Size Guide</h3>
            <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '1.5rem' }}>
              Leave empty to use the default size chart. Add custom measurements if this product has unique sizing.
            </p>

            <div style={{ background: '#f9f9f9', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
              <div className="form-row">
                <div className="form-group">
                  <label>Size</label>
                  <select
                    className="form-select"
                    id="sg-size"
                  >
                    {sizeOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Chest (cm)</label>
                  <input type="text" className="form-input" id="sg-chest" placeholder="e.g. 96" />
                </div>
                <div className="form-group">
                  <label>Waist (cm)</label>
                  <input type="text" className="form-input" id="sg-waist" placeholder="e.g. 82" />
                </div>
                <div className="form-group">
                  <label>Hip (cm)</label>
                  <input type="text" className="form-input" id="sg-hip" placeholder="e.g. 100" />
                </div>
                <div className="form-group">
                  <label>Length (cm)</label>
                  <input type="text" className="form-input" id="sg-length" placeholder="e.g. 72" />
                </div>
              </div>
              <button
                type="button"
                className="btn-primary"
                style={{ marginTop: '0.5rem' }}
                onClick={() => {
                  const size = document.getElementById('sg-size').value;
                  const chest = document.getElementById('sg-chest').value;
                  const waist = document.getElementById('sg-waist').value;
                  const hip = document.getElementById('sg-hip').value;
                  const length = document.getElementById('sg-length').value;
                  if (!chest && !waist && !hip && !length) {
                    toast.error('Please enter at least one measurement');
                    return;
                  }
                  const exists = (form.sizeGuide || []).find(g => g.size === size);
                  if (exists) {
                    toast.error(`Size ${size} already has a guide entry. Remove it first.`);
                    return;
                  }
                  setForm({ ...form, sizeGuide: [...(form.sizeGuide || []), { size, chest, waist, hip, length }] });
                  document.getElementById('sg-chest').value = '';
                  document.getElementById('sg-waist').value = '';
                  document.getElementById('sg-hip').value = '';
                  document.getElementById('sg-length').value = '';
                  toast.success(`Size guide added for ${size}`);
                }}
              >
                + Add Size Entry
              </button>
            </div>

            {(form.sizeGuide || []).length > 0 && (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Size</th>
                    <th>Chest</th>
                    <th>Waist</th>
                    <th>Hip</th>
                    <th>Length</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {form.sizeGuide.map((entry, index) => (
                    <tr key={index}>
                      <td><strong>{entry.size}</strong></td>
                      <td>{entry.chest || '–'}</td>
                      <td>{entry.waist || '–'}</td>
                      <td>{entry.hip || '–'}</td>
                      <td>{entry.length || '–'}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, sizeGuide: form.sizeGuide.filter((_, i) => i !== index) })}
                          className="btn-danger"
                          style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Form Buttons */}
          <div className="form-buttons">
            <button type="submit" className="btn-submit">Save Changes</button>
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="btn-cancel"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductEdit;
