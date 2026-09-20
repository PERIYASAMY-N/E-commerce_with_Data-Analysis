# ShopInsight API Documentation

All endpoints are prefixed with `/api`.
Authentication relies on Bearer tokens passed via the `Authorization` header.

---

## Authentication (`/auth`)

| Method | Endpoint | Description | Auth Required | Role |
|---|---|---|---|---|
| `POST` | `/auth/register` | Register a new customer | No | Any |
| `POST` | `/auth/login` | Login and receive JWT | No | Any |
| `POST` | `/auth/logout` | Clear server-side session/cookies | No | Any |
| `GET` | `/auth/me` | Get current user profile | Yes | Any |

---

## Products (`/products`)

| Method | Endpoint | Description | Auth Required | Role |
|---|---|---|---|---|
| `GET` | `/products` | Get paginated, filtered active products | No | Any |
| `GET` | `/products/admin` | Get all products including inactive | Yes | Admin |
| `GET` | `/products/:id` | Get product details by ID or Slug | No | Any |
| `POST` | `/products` | Create a new product | Yes | Admin |
| `PUT` | `/products/:id` | Update an existing product | Yes | Admin |
| `PATCH` | `/products/:id/status`| Update product active status | Yes | Admin |
| `DELETE`| `/products/:id` | Safe-delete product (fails if ordered) | Yes | Admin |

---

## Categories (`/categories`)

| Method | Endpoint | Description | Auth Required | Role |
|---|---|---|---|---|
| `GET` | `/categories` | List all categories | No | Any |
| `GET` | `/categories/:id` | Get category details | No | Any |
| `POST` | `/categories` | Create a new category | Yes | Admin |
| `PUT` | `/categories/:id` | Update an existing category | Yes | Admin |
| `PATCH` | `/categories/:id/status` | Update active status | Yes | Admin |
| `DELETE`| `/categories/:id` | Delete category (fails if has products)| Yes | Admin |

---

## Cart (`/cart`)

| Method | Endpoint | Description | Auth Required | Role |
|---|---|---|---|---|
| `GET` | `/cart` | Get current user's cart | Yes | Customer |
| `POST` | `/cart/items` | Add product to cart | Yes | Customer |
| `PATCH` | `/cart/items/:id` | Update quantity of a cart item | Yes | Customer |
| `DELETE`| `/cart/items/:id` | Remove item from cart | Yes | Customer |
| `DELETE`| `/cart` | Clear entire cart | Yes | Customer |

---

## Orders (`/orders`)

| Method | Endpoint | Description | Auth Required | Role |
|---|---|---|---|---|
| `POST` | `/orders` | Create order from cart checkout | Yes | Customer |
| `GET` | `/orders` | Get user's order history | Yes | Customer |
| `GET` | `/orders/:id` | Get specific user order details | Yes | Customer |
| `GET` | `/orders/admin/all` | List all orders across users | Yes | Admin |
| `PATCH` | `/orders/admin/:id/status`| Update order status (shipping, etc.)| Yes | Admin |

---

## Analytics (`/admin/analytics`)

*All Analytics endpoints require Auth and the `Admin` role.*

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/analytics/summary` | High-level metrics (Revenue, Total Orders, Units Sold, AOV) |
| `GET` | `/admin/analytics/sales-trend` | Time-series sales data (daily/monthly/yearly) |
| `GET` | `/admin/analytics/top-products` | Products ranked by revenue or units sold |
| `GET` | `/admin/analytics/top-categories`| Categories ranked by revenue or units sold |
| `GET` | `/admin/analytics/top-customers` | Customers ranked by total spent |
| `GET` | `/admin/analytics/product-performance`| Detailed metric breakdown per product |
| `GET` | `/admin/analytics/category-performance`| Detailed metric breakdown per category |
| `GET` | `/admin/analytics/orders-breakdown` | Orders count grouped by status |
| `GET` | `/admin/analytics/payment-summary` | Payments grouped by method and status |
