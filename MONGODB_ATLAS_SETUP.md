# MongoDB Atlas Setup Guide

## MongoDB Atlas Nedir?

MongoDB Atlas, MongoDB'nin bulut tabanlı veritabanı servisidir. Vercel gibi serverless platformlarda çalışan uygulamalar için idealdir.

## Neden MongoDB Atlas?

- ✅ **Vercel Uyumlu**: Serverless platformlarda çalışır
- ✅ **Ücretsiz Tier**: 512 MB depolama ile ücretsiz başlangıç
- ✅ **Otomatik Yedekleme**: Verileriniz güvende
- ✅ **Global Erişim**: Her yerden erişilebilir
- ✅ **Kurulum Gerektirmez**: Lokal MongoDB kurulumuna gerek yok

---

## Adım Adım Kurulum

### 1. MongoDB Atlas Hesabı Oluşturma

1. [MongoDB Atlas](https://cloud.mongodb.com) adresine gidin
2. "Try Free" butonuna tıklayın
3. Email ile kayıt olun veya Google hesabınızla giriş yapın
4. Hesabınızı doğrulayın

### 2. Cluster (Veritabanı) Oluşturma

1. "Create a Deployment" butonuna tıklayın
2. **FREE** tier'ı seçin (M0 Sandbox)
3. Cloud Provider: **AWS** seçin (önerilen)
4. Region: Size en yakın bölgeyi seçin (örn: Frankfurt, Amsterdam)
5. Cluster Name: `AssessmentSystem` (veya istediğiniz isim)
6. "Create Deployment" butonuna tıklayın

### 3. Database User (Kullanıcı) Oluşturma

1. "Security Quickstart" ekranında:
   - **Username** girin (örn: `admin`)
   - **Password** oluşturun (güçlü bir şifre, örn: `MySecurePass123!`)
   - **ÖNEMLİ**: Bu bilgileri kaydedin!
2. "Create Database User" butonuna tıklayın

### 4. IP Whitelist (Erişim İzni) Ayarlama

1. "Where would you like to connect from?" sorusunda:
   - **"My Local Environment"** seçin
2. IP Address kısmında:
   - **"Add My Current IP Address"** butonuna tıklayın
   - Ayrıca Vercel için: **"0.0.0.0/0"** ekleyin (tüm IP'lere izin)
     - Description: `Vercel Deployment`
3. "Add Entry" butonuna tıklayın
4. "Finish and Close" butonuna tıklayın

### 5. Connection String (Bağlantı Dizesi) Alma

1. Cluster'ınızın yanındaki **"Connect"** butonuna tıklayın
2. **"Connect your application"** seçeneğini seçin
3. Driver: **Node.js** seçin
4. Version: **5.5 or later** seçin
5. Connection string'i kopyalayın:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### 6. Backend .env Dosyasını Güncelleme

1. Backend klasöründeki `.env` dosyasını açın
2. `DATABASE_URL` satırını güncelleyin:
   ```env
   DATABASE_URL=mongodb+srv://admin:MySecurePass123!@cluster0.xxxxx.mongodb.net/assessment-system?retryWrites=true&w=majority
   ```

   **ÖNEMLİ**:
   - `<username>` yerine kullanıcı adınızı yazın
   - `<password>` yerine şifrenizi yazın
   - `?retryWrites=true` kısmından önce `/assessment-system` ekleyin (veritabanı adı)

**Örnek**:
```env
# Eğer username: admin, password: MyPass123
DATABASE_URL=mongodb+srv://admin:MyPass123@cluster0.abc123.mongodb.net/assessment-system?retryWrites=true&w=majority
```

---

## Connection String Formatı

```
mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority
```

**Açıklama**:
- `mongodb+srv://` - MongoDB Atlas bağlantı protokolü
- `<username>` - Database user kullanıcı adı
- `<password>` - Database user şifresi
- `<cluster-url>` - Cluster'ınızın URL'i (örn: cluster0.abc123.mongodb.net)
- `<database-name>` - Veritabanı adı (örn: assessment-system)
- `?retryWrites=true&w=majority` - Bağlantı seçenekleri

---

## Test Etme

1. Backend klasörüne gidin:
   ```bash
   cd backend
   ```

2. Uygulamayı başlatın:
   ```bash
   npm run dev
   ```

3. Konsol çıktısını kontrol edin:
   ```
   [INFO] MongoDB Connected: cluster0.xxxxx.mongodb.net
   [INFO] Database Name: assessment-system
   ```

4. Bağlantı başarılı ise MongoDB Atlas kullanıma hazır!

---

## Vercel Deployment için Ayarlar

### 1. Vercel Environment Variables

Vercel'de projenizi deploy ederken Environment Variables ekleyin:

1. Vercel Dashboard'da projenizi seçin
2. **Settings** → **Environment Variables** gidin
3. Aşağıdaki değişkenleri ekleyin:

| Name | Value |
|------|-------|
| `DATABASE_URL` | `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/assessment-system?retryWrites=true&w=majority` |
| `JWT_SECRET` | Güçlü bir secret key |
| `JWT_REFRESH_SECRET` | Güçlü bir refresh secret key |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | Frontend URL'iniz (örn: `https://your-app.vercel.app`) |

---

## Veritabanı Yönetimi

### MongoDB Compass (GUI Tool)

1. [MongoDB Compass](https://www.mongodb.com/try/download/compass) indirin
2. Connection string'inizi yapıştırın
3. Connect butonuna tıklayın
4. Veritabanınızı görsel olarak yönetin

### Atlas Web Interface

1. [MongoDB Atlas](https://cloud.mongodb.com) giriş yapın
2. **Database** → **Browse Collections** gidin
3. Collections'ları görüntüleyin ve yönetin

---

## Ücretsiz Tier Limitleri

- **Storage**: 512 MB
- **RAM**: Shared
- **Backup**: Yok (manuel export yapılabilir)
- **Connections**: 500 concurrent

Bu proje için ücretsiz tier yeterlidir.

---

## Sorun Giderme

### Hata: "MongoNetworkError: connection timed out"

**Çözüm**:
- IP Whitelist kontrolü yapın
- `0.0.0.0/0` eklenmiş mi kontrol edin

### Hata: "Authentication failed"

**Çözüm**:
- Username ve password'u kontrol edin
- Özel karakterler varsa URL encode edin (%20, %21, vb.)

### Hata: "Database name is required"

**Çözüm**:
- Connection string'de `/assessment-system` ekleyin
- Format: `...mongodb.net/assessment-system?retryWrites...`

---

## Güvenlik İpuçları

1. ✅ **Güçlü şifreler kullanın**: En az 12 karakter, büyük/küçük harf, sayı, özel karakter
2. ✅ **.env dosyasını Git'e eklemeyin**: `.gitignore`'da olduğundan emin olun
3. ✅ **Production'da farklı credentials**: Development ve production için ayrı kullanıcılar
4. ✅ **IP Whitelist**: Mümkünse `0.0.0.0/0` yerine spesifik IP'ler kullanın
5. ✅ **Read-only users**: Gerekirse sadece okuma yetkisi olan kullanıcılar oluşturun

---

## Yedekleme (Backup)

### Manuel Export

1. MongoDB Atlas Dashboard → **Database** → **Browse Collections**
2. Collection seçin → **Export** butonuna tıklayın
3. JSON veya CSV formatında indirin

### Otomatik Backup (Ücretli)

Ücretsiz tier'da otomatik backup yok. Ücretli planlara geçiş yaparak otomatik backup kullanabilirsiniz.

---

## Ek Kaynaklar

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [MongoDB Node.js Driver](https://www.mongodb.com/docs/drivers/node/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

## Özet

1. ✅ MongoDB Atlas hesabı oluştur
2. ✅ Ücretsiz cluster oluştur
3. ✅ Database user ekle
4. ✅ IP Whitelist ayarla (`0.0.0.0/0` Vercel için)
5. ✅ Connection string al
6. ✅ `.env` dosyasını güncelle
7. ✅ Test et
8. ✅ Vercel'e environment variables ekle
9. ✅ Deploy et

**MongoDB Atlas artık kullanıma hazır! 🎉**
