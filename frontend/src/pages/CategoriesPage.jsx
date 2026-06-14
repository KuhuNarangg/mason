import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import './CategoriesPage.css';

const GENDER_LABELS = { men: 'Men', women: 'Women', kids: 'Kids', all: 'Everyone' };

const CategoriesPage = () => {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTree = async () => {
      try {
        const { data } = await api.get('/categories/tree');
        setTree(data.categories || []);
      } catch (err) {
        console.error('Failed to fetch categories', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTree();
  }, []);

  const categoryLink = (cat, sub) => {
    const params = new URLSearchParams();
    params.set('category', cat._id);
    if (sub) params.set('subcategory', sub._id);
    return `/category/${cat.gender || 'all'}?${params.toString()}`;
  };

  return (
    <div className="container mt-4 mb-5 fade-in">
      <div className="category-header mb-5 reveal active">
        <h1 className="category-title">Shop by Category</h1>
        <p className="text-muted mt-1">Browse all categories and subcategories</p>
      </div>

      {loading ? (
        <div className="text-center py-5 w-100">
          <div className="spinner mb-3"></div>
          <p className="text-muted">Loading categories...</p>
        </div>
      ) : tree.length === 0 ? (
        <div className="text-center py-5 w-100 reveal active">
          <h3 className="font-heading">No categories yet</h3>
          <p className="text-muted">Please check back soon.</p>
        </div>
      ) : (
        <div className="categories-grid">
          {tree.map((cat) => (
            <div key={cat._id} className="category-card reveal active">
              <Link to={categoryLink(cat)} className="category-card__header">
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} className="category-card__image" />
                ) : (
                  <div className="category-card__placeholder">{cat.name.charAt(0)}</div>
                )}
                <div className="category-card__title-wrap">
                  <h3 className="category-card__title">{cat.name}</h3>
                  {GENDER_LABELS[cat.gender] && (
                    <span className="category-card__badge">{GENDER_LABELS[cat.gender]}</span>
                  )}
                </div>
              </Link>

              {cat.subcategories?.length > 0 && (
                <ul className="category-card__subs">
                  {cat.subcategories.map((sub) => (
                    <li key={sub._id}>
                      <Link to={categoryLink(cat, sub)} className="category-card__sub-link">
                        {sub.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;
