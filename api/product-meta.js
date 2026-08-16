module.exports = async (req, res) => {
  const slug = req.query.slug || '';
  const backendApi = 'https://e-commerce-backend-theta-nine.vercel.app/api/v1/product';
  const siteUrl = 'https://shopro-store.vercel.app';
  const defaultImage = `${siteUrl}/og-image.png`;
  const defaultTitle = 'shoPRO | Premium Modern E-Commerce Platform';
  const defaultDesc = 'Discover modern tech, accessories, and premium products built for supreme quality and effortless reliability on shoPRO.';

  let product = null;

  if (slug) {
    try {
      const apiRes = await fetch(`${backendApi}/${encodeURIComponent(slug)}`);
      if (apiRes.ok) {
        const json = await apiRes.json();
        product = json.data || null;
      }
    } catch (e) {
      console.error('Error fetching product for OG meta:', e);
    }
  }

  const title = product ? `${product.name} | shoPRO` : defaultTitle;
  const rawDesc = (product && (product.desc || product.desc_en || product.desc_ar || product.name)) || defaultDesc;
  const desc = rawDesc.length > 160 ? rawDesc.substring(0, 157) + '...' : rawDesc;
  
  let imageUrl = defaultImage;
  if (product && (product.fullImgUrl || product.imgURL)) {
    const rawImg = product.fullImgUrl || product.imgURL;
    if (rawImg.startsWith('http')) {
      imageUrl = rawImg;
    } else {
      imageUrl = `https://e-commerce-backend-theta-nine.vercel.app/uploads/${rawImg}`;
    }
  }

  const productUrl = slug ? `${siteUrl}/products/${slug}` : siteUrl;
  const price = product?.price || 0;

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(desc)}">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  
  <!-- Open Graph / Facebook / WhatsApp / LinkedIn / Telegram -->
  <meta property="og:type" content="product">
  <meta property="og:site_name" content="shoPRO">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(desc)}">
  <meta property="og:image" content="${escapeHtml(imageUrl)}">
  <meta property="og:image:secure_url" content="${escapeHtml(imageUrl)}">
  <meta property="og:image:alt" content="${escapeHtml(product?.name || 'shoPRO Product')}">
  <meta property="og:url" content="${escapeHtml(productUrl)}">
  <meta property="product:price:amount" content="${price}">
  <meta property="product:price:currency" content="EGP">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(desc)}">
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}">
  <meta name="twitter:image:alt" content="${escapeHtml(product?.name || 'shoPRO Product')}">

  <!-- Client-side Redirect for humans if loaded directly -->
  <meta http-equiv="refresh" content="0;url=${escapeHtml(productUrl)}">
  <script>window.location.replace(${JSON.stringify(productUrl)});</script>
</head>
<body style="font-family: system-ui, sans-serif; background: #020617; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; text-align: center;">
  <div style="max-width: 480px;">
    <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(product?.name || 'shoPRO')}" style="max-width: 240px; border-radius: 12px; margin-bottom: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
    <h1 style="font-size: 20px; margin: 0 0 8px;">${escapeHtml(title)}</h1>
    <p style="color: #94a3b8; font-size: 14px; margin: 0 0 16px;">${escapeHtml(desc)}</p>
    <a href="${escapeHtml(productUrl)}" style="display: inline-block; padding: 10px 20px; background: #0284c7; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">View on shoPRO</a>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(html);
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
