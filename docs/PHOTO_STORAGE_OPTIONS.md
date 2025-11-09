# Photo Storage Options for Wayfarer

## Current State
- ✅ Using `expo-image-picker` to capture/select photos
- ✅ Photos stored as local URIs (`file://` or `content://`)
- ⚠️ Need to upload to cloud storage and get URLs
- ⚠️ Database has `media_url` and `storage_path` fields ready

## Storage Options Comparison

### 1. **AWS S3** (Recommended for Production)
**Pros:**
- Industry standard, highly reliable
- Scalable (pay for what you use)
- CDN integration via CloudFront
- Fine-grained access control (IAM)
- Lifecycle policies (auto-delete old photos)
- Good documentation and community support

**Cons:**
- Requires AWS account setup
- More complex initial setup
- Need to manage IAM policies and buckets

**Pricing:** ~$0.023/GB storage + $0.09/GB transfer (first 10TB)

**Implementation:**
- Use `expo-file-system` to read file
- Use `aws-sdk` or `@aws-sdk/client-s3` in Nakama server
- Upload from mobile → Nakama RPC → S3 → return URL
- Or: Use presigned URLs for direct mobile upload

**Best For:** Production apps with scale

---

### 2. **Cloudinary** (Recommended for MVP/Fast Setup)
**Pros:**
- ✅ **Easiest to set up** - just API key
- Automatic image optimization/resizing
- Built-in CDN
- Transformations on-the-fly (resize, crop, filters)
- Free tier: 25GB storage, 25GB bandwidth/month
- Great for MVP - can migrate later

**Cons:**
- Less control than S3
- Pricing can scale up quickly
- Vendor lock-in

**Pricing:** Free tier generous, then $89/month for 100GB

**Implementation:**
```javascript
// In Nakama RPC
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload from base64 or stream
const result = await cloudinary.uploader.upload(imageBase64, {
  folder: 'wayfarer/quest-submissions',
  resource_type: 'image'
});
```

**Best For:** MVP, rapid prototyping, apps needing image transformations

---

### 3. **Firebase Storage** (Google Cloud)
**Pros:**
- Good integration with Firebase ecosystem
- Real-time updates possible
- Free tier: 5GB storage, 1GB/day transfer
- Good security rules
- Easy CDN

**Cons:**
- Requires Firebase project
- Less flexible than S3
- Pricing can be confusing

**Pricing:** Free tier, then $0.026/GB storage + $0.12/GB transfer

**Implementation:**
- Use `firebase-admin` in Nakama
- Or use Firebase SDK directly from mobile (with security rules)

**Best For:** If already using Firebase, or want real-time features

---

### 4. **Nakama Storage** (Built-in)
**Pros:**
- ✅ No external service needed
- Already integrated
- Simple to use

**Cons:**
- ⚠️ **Not designed for large files** (photos)
- Limited storage capacity
- No CDN
- Not optimized for media
- Better for small metadata

**Best For:** Small thumbnails/metadata only, not recommended for photos

---

### 5. **Cloudflare R2** (S3-Compatible, No Egress Fees)
**Pros:**
- S3-compatible API (easy migration)
- **No egress fees** (cheaper than S3 for high traffic)
- Fast and reliable
- Good free tier

**Cons:**
- Newer service (less mature)
- Smaller ecosystem
- Less documentation

**Pricing:** $0.015/GB storage, $0.00 egress (first 10GB/month free)

**Best For:** Cost-sensitive apps with high bandwidth needs

---

### 6. **DigitalOcean Spaces** (S3-Compatible)
**Pros:**
- S3-compatible API
- Simple pricing
- Good performance
- Easy setup

**Cons:**
- Smaller ecosystem than AWS
- Less features than S3

**Pricing:** $5/month for 250GB storage + 1TB transfer

**Best For:** Simple, cost-effective S3 alternative

---

### 7. **MinIO** (Self-Hosted S3-Compatible) ⭐ Great for Self-Hosting
**Pros:**
- ✅ **100% S3-compatible API** - drop-in replacement
- ✅ **Self-hosted** - full control, no vendor lock-in
- ✅ **Free and open source** (AGPL v3)
- ✅ **Lightweight** - runs anywhere (Docker, Kubernetes, bare metal)
- ✅ **High performance** - designed for cloud-native workloads
- ✅ **No egress fees** - only server costs
- ✅ **Data sovereignty** - your data stays on your infrastructure
- ✅ **Easy to scale** - distributed mode for multiple servers
- ✅ **Can use with CloudFront/CDN** for public access

**Cons:**
- Need to manage your own infrastructure
- Need to set up backups/replication
- Need to configure CDN separately (optional)
- Responsible for security/updates

**Pricing:** $0 (just server costs)

**Server Costs:**
- Small scale: $5-10/month VPS (DigitalOcean, Linode, etc.)
- Medium scale: $20-50/month (more storage/bandwidth)
- Large scale: Multiple servers in distributed mode

**Best For:**
- Self-hosted projects
- Cost-sensitive at scale
- Data sovereignty requirements
- Already have infrastructure
- Want S3-compatibility without vendor lock-in

---

## Self-Hosted Option: MinIO Deep Dive

### Why MinIO for Wayfarer?

Since you're already self-hosting Nakama and CockroachDB, **MinIO fits perfectly** into your self-hosted stack:

```
Your Stack:
├── Nakama (self-hosted)
├── CockroachDB (self-hosted)
└── MinIO (self-hosted) ← Adds photo storage
```

### MinIO Setup Options

#### Option A: Docker Compose (Easiest)

Add to your existing `docker-compose.yml`:

```yaml
services:
  minio:
    image: minio/minio:latest
    container_name: wayfarer-minio
    ports:
      - "9000:9000"  # API
      - "9001:9001"  # Console UI
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    volumes:
      - minio-data:/data
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

volumes:
  minio-data:
```

#### Option B: Standalone Server

```bash
# Download and run
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
./minio server /data --console-address ":9001"
```

### Configuration Steps

1. **Create Bucket**
```bash
# Using MinIO client (mc)
mc alias set local http://localhost:9000 minioadmin ${MINIO_ROOT_PASSWORD}
mc mb local/wayfarer-photos
mc anonymous set public local/wayfarer-photos  # For public access
```

2. **Set Up CORS** (for direct mobile uploads)
```bash
mc cors set download local/wayfarer-photos
```

3. **Environment Variables** (in Nakama)
```bash
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=${MINIO_ROOT_PASSWORD}
MINIO_BUCKET=wayfarer-photos
MINIO_USE_SSL=false  # Set to true in production with SSL
```

### Public Access Setup

For public photo URLs, you have two options:

**Option 1: Public Bucket (Simplest)**
```bash
# Make bucket public
mc anonymous set public local/wayfarer-photos

# URLs will be: http://your-server:9000/wayfarer-photos/image.jpg
# Or with domain: https://storage.yourdomain.com/wayfarer-photos/image.jpg
```

**Option 2: Nginx Reverse Proxy + CDN**
```nginx
# nginx config
server {
    listen 80;
    server_name storage.yourdomain.com;
    
    location /photos/ {
        proxy_pass http://localhost:9000/wayfarer-photos/;
        proxy_set_header Host $host;
    }
}
```

### MinIO Implementation in Nakama

```javascript
// In nakama-data/modules/index.js

const Minio = require('minio');
const { v4: uuidv4 } = require('uuid');

// Initialize MinIO client
const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY
});

const BUCKET_NAME = process.env.MINIO_BUCKET || 'wayfarer-photos';

function rpcUploadPhoto(ctx, logger, nk, payload) {
  try {
    const userId = ctx.userId;
    if (!userId) {
      return JSON.stringify({ success: false, error: 'User not authenticated' });
    }

    const data = JSON.parse(payload);
    const { imageBase64, questId, stepId } = data;

    if (!imageBase64) {
      return JSON.stringify({ success: false, error: 'No image provided' });
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    
    // Generate unique filename
    const filename = `quest_${questId}_step_${stepId}_${userId}_${Date.now()}.jpg`;
    const objectName = `${questId}/${stepId}/${filename}`;

    // Upload to MinIO
    minioClient.putObject(
      BUCKET_NAME,
      objectName,
      imageBuffer,
      imageBuffer.length,
      {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'max-age=31536000',
      },
      (err, etag) => {
        if (err) {
          logger.error(`MinIO upload error: ${err}`);
          return JSON.stringify({ success: false, error: 'Upload failed' });
        }

        // Construct public URL
        const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
        const endpoint = process.env.MINIO_PUBLIC_ENDPOINT || process.env.MINIO_ENDPOINT;
        const port = process.env.MINIO_PUBLIC_PORT || process.env.MINIO_PORT || '9000';
        const url = `${protocol}://${endpoint}:${port}/${BUCKET_NAME}/${objectName}`;

        return JSON.stringify({
          success: true,
          url: url,
          key: objectName,
          etag: etag
        });
      }
    );
  } catch (error) {
    logger.error(`Error uploading photo: ${error}`);
    return JSON.stringify({ success: false, error: error.message });
  }
}
```

### MinIO vs Cloudinary vs S3

| Feature | MinIO | Cloudinary | AWS S3 |
|--------|-------|-----------|--------|
| **Cost** | $0 (server only) | $0-89/mo | Pay-as-you-go |
| **Setup Time** | 30 min | 15 min | 1-2 hours |
| **Self-Hosted** | ✅ Yes | ❌ No | ❌ No |
| **S3 Compatible** | ✅ 100% | ❌ No | ✅ Native |
| **Image Optimization** | ❌ Manual | ✅ Auto | ❌ Manual |
| **CDN** | ❌ Manual setup | ✅ Built-in | ✅ CloudFront |
| **Data Control** | ✅ Full | ❌ No | ⚠️ Partial |
| **Scalability** | ✅ High | ✅ High | ✅ Very High |

### MinIO Production Considerations

1. **Backups**
   - Set up regular backups to another server
   - Or use MinIO's replication to multiple servers
   - Consider versioning for important photos

2. **Security**
   - Use strong passwords
   - Enable SSL/TLS
   - Set up bucket policies
   - Use IAM for access control

3. **Performance**
   - Use SSD storage for better performance
   - Run multiple MinIO instances (distributed mode)
   - Use CDN (Cloudflare) in front for public access

4. **Monitoring**
   - MinIO has built-in Prometheus metrics
   - Set up alerts for disk space
   - Monitor access logs

### Recommended Architecture

```
Mobile App
    ↓
Nakama Server (RPC)
    ↓
MinIO Server (self-hosted)
    ↓
[Optional] Cloudflare CDN (for public access)
    ↓
End Users (viewing photos)
```

### Migration Path

If you start with Cloudinary and want to migrate to MinIO later:

1. Both use similar patterns (base64 → upload → URL)
2. Just swap the upload RPC implementation
3. Migrate existing photos using `mc mirror` or custom script
4. Update URLs in database

---

## Updated Recommendation Matrix

### For MVP (Fastest Setup)
1. **Cloudinary** - 15 min setup
2. **MinIO** - 30 min setup (if you want self-hosted)

### For Production (Self-Hosted Stack)
1. **MinIO** - Best fit for your architecture
2. **AWS S3** - If you want managed service

### For Production (Managed Service)
1. **AWS S3 + CloudFront** - Most features
2. **Cloudflare R2** - Best pricing

---

## Recommended Approach: **Cloudinary for MVP, S3 for Production**

### Phase 1: MVP (Cloudinary)
1. **Quick Setup** (15-30 minutes)
   - Sign up for Cloudinary free account
   - Get API keys
   - Add to Nakama environment variables
   - Create upload RPC in Nakama

2. **Benefits:**
   - Automatic image optimization
   - Built-in CDN
   - Free tier sufficient for testing
   - Can migrate to S3 later without changing mobile code

### Phase 2: Production (S3 + CloudFront)
1. **Migration Path**
   - Set up S3 bucket
   - Configure CloudFront CDN
   - Create upload RPC similar structure
   - Migrate existing photos (Cloudinary has migration tools)

2. **Benefits:**
   - More control
   - Better cost at scale
   - Industry standard
   - More flexible

---

## Implementation Architecture

### Option A: Server-Side Upload (Recommended)
```
Mobile App → Nakama RPC → Cloud Storage → Return URL → Store in DB
```

**Pros:**
- Server validates/processes images
- Can resize/optimize server-side
- Better security (API keys hidden)
- Can add watermarks, moderation

**Cons:**
- Uses server bandwidth
- Slightly slower (extra hop)

### Option B: Direct Upload (Presigned URLs)
```
Mobile App → Nakama RPC (get presigned URL) → Direct to Storage → Notify Nakama
```

**Pros:**
- Faster (direct upload)
- Less server bandwidth
- Better for large files

**Cons:**
- More complex
- Less control/validation
- Need to handle upload callbacks

---

## Recommended Implementation: Cloudinary Server-Side

### Step 1: Add Cloudinary to Nakama

```bash
# In wayfarer-nakama/
npm install cloudinary
```

### Step 2: Environment Variables

```bash
# Add to .env or docker-compose.yml
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Step 3: Create Upload RPC

```javascript
// In nakama-data/modules/index.js

const cloudinary = require('cloudinary').v2;

function rpcUploadPhoto(ctx, logger, nk, payload) {
  try {
    const userId = ctx.userId;
    if (!userId) {
      return JSON.stringify({ success: false, error: 'User not authenticated' });
    }

    const data = JSON.parse(payload);
    const { imageBase64, questId, stepId } = data;

    if (!imageBase64) {
      return JSON.stringify({ success: false, error: 'No image provided' });
    }

    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });

    // Upload to Cloudinary
    cloudinary.uploader.upload(
      `data:image/jpeg;base64,${imageBase64}`,
      {
        folder: 'wayfarer/quest-submissions',
        public_id: `quest_${questId}_step_${stepId}_${userId}_${Date.now()}`,
        resource_type: 'image',
        transformation: [
          { width: 1920, height: 1080, crop: 'limit' }, // Max size
          { quality: 'auto', fetch_format: 'auto' } // Auto optimize
        ]
      },
      (error, result) => {
        if (error) {
          logger.error(`Cloudinary upload error: ${error}`);
          return JSON.stringify({ success: false, error: 'Upload failed' });
        }

        return JSON.stringify({
          success: true,
          url: result.secure_url,
          publicId: result.public_id
        });
      }
    );
  } catch (error) {
    logger.error(`Error uploading photo: ${error}`);
    return JSON.stringify({ success: false, error: error.message });
  }
}
```

### Step 4: Update Mobile App

```typescript
// In QuestDetailScreen.tsx

const uploadPhoto = async (uri: string) => {
  try {
    // Convert image to base64
    const fileUri = uri;
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Upload via Nakama RPC
    const result = await callRpc('upload_photo', {
      imageBase64: base64,
      questId: quest?.id,
      stepId: selectedStep?.id,
    });

    if (result.success) {
      return result.url; // Cloudinary URL
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

// Update handleCompleteStep
const handleCompleteStep = async (step: QuestStep) => {
  let photoUrl = null;
  
  if (submissionPhoto) {
    photoUrl = await uploadPhoto(submissionPhoto);
  }

  // Then submit with photoUrl
  const result = await callRpc('complete_step', {
    questId: quest?.id,
    stepId: step.id,
    latitude: userLocation?.lat,
    longitude: userLocation?.lng,
    photoUrl: photoUrl, // Now a Cloudinary URL
    textContent: submissionText || null,
  });
  
  // ... rest of logic
};
```

---

## Alternative: S3 Implementation

### Step 1: Install AWS SDK

```bash
npm install @aws-sdk/client-s3
```

### Step 2: Create Upload RPC

```javascript
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

function rpcUploadPhoto(ctx, logger, nk, payload) {
  try {
    const userId = ctx.userId;
    const data = JSON.parse(payload);
    const { imageBase64, questId, stepId } = data;

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    const key = `quest-submissions/${questId}/${stepId}/${userId}/${uuidv4()}.jpg`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: imageBuffer,
      ContentType: 'image/jpeg',
      ACL: 'public-read', // Or use private + presigned URLs
    });

    await s3Client.send(command);

    const url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return JSON.stringify({
      success: true,
      url: url,
      key: key
    });
  } catch (error) {
    logger.error(`S3 upload error: ${error}`);
    return JSON.stringify({ success: false, error: error.message });
  }
}
```

---

## Security Considerations

1. **Image Validation**
   - Verify file type (not just extension)
   - Check file size limits
   - Scan for malware (optional)
   - Validate dimensions

2. **Access Control**
   - Use private buckets with presigned URLs for sensitive content
   - Or public buckets with CDN for public content
   - Implement rate limiting on upload endpoint

3. **Content Moderation**
   - Use AWS Rekognition or Google Cloud Vision for inappropriate content
   - Or use Cloudinary's moderation addon
   - Manual review queue for flagged content

---

## Cost Comparison (Monthly Estimates)

### For 10,000 photos/month, 2MB average:

| Service | Storage (20GB) | Bandwidth (20GB) | Total |
|---------|---------------|------------------|-------|
| Cloudinary (Free) | $0 | $0 | **$0** |
| Cloudinary (Paid) | $0 | $0 | **$89** |
| AWS S3 + CloudFront | $0.46 | $1.80 | **$2.26** |
| Cloudflare R2 | $0.30 | $0 | **$0.30** |
| DigitalOcean Spaces | $5 | $0 | **$5** |
| Firebase Storage | $0.52 | $2.40 | **$2.92** |

**For MVP:** Cloudinary free tier is best
**For Scale:** AWS S3 + CloudFront or Cloudflare R2

---

## Recommendation

**Start with Cloudinary:**
1. ✅ Fastest setup (15-30 min)
2. ✅ Free tier sufficient for testing
3. ✅ Automatic optimization
4. ✅ Easy to migrate later

**Then migrate to S3 when:**
- Exceeding Cloudinary free tier
- Need more control
. Want to reduce costs at scale

---

## Next Steps

1. **Choose Cloudinary for MVP** (recommended)
2. **Set up Cloudinary account** (5 min)
3. **Add upload RPC to Nakama** (30 min)
4. **Update mobile app** to upload before submission (30 min)
5. **Test end-to-end** (15 min)

**Total time: ~1.5 hours**

Would you like me to implement the Cloudinary integration now?

