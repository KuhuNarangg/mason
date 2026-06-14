# Mason Marketplace Architecture

This document describes the multi-vendor marketplace architecture (Myntra/Amazon/Ajio style)
implemented on top of the existing Mason storefront, admin panel, and vendor portal. The
homepage UI is unchanged — all new functionality is additive.

## 1. Governance model (who can create what)

| Entity | Created/managed by | Notes |
|---|---|---|
| Category (top-level, e.g. Women, Men, Kids) | **Admin only** | `Category` doc with `parent: null` |
| Subcategory (e.g. Dresses, Tops, Ethnic Wear) | **Admin only** | `Category` doc with `parent: <parentId>` |
| Brand | **Admin only** | Vendors select from existing approved brands; new-brand requests go through support/admin |
| Product | **Vendor** (or Admin for platform-owned stock) | Must reference an existing `category` + `subcategory`; cannot create new ones |
| Vendor Store profile | **Vendor** (self-service), **Admin** (approval/suspension) | `storeSlug` auto-generated, unique |

Rationale: centralizing categories/brands prevents duplicate/fragmented taxonomy ("Ethnic Wear"
vs "Ethnicwear" vs "ethnic-wear") which is the #1 cause of broken filters and search in
marketplaces. Vendors are domain experts on *products*, not taxonomy — letting them create
categories leads to chaos at scale (this mirrors how Amazon/Myntra/Flipkart operate: sellers
pick from a fixed category tree and a brand catalog that's reviewed before listing).

## 2. MongoDB collections / schema

### `categories`
```js
{
  _id, name, slug,
  gender: 'men' | 'women' | 'kids' | 'all',
  subGender: 'boys' | 'girls' | 'unisex' | 'none',
  parent: ObjectId | null,   // null = top-level category, set = subcategory
  image, description,
  sortOrder: Number,
  isActive: Boolean,
  timestamps
}
```
- Top-level categories: `parent = null` (Women, Men, Kids, Ethnic Wear, Accessories, Footwear…)
- Subcategories: `parent = <top-level _id>` (Dresses, Tops, Trousers under Women, etc.)
- Uniqueness is enforced per-parent scope (no duplicate names at the same level).
- Deleting a category with existing subcategories is blocked.

### `brands`
```js
{ _id, name (unique), slug, logo, description, isActive, timestamps }
```

### `products`
```js
{
  _id, name, slug, description,
  brand: String,                 // must match an active Brand.name
  vendor: ObjectId -> User | null,  // null = platform-owned
  category: ObjectId -> Category,     // top-level
  subcategory: ObjectId -> Category,  // child of category
  gender, subGender, type,       // legacy/fine-grained classification, kept for back-compat
  images: [String], thumbnail,
  originalPrice, discount, price,  // price auto-computed pre-save
  taxConfig: { isInclusive, basePrice, cgstPercent, sgstPercent, additionalCharges },
  variants: [{ size, color, colorHex, stock, sku }],
  reviews: [{ user, name, rating, comment, photos, timestamps }],
  rating, numReviews,
  tags: [String], sizeGuide: [...],
  isFeatured, isTrending, isActive, isReturnable, returnWindow,
  lowStockThreshold,
  timestamps
}
```

### `users` (vendor-relevant fields)
```js
{
  _id, name, email, role: 'user' | 'admin' | 'vendor',
  vendorStatus: 'pending' | 'approved' | 'rejected',
  vendorProfile: {
    businessName,
    storeSlug (unique, auto-generated),   // public URL: /store/:storeSlug
    storeBanner,                          // image URL
    storeDescription,
    gstNumber, panNumber, address, bankDetails,
    commissionPercent, rejectionReason, approvedAt
  }
}
```

### `orders`, `cart`, `coupons`, `notifications`, `settlements`, `ads`, etc.
Unchanged — order items already carry `vendor`, `commissionAmount`, `vendorEarning`,
`itemStatus`, `payoutStatus` for per-vendor fulfilment and settlement.

## 3. API structure

### Categories — `/api/v1/categories`
| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/` | Public | List categories. `?gender=`, `?parent=root\|<id>`, `?all=1` (admin, incl. inactive) |
| GET | `/tree` | Public | Top-level categories each with `subcategories[]` — powers the Categories page |
| GET | `/:slug` | Public | Single category + its subcategories (or parent) |
| POST | `/` | Admin | Create category/subcategory (`parent` optional) |
| PUT | `/:id` | Admin | Update |
| DELETE | `/:id` | Admin | Delete (blocked if it has subcategories) |

### Brands — `/api/v1/brands`
| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/` | Public | Active brands (`?all=1` for admin = all) |
| POST/PUT/DELETE | `/`, `/:id` | Admin | Manage brand catalog |

### Products — `/api/v1/products`
| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/` | Public | List/filter products (see filter params below) |
| GET | `/filters/options` | Public | Distinct brands/colors/sizes/price-range for current scope (`gender`, `category`, `subcategory`, `type`) — drives dynamic filter sidebar |
| GET | `/slug/:slug`, `/:id` | Public | Product detail |
| GET | `/:id/related` | Public | Related products |
| POST/PUT/DELETE | `/`, `/:id` | Admin/Vendor | Manage own products |

**Filter params on `GET /products`:**
`gender, subGender, type, brand, category, subcategory, vendor, minPrice, maxPrice,
minDiscount, maxDiscount, rating, size, color, inStock, search, sort, page, limit, featured, trending`

`sort` options: `newest`, `priceLow`, `priceHigh`, `rating`, `popular`, `discount`.

### Vendor store (public) — `/api/v1/vendor/store/:slug`
Returns `{ vendor: { name, avatar, storeBanner, storeDescription, rating, totalReviews,
memberSince }, productCount, products[] }`. Supports `?sort=` and pagination. This single
endpoint backs the `/store/:vendorSlug` public page.

### Existing vendor/admin APIs (unchanged)
`/api/v1/vendor/*` (dashboard, products, inventory, orders, earnings — protected, vendor-only)
and `/api/v1/admin/*` (vendor approval, settlements, etc.).

## 4. Admin flow

1. Admin defines the category tree under **Admin → Categories**: creates top-level categories
   (Women, Men, Kids, Ethnic Wear, Accessories, Footwear, …) and, per category, adds
   subcategories (Dresses, Tops, Trousers, Sarees, Sneakers, …).
2. Admin manages the **Brand catalog** (Admin → Brands) — approves/creates brand entries that
   vendors can attach to products.
3. Admin reviews vendor signups (Admin → Vendors), approves/rejects, sets commission %.
4. Admin can still create/edit products directly (platform-owned, `vendor: null`).
5. Admin moderates listings (active/inactive), reviews, returns, settlements as before.

## 5. Vendor flow

1. Vendor registers → pending approval → admin approves → `storeSlug` is generated from
   business name (e.g. "Owl Studio" → `owl-studio`), giving a public store page at
   `/store/owl-studio`.
2. Vendor (Vendor → Profile) sets store banner image and description, shown on their public page.
3. Vendor (Vendor → Products → Add Product):
   - Picks **Category** then **Subcategory** from admin-managed dropdowns (cascading select,
     `subcategory` options load from the chosen category's `subcategories[]`).
   - Picks **Brand** from the existing brand catalog (free-text creation is not offered).
   - Fills images, variants (size/color/stock), pricing/discount/tax config.
   - Cannot submit without a valid category + subcategory → guarantees no orphaned/duplicate
     taxonomy.
4. Vendor manages inventory, orders, returns, earnings as before — all unchanged.

## 6. Customer flow

1. **Navbar → "Categories"** opens `/categories`, a grid of all top-level categories with their
   subcategories listed underneath (data from `GET /categories/tree`).
2. Clicking a category/subcategory navigates to `/category/:gender?category=<id>&subcategory=<id>`,
   which reuses the existing `CategoryPage`.
3. **Category listing page** (`/category/:gender`) now supports the full filter set:
   - Category / Subcategory (via query params, set from the Categories page)
   - Sub-type quick filters (Dress, Top, Trouser, Ethnic, Westernwear)
   - Brand (dynamic, scoped to current category via `/products/filters/options`)
   - Color (dynamic swatlet list)
   - Size (dynamic swatch buttons)
   - Price range (preset buckets)
   - Discount range (10%+ … 50%+)
   - Customer rating (4★+, 3★+, 2★+)
   - Availability ("In Stock Only")
   - Sort by: Newest, Price ↑/↓, Popularity, Rating, Discount
4. **Vendor store pages** at `/store/:vendorSlug` show the vendor's banner, avatar, name,
   aggregate rating, product count, and a paginated/sortable grid of their active products —
   reusing the existing `ProductCard`.
5. Product detail, cart, checkout, orders, wishlist — unchanged.

## 7. Frontend UI architecture (new pieces)

```
frontend/src/pages/
  CategoriesPage.jsx      — "Shop by Category" grid (GET /categories/tree)
  CategoriesPage.css
  CategoryPage.jsx         — rewritten filter sidebar (brand/color/size/discount/rating/stock)
  CategoryPage.css          — added size-swatch styles
  StorePage.jsx             — vendor public storefront (GET /vendor/store/:slug)
  StorePage.css
  vendor/VendorProductForm.jsx — added Category/Subcategory cascading selects + Brand dropdown
  admin/CategoriesManagement.jsx — parent/subcategory CRUD with indented tree table

frontend/src/components/Navbar.jsx — added "Categories" link (desktop + mobile menu)
frontend/src/App.jsx — added routes: /categories, /store/:slug
```

Homepage (`Home.jsx`) and its components are untouched, per requirements.

## 8. Data migration notes

- Existing products have `category`/`subcategory` set to `null` until backfilled. The
  `/products` endpoint still works without these fields (gender/type filters remain functional),
  so this is non-breaking.
- Recommended one-time migration: for each existing `Category` doc with a `gender`, create
  sensible top-level categories (Women/Men/Kids/Ethnic Wear/Accessories/Footwear) if they don't
  exist, create subcategories from existing `type` values (Dresses, Tops, Trousers, etc.), then
  bulk-update `Product.category`/`Product.subcategory` based on `gender`/`type` mapping.
- New products created via the vendor form are required to set `category` + `subcategory`
  going forward.
