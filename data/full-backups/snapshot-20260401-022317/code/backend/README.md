# Vlera Home Backend (Express + SQLite)

Ky backend eshte i ndare nga frontend-i (`vlera-frontend`) qe te mos prishet asgje nga puna aktuale.

## 1) Instalimi

```bash
cd backend
npm install
```

## 2) Konfigurimi

Krijo `.env` nga `.env.example`:

```bash
cp .env.example .env
```

Ne Windows mundesh manualisht ta kopjosh file.

## 3) Start server

```bash
npm run dev
```

Serveri hapet ne:
- `http://localhost:4000`

## 4) Endpointet kryesore

- `GET /api/health`
- `GET /api/categories`
- `POST /api/categories`
- `PUT /api/categories/:id`
- `DELETE /api/categories/:id`
- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`
- `GET /api/orders`
- `GET /api/orders/:id`
- `POST /api/orders`
- `PATCH /api/orders/:id/status`
- `GET /api/customers`
- `POST /api/uploads/image` (multipart key: `image`)
- `GET /api/slides`
- `POST /api/slides`
- `DELETE /api/slides/:id`

## 5) Shenim i rendesishem

Ky hap vetem e krijon backend + SQLite ne menyre profesionale pa prekur frontend-in.
Ne hapin tjeter e lidhim frontend-in me keto API.
