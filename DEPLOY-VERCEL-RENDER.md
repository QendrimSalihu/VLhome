# Deploy Live (Vercel + Render)

## 1) Backend live ne Render

1. Ne Render: **New +** -> **Blueprint**.
2. Zgjedh repo/projektin dhe perdor file-in `render.yaml`.
3. Kliko **Apply** dhe prit deploy.
4. Kur mbaron, kopjo URL e backend-it (aktual: `https://vlhome.onrender.com`).
5. Provoje health:
   - `https://BACKEND_URL/api/health`

## 2) Lidh frontend me backend URL

1. Hap file-in:
   - `vlera-frontend/vercel.json`
2. Sigurohu qe destinacioni eshte backend-i aktiv (aktual: `https://vlhome.onrender.com`).

Shembull:
- nga `https://RENDER_BACKEND_URL/api/$1`
- ne `https://vlhome.onrender.com/api/$1`

## 3) Frontend live ne Vercel

1. Ne Vercel: **Add New Project**.
2. Root directory: `vlera-frontend`.
3. Framework: `Other`.
4. Build Command: bosh.
5. Output Directory: bosh.
6. Deploy.

## 4) Test ne telefon

1. Hape URL e Vercel ne telefon.
2. Shto produkt nga admin.
3. Bej porosi test.
4. Verifiko ne admin qe porosia erdhi.
