# Vercel Deployment Guide

## Automated Assessment and Feedback System - Production Deployment

Bu döküman, projenin Vercel'e nasıl deploy edileceğini adım adım açıklar.

---

## Ön Gereksinimler

Deployment yapmadan önce aşağıdakilerin hazır olduğundan emin olun:

- ✅ MongoDB Atlas hesabı ve cluster ([MONGODB_ATLAS_SETUP.md](MONGODB_ATLAS_SETUP.md) takip edin)
- ✅ GitHub hesabı (kozoukioden)
- ✅ Vercel hesabı (ücretsiz)
- ✅ Proje GitHub'a push edilmiş

---

## GitHub Repository

**Repository URL**: https://github.com/kozoukioden/automated-assessment-system

Proje başarıyla GitHub'a push edildi.

---

## Adım 1: Vercel Hesabı Oluşturma

1. [Vercel](https://vercel.com) adresine gidin
2. **"Sign Up"** butonuna tıklayın
3. **"Continue with GitHub"** seçeneğini seçin
4. GitHub hesabınızla (kozoukioden) giriş yapın
5. Vercel'in GitHub'a erişim izni verin

---

## Adım 2: Projeyi Vercel'e Import Etme

1. Vercel Dashboard'da **"Add New..."** → **"Project"** tıklayın
2. GitHub repository listesinde **"automated-assessment-system"** bulun
3. **"Import"** butonuna tıklayın

---

## Adım 3: Project Ayarları

### Framework Preset
- **Framework Preset**: Other (veya None)

### Root Directory
- **Root Directory**: `./` (default)

### Build Settings
- **Build Command**: Boş bırakın (backend için gerekli değil)
- **Output Directory**: Boş bırakın
- **Install Command**: `cd backend && npm install`

---

## Adım 4: Environment Variables Ekleme

**ÇOK ÖNEMLİ**: Environment Variables olmadan proje çalışmaz!

Vercel'de **"Environment Variables"** bölümüne aşağıdaki değişkenleri ekleyin:

### Gerekli Environment Variables

| Variable Name | Value | Açıklama |
|---------------|-------|----------|
| `NODE_ENV` | `production` | Production ortamı |
| `DATABASE_URL` | `mongodb+srv://username:password@...` | MongoDB Atlas connection string |
| `JWT_SECRET` | `your-super-secret-jwt-key-2024` | JWT access token secret (min 32 karakter) |
| `JWT_REFRESH_SECRET` | `your-super-secret-refresh-key-2024` | JWT refresh token secret (min 32 karakter) |
| `JWT_EXPIRE` | `1h` | Access token süresi |
| `JWT_REFRESH_EXPIRE` | `7d` | Refresh token süresi |
| `BCRYPT_ROUNDS` | `10` | Password hash rounds |
| `RATE_LIMIT_WINDOW` | `15m` | Rate limit penceresi |
| `RATE_LIMIT_MAX` | `100` | Max istekler |
| `FILE_UPLOAD_MAX_SIZE` | `10485760` | Max dosya boyutu (10MB) |
| `CORS_ORIGIN` | `https://your-frontend.vercel.app` | Frontend URL (deploy sonrası) |

### DATABASE_URL Detayları

MongoDB Atlas connection string'inizi [MONGODB_ATLAS_SETUP.md](MONGODB_ATLAS_SETUP.md) dökümanından alın.

**Format**:
```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/assessment-system?retryWrites=true&w=majority
```

**Örnek**:
```
mongodb+srv://admin:MySecurePass123@cluster0.abc123.mongodb.net/assessment-system?retryWrites=true&w=majority
```

### JWT Secrets Oluşturma

Güvenli secrets oluşturmak için terminal'de:

```bash
# JWT Secret (Linux/Mac)
openssl rand -base64 32

# JWT Refresh Secret (Linux/Mac)
openssl rand -base64 32

# Windows PowerShell
-join ((65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

Veya online tool: https://generate-secret.vercel.app/32

---

## Adım 5: Deploy Butonu

1. Tüm environment variables'ları girdikten sonra
2. **"Deploy"** butonuna tıklayın
3. Deployment başlayacak (2-5 dakika sürer)

---

## Adım 6: Deployment Kontrolü

### Build Logs Kontrolü

Deployment sırasında:
1. **"Building"** aşamasını izleyin
2. Logs'da hata var mı kontrol edin
3. Yeşil ✓ işareti görene kadar bekleyin

### Common Build Errors

**Error: "Cannot find module"**
- Çözüm: package.json'da dependency eksik olabilir
- Kontrol: `npm install` çalıştı mı?

**Error: "Database connection failed"**
- Çözüm: DATABASE_URL kontrol edin
- MongoDB Atlas IP whitelist: `0.0.0.0/0` eklenmiş mi?

**Error: "JWT_SECRET is not defined"**
- Çözüm: Environment variables eksik
- Tüm variables'ları doğru girdiniz mi?

---

## Adım 7: Production URL

Deployment başarılı olduğunda:

1. Vercel size bir production URL verecek:
   ```
   https://automated-assessment-system.vercel.app
   ```
   veya
   ```
   https://automated-assessment-system-xyz123.vercel.app
   ```

2. Bu URL'e tarayıcıdan erişin
3. Health check endpoint'i test edin:
   ```
   https://your-url.vercel.app/health
   ```

**Beklenen Response**:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 123.45
}
```

---

## Adım 8: API Test

### Health Check
```bash
curl https://your-url.vercel.app/health
```

### API Endpoints
```bash
# API info
curl https://your-url.vercel.app/api

# Register (test)
curl -X POST https://your-url.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!",
    "name": "Test User",
    "role": "student"
  }'

# Login
curl -X POST https://your-url.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!"
  }'
```

---

## Adım 9: CORS Ayarları (Frontend için)

Frontend deploy ettikten sonra:

1. Vercel Dashboard → Project → Settings → Environment Variables
2. `CORS_ORIGIN` değerini güncelleyin:
   ```
   https://your-frontend-url.vercel.app
   ```
3. **"Redeploy"** yapın

---

## Adım 10: Custom Domain (İsteğe Bağlı)

Kendi domain'inizi kullanmak için:

1. Vercel Dashboard → Project → Settings → Domains
2. **"Add Domain"** tıklayın
3. Domain adınızı girin (örn: `assessment-system.com`)
4. DNS ayarlarını yapın (Vercel size gösterecek)
5. Domain doğrulaması yapın

---

## Otomatik Deployment

GitHub'a her push yaptığınızda:
- ✅ Vercel otomatik olarak yeni deployment başlatır
- ✅ Build başarılı olursa production'a alır
- ✅ Build başarısız olursa eski version'da kalır

### Branch Deployment

- `main` veya `master` branch → Production
- Diğer branch'ler → Preview deployment

---

## Environment-Specific Settings

### Development
```env
NODE_ENV=development
DATABASE_URL=mongodb://localhost:27017/assessment-system
CORS_ORIGIN=http://localhost:3000
```

### Production (Vercel)
```env
NODE_ENV=production
DATABASE_URL=mongodb+srv://...atlas.mongodb.net/...
CORS_ORIGIN=https://your-frontend.vercel.app
```

---

## Monitoring & Logs

### Vercel Dashboard

1. **Deployments**: Tüm deployment geçmişi
2. **Functions**: Serverless function logs
3. **Analytics**: Traffic, performans metrikleri
4. **Monitoring**: Error tracking

### Real-time Logs

```bash
# Vercel CLI ile logs
vercel logs https://your-url.vercel.app
```

---

## Troubleshooting

### Problem: 500 Internal Server Error

**Çözüm**:
1. Vercel Dashboard → Project → Deployments → Son deployment
2. **"Functions"** tab'ına tıklayın
3. Error logs'u kontrol edin
4. En yaygın hatalar:
   - Database connection failed → MongoDB Atlas credentials kontrol
   - Module not found → package.json dependencies kontrol
   - Environment variable undefined → Vercel env vars kontrol

### Problem: Database Connection Timeout

**Çözüm**:
1. MongoDB Atlas → Network Access
2. IP Whitelist'e `0.0.0.0/0` ekleyin
3. Connection string doğru mu kontrol edin

### Problem: CORS Error

**Çözüm**:
1. `CORS_ORIGIN` environment variable doğru mu?
2. Frontend URL ile eşleşiyor mu?
3. Redeploy yapın

### Problem: File Upload Failed

**Çözüm**:
- Vercel'de dosya upload'u `/tmp` dizinine yapılmalı
- Max file size: 50MB (hobby plan)
- Kalıcı storage için cloud storage kullanın (AWS S3, Cloudinary)

---

## Best Practices

### Security
- ✅ JWT secrets'ları güvenli ve rastgele oluşturun
- ✅ `.env` dosyasını Git'e eklemeyin
- ✅ Production'da farklı secrets kullanın
- ✅ MongoDB Atlas'ta IP whitelist kullanın

### Performance
- ✅ Database indexing yapın
- ✅ Connection pooling kullanın
- ✅ Rate limiting aktif tutun
- ✅ Logs'u düzenli takip edin

### Maintenance
- ✅ Dependencies'leri güncel tutun
- ✅ Security updates'leri uygulayın
- ✅ Database backup'larını düzenli alın
- ✅ Monitoring/alerting kurun

---

## File Upload için Cloud Storage (İsteğe Bağlı)

Vercel serverless olduğu için dosya upload'ları kalıcı değil. Audio dosyaları için cloud storage kullanın:

### Cloudinary (Önerilen)
```bash
npm install cloudinary
```

### AWS S3
```bash
npm install aws-sdk
```

### Implementation örneği `uploadMiddleware.js`'de yapılabilir.

---

## Vercel CLI Kullanımı (İsteğe Bağlı)

### CLI Install
```bash
npm install -g vercel
```

### Login
```bash
vercel login
```

### Deploy
```bash
cd automated-assessment-system
vercel
```

### Production Deploy
```bash
vercel --prod
```

---

## Deployment Checklist

Deployment yapmadan önce:

- [ ] MongoDB Atlas cluster oluşturuldu
- [ ] Database user oluşturuldu
- [ ] IP whitelist `0.0.0.0/0` eklendi
- [ ] Connection string alındı
- [ ] GitHub repository push edildi
- [ ] Vercel hesabı oluşturuldu
- [ ] Environment variables hazırlandı
- [ ] JWT secrets oluşturuldu
- [ ] Vercel'e import edildi
- [ ] Environment variables Vercel'e eklendi
- [ ] Deploy butonu tıklandı
- [ ] Deployment başarılı
- [ ] Health check endpoint test edildi
- [ ] API endpoints test edildi

---

## Sonraki Adımlar

Deployment başarılı olduktan sonra:

1. ✅ Frontend'i deploy edin (ayrı Vercel projesi)
2. ✅ CORS_ORIGIN'i frontend URL'i ile güncelleyin
3. ✅ Custom domain ekleyin (isteğe bağlı)
4. ✅ Monitoring kurun
5. ✅ Test kullanıcıları oluşturun
6. ✅ Production'da testing yapın

---

## Ek Kaynaklar

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Node.js Functions](https://vercel.com/docs/functions/serverless-functions/runtimes/node-js)
- [MongoDB Atlas with Vercel](https://www.mongodb.com/developer/products/atlas/use-atlas-on-vercel/)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)

---

## Destek

Deployment sırasında problem yaşarsanız:

1. Vercel Discord: https://vercel.com/discord
2. MongoDB Atlas Support: https://support.mongodb.com
3. Project GitHub Issues: https://github.com/kozoukioden/automated-assessment-system/issues

---

**Deployment hazır! 🚀**

**Production URL**: https://automated-assessment-system.vercel.app (veya kendi URL'iniz)
**GitHub Repo**: https://github.com/kozoukioden/automated-assessment-system
**Database**: MongoDB Atlas

Başarılar! 🎉
