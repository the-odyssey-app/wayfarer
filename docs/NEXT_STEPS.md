# Next Steps: MinIO Photo Upload Implementation

## ✅ What's Been Completed

1. **Backend Code** ✅
   - MinIO client integration in Nakama
   - `upload_photo` RPC function created
   - Railway-specific URL handling

2. **Mobile App Code** ✅
   - Photo upload function added
   - Integrated into step completion flow
   - Uses `expo-file-system` for base64 conversion

3. **Documentation** ✅
   - Railway setup guide
   - Implementation guide
   - Troubleshooting docs

---

## 🚀 Next Steps (In Order)

### Step 1: Deploy MinIO on Railway (15-20 min)

**Go to Railway Dashboard:**
1. Create new project or use existing
2. Add new service → "Empty Service"
3. Add this `Dockerfile`:
   ```dockerfile
   FROM minio/minio:latest
   EXPOSE 9000 9001
   CMD ["server", "/data", "--console-address", ":9001"]
   ```

4. **Set Environment Variables:**
   - `MINIO_ROOT_USER` = `wayfarer-minio` (or your choice)
   - `MINIO_ROOT_PASSWORD` = Generate strong password: `openssl rand -base64 32`

5. **Add Volume:**
   - Settings → Volumes → Add `/data`

6. **Get Connection Details:**
   - Note the public URL (e.g., `minio-production.up.railway.app`)
   - Note ports: 9000 (API), 9001 (Console)

7. **Access MinIO Console:**
   - Go to port 9001 URL
   - Login with `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD`
   - Create bucket: `wayfarer-photos`
   - Set bucket policy to "Public" (or custom policy for read access)

**See:** `docs/MINIO_RAILWAY_SETUP.md` for detailed instructions

---

### Step 2: Install MinIO Package in Nakama (5 min)

**If Nakama is on Railway:**
- Railway will auto-install packages from `package.json`
- Make sure `nakama-data/modules/package.json` is in your repo
- Redeploy Nakama service

**If Nakama is on VPS/Docker:**
```bash
cd wayfarer-nakama/nakama-data/modules
npm install
```

**Verify:**
- Check that `node_modules/minio` exists
- Restart Nakama

---

### Step 3: Configure Nakama Environment Variables (5 min)

Add these to your Nakama environment (Railway dashboard or VPS):

```bash
MINIO_ENDPOINT=minio-production.up.railway.app
MINIO_PORT=9000
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=wayfarer-minio  # Same as MINIO_ROOT_USER
MINIO_SECRET_KEY=your-password    # Same as MINIO_ROOT_PASSWORD
MINIO_BUCKET=wayfarer-photos
MINIO_PUBLIC_ENDPOINT=minio-production.up.railway.app
MINIO_PUBLIC_PORT=9000
```

**Where to set:**
- **Railway**: Service → Variables → Add each variable
- **VPS**: Add to `local.yml` under `runtime.env` or docker-compose `environment`

**Restart Nakama** after adding variables

---

### Step 4: Install expo-file-system in Mobile App (2 min)

```bash
cd apps/mobile
npx expo install expo-file-system
```

**Verify:**
- Check `package.json` has `expo-file-system`
- Rebuild app if needed

---

### Step 5: Test End-to-End (10 min)

1. **Start MinIO on Railway** ✅ (from Step 1)
2. **Restart Nakama** (to load new RPC and env vars)
3. **Check Nakama Logs:**
   - Look for: `"MinIO client initialized: ..."`
   - Should see connection success

4. **Test in Mobile App:**
   - Open quest detail
   - Take/select a photo
   - Complete step
   - Check for errors

5. **Verify Upload:**
   - Go to MinIO Console → `wayfarer-photos` bucket
   - Should see uploaded file: `quest_xxx/step_xxx/user_xxx_timestamp.jpg`
   - Click file → should see photo

6. **Verify Database:**
   - Check `media_submissions` table
   - Should have entry with `media_url` pointing to MinIO URL
   - URL format: `https://minio-production.up.railway.app/wayfarer-photos/...`

7. **Test Public URL:**
   - Copy URL from database
   - Open in browser
   - Should see photo

---

## 🐛 Troubleshooting

### "MinIO not configured" in logs
- ✅ Check environment variables are set
- ✅ Verify MINIO_ACCESS_KEY and MINIO_SECRET_KEY match MinIO
- ✅ Restart Nakama after setting variables

### "Upload failed" error
- ✅ Check MinIO is accessible from Nakama
- ✅ Verify bucket name matches `MINIO_BUCKET`
- ✅ Check bucket policy allows uploads
- ✅ Verify Railway service is running

### Photo URL not accessible
- ✅ Verify bucket policy is "Public" for read
- ✅ Test URL in browser directly
- ✅ Check Railway public URL is correct

### "MinIO package not available"
- ✅ Run `npm install` in modules directory
- ✅ Verify `package.json` exists
- ✅ Restart Nakama

---

## 📋 Quick Checklist

- [ ] MinIO deployed on Railway
- [ ] Bucket `wayfarer-photos` created
- [ ] Bucket policy set to public
- [ ] Environment variables set in Nakama
- [ ] MinIO package installed (`npm install`)
- [ ] Nakama restarted
- [ ] `expo-file-system` installed in mobile app
- [ ] Test photo upload works
- [ ] Photo appears in MinIO bucket
- [ ] Photo URL stored in database
- [ ] Photo URL accessible in browser

---

## 🎯 After Testing Success

Once everything works:

1. **Monitor Usage:**
   - Check Railway dashboard for MinIO usage
   - Monitor storage growth
   - Check costs

2. **Optional Enhancements:**
   - Add image compression before upload
   - Add image validation (size, format)
   - Set up CDN (Cloudflare) in front of MinIO
   - Add photo moderation (optional)

3. **Production Considerations:**
   - Set up backups for MinIO data
   - Configure custom domain for MinIO
   - Set up monitoring/alerts
   - Consider image optimization pipeline

---

## 📚 Reference Documents

- `docs/MINIO_RAILWAY_SETUP.md` - Detailed Railway setup
- `docs/MINIO_IMPLEMENTATION_GUIDE.md` - Implementation details
- `docs/PHOTO_STORAGE_OPTIONS.md` - Storage options comparison

---

## 🚀 Ready to Start?

**Begin with Step 1: Deploy MinIO on Railway**

The code is ready - you just need to:
1. Set up MinIO service
2. Configure Nakama
3. Test!

Let me know if you need help with any step! 🎉

