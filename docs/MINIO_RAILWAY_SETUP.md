# MinIO Setup on Railway

## Step 1: Deploy MinIO on Railway

### Option A: Using Railway Dashboard (Easiest)

1. **Go to Railway Dashboard**: https://railway.app
2. **Create New Project**: Click "New Project"
3. **Add Service**: Click "+ New" → "Database" → Select "MinIO"
   - OR manually: Click "+ New" → "Empty Service"
   - Then add this `Dockerfile`:

```dockerfile
FROM minio/minio:latest

EXPOSE 9000 9001

CMD ["server", "/data", "--console-address", ":9001"]
```

4. **Set Environment Variables**:
   - `MINIO_ROOT_USER` - Set a strong username (e.g., `wayfarer-minio`)
   - `MINIO_ROOT_PASSWORD` - Set a strong password (generate with `openssl rand -base64 32`)

5. **Add Volume** (for persistent storage):
   - Go to Service → Settings → Volumes
   - Add volume: `/data` (this stores MinIO data)

6. **Get Connection Details**:
   - Railway will assign a public URL
   - Note the endpoint (e.g., `minio-production.up.railway.app`)
   - Note the ports (9000 for API, 9001 for Console UI)

### Option B: Using Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Create new project
railway init

# Create MinIO service
railway add --service minio

# Set environment variables
railway variables set MINIO_ROOT_USER=wayfarer-minio
railway variables set MINIO_ROOT_PASSWORD=$(openssl rand -base64 32)

# Add volume (via dashboard or terraform)
```

### Step 2: Create Bucket

Once MinIO is running on Railway:

1. **Access MinIO Console**:
   - Go to Railway dashboard → Your MinIO service
   - Click on the public URL for port 9001
   - Login with `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD`

2. **Create Bucket**:
   - Click "Buckets" → "Create Bucket"
   - Name: `wayfarer-photos`
   - Click "Create"

3. **Set Bucket Policy** (for public access):
   - Go to Bucket → "Access Policy"
   - Select "Public" or "Custom"
   - For public access, use this policy:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {"AWS": ["*"]},
         "Action": ["s3:GetObject"],
         "Resource": ["arn:aws:s3:::wayfarer-photos/*"]
       }
     ]
   }
   ```

### Step 3: Get Railway Connection Details

From Railway dashboard, get:
- **Endpoint**: `minio-production.up.railway.app` (or your service URL)
- **Port**: Usually `9000` for API
- **Console Port**: Usually `9001` for UI
- **Access Key**: `MINIO_ROOT_USER` value
- **Secret Key**: `MINIO_ROOT_PASSWORD` value

### Step 4: Configure CORS (Optional, for direct mobile uploads)

If you want direct mobile uploads later, configure CORS:

```bash
# Using MinIO client (mc)
mc alias set railway https://minio-production.up.railway.app:9000 wayfarer-minio ${MINIO_ROOT_PASSWORD}
mc cors set download railway/wayfarer-photos
```

Or via MinIO Console:
- Go to Bucket → Settings → CORS
- Add CORS rule for your domain

---

## Step 5: Add Environment Variables to Nakama

You need to configure Nakama to connect to MinIO. Add these to your Nakama environment:

### If Nakama is on Railway:
Add these variables in Railway dashboard:
- `MINIO_ENDPOINT=minio-production.up.railway.app`
- `MINIO_PORT=9000`
- `MINIO_USE_SSL=true` (Railway uses HTTPS)
- `MINIO_ACCESS_KEY=wayfarer-minio` (your MINIO_ROOT_USER)
- `MINIO_SECRET_KEY=your-password` (your MINIO_ROOT_PASSWORD)
- `MINIO_BUCKET=wayfarer-photos`
- `MINIO_PUBLIC_ENDPOINT=minio-production.up.railway.app` (same as endpoint)
- `MINIO_PUBLIC_PORT=9000`

### If Nakama is on VPS:
Add to your `local.yml` or environment:
```yaml
runtime:
  env:
    - "MINIO_ENDPOINT=minio-production.up.railway.app"
    - "MINIO_PORT=9000"
    - "MINIO_USE_SSL=true"
    - "MINIO_ACCESS_KEY=wayfarer-minio"
    - "MINIO_SECRET_KEY=your-password"
    - "MINIO_BUCKET=wayfarer-photos"
    - "MINIO_PUBLIC_ENDPOINT=minio-production.up.railway.app"
    - "MINIO_PUBLIC_PORT=9000"
```

---

## Step 6: Public URL Configuration

For photos to be accessible, you need a public URL. Railway provides a public URL, but you might want to:

1. **Use Railway's Public URL** (Simplest):
   - Format: `https://minio-production.up.railway.app/wayfarer-photos/path/to/image.jpg`
   - Works immediately, no additional setup

2. **Use Custom Domain** (Recommended for production):
   - Add custom domain in Railway: `storage.yourdomain.com`
   - Point DNS to Railway
   - Use: `https://storage.yourdomain.com/wayfarer-photos/path/to/image.jpg`

3. **Use CDN** (Optional, for performance):
   - Point Cloudflare or similar CDN to Railway URL
   - Better performance globally

---

## Step 7: Test Connection

Once MinIO is set up, test the connection:

```bash
# Using MinIO client
mc alias set railway https://minio-production.up.railway.app wayfarer-minio ${MINIO_ROOT_PASSWORD}
mc ls railway/wayfarer-photos
```

Or use curl:
```bash
curl -I https://minio-production.up.railway.app/minio/health/live
```

---

## Railway-Specific Notes

1. **Persistent Storage**: Railway volumes persist data. Make sure volume is attached.

2. **Auto-Deploy**: Railway auto-deploys on git push if connected to repo.

3. **Health Checks**: Railway monitors port 9000. MinIO health endpoint is at `/minio/health/live`

4. **Scaling**: Railway can scale horizontally, but MinIO needs distributed mode for multi-instance.

5. **Costs**: Railway charges for compute + storage. MinIO is lightweight, so costs are minimal.

---

## Next Steps

After MinIO is set up on Railway:
1. ✅ Get connection details (endpoint, keys)
2. ✅ Create bucket (`wayfarer-photos`)
3. ✅ Set bucket policy (public read)
4. ✅ Configure Nakama environment variables
5. ✅ Implement upload RPC (see next steps)
6. ✅ Test upload functionality

---

## Troubleshooting

### MinIO not accessible
- Check Railway service is running
- Verify port mappings (9000 for API, 9001 for Console)
- Check firewall/security groups

### Connection errors from Nakama
- Verify environment variables are set correctly
- Check SSL/TLS settings (Railway uses HTTPS)
- Test connection with `mc` client

### Public URLs not working
- Verify bucket policy allows public read
- Check CORS settings if using from browser
- Ensure Railway public URL is accessible

---

## Cost Estimate (Railway)

- **MinIO Service**: ~$5-10/month (small instance)
- **Storage**: Included in Railway plan (usually 100GB+)
- **Bandwidth**: Included in Railway plan
- **Total**: ~$5-10/month for MinIO

Compare to:
- Cloudinary: $0-89/month
- AWS S3: ~$2-5/month (but more complex)

