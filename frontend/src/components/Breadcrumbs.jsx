import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import './Breadcrumbs.css';

const Breadcrumbs = ({ crumbs }) => {
  if (!crumbs || crumbs.length === 0) return null;

  return (
    <nav className="breadcrumbs mb-4" aria-label="breadcrumb">
      <ol className="breadcrumb-list">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li 
              key={index} 
              className={`breadcrumb-item ${isLast ? 'active' : ''}`}
              aria-current={isLast ? 'page' : undefined}
            >
              {isLast ? (
                <span className="breadcrumb-text">{crumb.name}</span>
              ) : (
                <>
                  <Link to={crumb.path} className="breadcrumb-link">
                    {crumb.name}
                  </Link>
                  <ChevronRight size={14} className="breadcrumb-separator mx-2" />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
