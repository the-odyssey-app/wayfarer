# MinIO Implementation Guide

## ✅ Implementation Complete

### What Was Done

1. **MinIO Client Added to Nakama**
   - Added `package.json` with `minio` dependency
   - Created `getMinioClient()` helper function
   - Added `rpcUploadPhoto` RPC function

2. **Mobile App Updated**
   - Added `expo-file-system` import
   - Created `uploadPhoto()` function
   - Integrated photo upload before step completion

3. **Railway Setup Guide**
   - Created `MINIO_RAILWAY_SETUP.md` with step-by-step instructions

---

## 🚀 Next Steps

### Step 1: Deploy MinIO on Railway

Follow the guide in `MINIO_RAILWAY_SETUP.md`:

1. Create new Railway project
2. Deploy MinIO service
3. Set environment variables:
   - `MINIO_ROOT_USER`
   - `MINIO_ROOT_PASSWORD`
4. Create bucket: `wayfarer-photos`
5. Set bucket policy to public

### Step 2: Install MinIO Package in Nakama

**If Nakama is on Railway:**
- Railway will automatically install npm packages from `package.json`
- Make sure `nakama-data/modules/package.json` is deployed

**If Nakama is on VPS/Docker:**
```bash
cd wayfarer-nakama/nakama-data/modules
npm install
```

### Step 3: Configure Nakama Environment Variables

Add these to your Nakama environment (Railway or VPS):

```bash
MINIO_ENDPOINT=minio-production.up.railway.app
MINIO_PORT=9000
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=wayfarer-minio  # Your MINIO_ROOT_USER
MINIO_SECRET_KEY=your-password    # Your MINIO_ROOT_PASSWORD
MINIO_BUCKET=wayfarer-photos
MINIO_PUBLIC_ENDPOINT=minio-production.up.railway.app
MINIO_PUBLIC_PORT=9000
```

### Step 4: Install expo-file-system in Mobile App

```bash
cd apps/mobile
npx expo install expo-file-system
```

### Step 5: Test End-to-End

1. **Start MinIO on Railway** ✅
2. **Configure Nakama** ✅
3. **Restart Nakama** (to load new RPC)
4. **Test photo upload**:
   - Open quest detail
   - Take/select photo
   - Complete step
   - Verify photo appears in MinIO bucket
   - Verify photo URL is stored in database

---

## 📝 Files Modified

### Backend
- ✅ `wayfarer-nakama/nakama-data/modules/package.json` - Added minio dependency
- ✅ `wayfarer-nakama/nakama-data/modules/index.js` - Added upload_photo RPC

### Mobile
- ✅ `apps/mobile/src/screens/QuestDetailScreen.tsx` - Added photo upload integration

### Documentation
- ✅ `docs/MINIO_RAILWAY_SETUP.md` - Railway deployment guide
- ✅ `docs/MINIO_IMPLEMENTATION_GUIDE.md` - This file

---

## 🔍 Testing Checklist

### MinIO Setup
- [ ] MinIO service running on Railway
- [ ] Bucket `wayfarer-photos` created
- [ ] Bucket policy set to public read
- [ ] Can access MinIO Console UI
- [ ] Environment variables set in Railway

### Nakama Configuration
- [ ] `package.json` in modules directory
- [ ] `minio` package installed (npm install)
- [ ] Environment variables set
- [ ] Nakama restarted
- [ ] Check logs for "MinIO client initialized"

### Mobile App
- [ ] `expo-file-system` installed
- [ ] Photo picker working
- [ ] Upload function called
- [ ] Photo URL returned from RPC
- [ ] Photo URL stored in database

### End-to-End Test
- [ ] Take photo in quest step
- [ ] Complete step
- [ ] Check MinIO bucket for uploaded file
- [ ] Verify URL in `media_submissions` table
- [ ] Access photo via public URL

---

## 🐛 Troubleshooting

### "MinIO not configured" error
- Check environment variables are set
- Verify MINIO_ACCESS_KEY and MINIO_SECRET_KEY are correct
- Check Nakama logs for initialization errors

### "Upload failed" error
- Verify MinIO is accessible from Nakama
- Check bucket name matches MINIO_BUCKET
- Verify bucket policy allows uploads
- Check Railway service is running

### Photo URL not accessible
- Verify bucket policy is public read
- Check URL format (Railway URLs don't need port)
- Test URL directly in browser
- Check CORS settings if accessing from browser

### "MinIO package not available"
- Run `npm install` in `nakama-data/modules/`
- Verify `package.json` exists
- Check Nakama can load npm modules (Railway auto-installs)

---

## 📊 Expected Flow

```
1. User takes/selects photo
   ↓
2. Mobile app converts to base64
   ↓
3. Calls upload_photo RPC
   ↓
4. Nakama uploads to MinIO (Railway)
   ↓
5. MinIO returns public URL
   ↓
6. URL stored in database
   ↓
7. Step completed with photo URL
```

---

## 🎯 Success Criteria

- ✅ Photos upload successfully to MinIO
- ✅ Public URLs are accessible
- ✅ URLs are stored in database
- ✅ Photos display in app (when viewing submissions)
- ✅ No errors in Nakama logs

---

## Next: Deploy MinIO on Railway

See `MINIO_RAILWAY_SETUP.md` for detailed instructions!

