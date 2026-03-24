# Deployment Guide - Railway + Vercel

## Architecture
- **Backend (Django)**: Railway
- **Frontend (React)**: Vercel
- **Database**: Railway PostgreSQL

---

## 1. Deploy Backend lên Railway

### Bước 1: Tạo project trên Railway
1. Truy cập https://railway.app và đăng nhập
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Chọn repo của bạn, chọn branch `deploy`
4. Cấu hình Root Directory: `backend`

### Bước 2: Thêm PostgreSQL Database
1. Trong project, click **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Railway sẽ tự động thêm `DATABASE_URL` vào environment

### Bước 3: Cấu hình Environment Variables
Trong tab **Variables** của service, thêm:

```
SECRET_KEY=<generate-a-strong-secret-key>
DEBUG=False
FRONTEND_URL=https://your-app.vercel.app
```

### Bước 4: Deploy
Railway sẽ tự động detect và deploy Django app.

**Lưu ý**: Sau khi deploy xong, copy URL của backend (vd: `https://xxx.up.railway.app`)

---

## 2. Deploy Frontend lên Vercel

### Bước 1: Tạo project trên Vercel
1. Truy cập https://vercel.com và đăng nhập
2. Click **"Add New"** → **"Project"**
3. Import repo từ GitHub, chọn branch `deploy`
4. Cấu hình:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Create React App
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

### Bước 2: Cấu hình Environment Variables
Trong Settings → Environment Variables, thêm:

```
REACT_APP_API_URL=https://your-backend.up.railway.app/api/
```

### Bước 3: Deploy
Click **"Deploy"** và chờ hoàn thành.

---

## 3. Cập nhật CORS trên Backend

Sau khi có URL của Vercel frontend, quay lại Railway:

1. Vào tab **Variables**
2. Thêm/cập nhật:
```
FRONTEND_URL=https://your-app.vercel.app
```
3. Railway sẽ tự động redeploy

---

## 4. Kiểm tra

1. Truy cập frontend URL trên Vercel
2. Thử đăng ký/đăng nhập
3. Kiểm tra API calls trong browser DevTools

---

## Environment Variables Summary

### Backend (Railway)
| Variable | Description | Example |
|----------|-------------|---------|
| `SECRET_KEY` | Django secret key | `your-super-secret-key` |
| `DEBUG` | Debug mode | `False` |
| `DATABASE_URL` | PostgreSQL URL (auto by Railway) | `postgresql://...` |
| `FRONTEND_URL` | Vercel frontend URL | `https://app.vercel.app` |

### Frontend (Vercel)
| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API URL | `https://xxx.up.railway.app/api/` |

---

## Troubleshooting

### CORS Error
- Kiểm tra `FRONTEND_URL` đã đúng chưa
- URL phải có `https://` và KHÔNG có `/` ở cuối

### Database Error
- Chạy migrations: Railway tự chạy qua Procfile
- Kiểm tra `DATABASE_URL` trong Variables

### Static Files 404
- Chạy `python manage.py collectstatic` (Railway tự làm)

### API Connection Failed
- Kiểm tra `REACT_APP_API_URL` có `/` ở cuối
- Kiểm tra backend đã deploy thành công
