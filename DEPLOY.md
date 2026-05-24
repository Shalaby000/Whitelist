# Deploy to AWS S3 + CloudFront
## Step-by-step guide (free tier)

---

## What you'll have at the end
A personal media site at a CloudFront URL like:
`https://d1abc2def3.cloudfront.net`

(Optional: you can attach your own domain later.)

---

## Step 1 — Create an AWS account
1. Go to https://aws.amazon.com and click **Create an AWS Account**
2. You'll need a credit card, but the free tier means you won't be charged for normal personal use
3. Complete sign-up and log in to the **AWS Console**

---

## Step 2 — Create an S3 bucket

S3 is where your 3 website files will live.

1. In the AWS Console search bar, type **S3** and open it
2. Click **Create bucket**
3. **Bucket name**: choose anything unique, e.g. `my-media-site-2024`
4. **Region**: choose one close to you (e.g. `eu-west-1` for Middle East/Europe)
5. **Block Public Access**: leave it ON (all blocked) — CloudFront will handle access
6. Click **Create bucket**

---

## Step 3 — Upload your 3 files

1. Click on your new bucket
2. Click **Upload**
3. Add these 3 files:
   - `index.html`
   - `style.css`
   - `app.js`
4. Click **Upload**

---

## Step 4 — Create a CloudFront distribution

1. In the AWS Console search bar, type **CloudFront** and open it
2. Click **Create a CloudFront distribution**
3. Fill in these settings:

   | Setting | Value |
   |---|---|
   | Origin domain | Select your S3 bucket from the dropdown |
   | Origin access | **Origin access control settings (recommended)** |
   | Create control setting | Click "Create new OAC" → accept defaults → Create |
   | Default root object | `index.html` |

4. Leave everything else as default
5. Click **Create distribution**

6. You'll see a yellow banner: **"Copy policy"** — click it, then go to your S3 bucket → **Permissions** → **Bucket policy** → paste it → Save

---

## Step 5 — Wait & visit your site

1. CloudFront takes ~5 minutes to deploy
2. Go back to CloudFront → your distribution
3. Copy the **Distribution domain name** — it looks like `d1abc2def3gh.cloudfront.net`
4. Open it in your browser — your media site is live ✓

---

## Step 6 — Re-uploading files after changes

If you ever update the site files:
1. Re-upload to S3 (same steps as Step 3)
2. In CloudFront → your distribution → **Invalidations** tab
3. Click **Create invalidation** → enter `/*` → click Create
4. Wait 1-2 minutes — changes are live

---

## About your media files

| Source | How it works |
|---|---|
| YouTube / external URLs | Just paste the link — no S3 needed |
| Local files (MP4, MP3, etc.) | Uploaded per-session (browser memory only) |
| Store files permanently | Upload them to your S3 bucket and paste the S3 URL |

### To get a permanent S3 URL for a media file:
1. Upload the file to your S3 bucket
2. CloudFront will serve it at: `https://YOUR-DOMAIN/filename.mp4`
3. Paste that URL into the site

---

## Free tier limits (more than enough for personal use)
- 100 GB data transfer / month
- 1,000,000 requests / month
- S3: 5 GB storage free for 12 months

---

## Optional: Use your own domain
1. Register a domain in **Route 53** (~$12/year) or use an existing one
2. In your CloudFront distribution → **Alternate domain names** → add your domain
3. Request a free SSL certificate via **AWS Certificate Manager**
4. Update your DNS to point to the CloudFront domain

---

That's it. Total setup time: ~15 minutes.
