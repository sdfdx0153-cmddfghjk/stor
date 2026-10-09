# كيفاش تهوستي Ember Home مع PostgreSQL

## الملفات المهمة
- `dist/index.html` — الواجهة المبنية (single file)
- `server.js` — Express server (API + static files)
- `public/images/` — صور المنتجات

## خطوات التشغيل

### 1. على جهازك (للتجربة)
```bash
# حط الـ DATABASE_URL فالبيئة

# شغل السيرفر
node server.js
# → http://localhost:3000

# أول مرة: افتح المتصفح وزر الستور — المنتجات كتتحمل تلقائيا
# الأدمن: http://localhost:3000/#/admin
```

### 2. على Render.com (هوستينغ مجاني)
1. حط المشروع على GitHub
2. سجل في render.com
3. New → Web Service → اربط الريبو
4. Build Command: `npm run build`
5. Start Command: `node server.js`
6. Environment Variables:
   - `DATABASE_URL` = رابط PostgreSQL ديالك
7. Deploy!

### 3. على Railway
1. ربط GitHub
2. أضف متغير `DATABASE_URL`
3. Railway يتعرف على `server.js` تلقائيا

## كيفاش خدامة دابا
- **PC يزيد منتج** → كيتحفظ فـ PostgreSQL
- **تليفون يفتح الستور** → كيقرا من نفس PostgreSQL
- **كل جهاز كيشوف نفس المنتجات بالضبط**
- الأدمن: `#/admin` (الباسورد: 351facebook)
