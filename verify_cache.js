const https = require('https');
https.get('https://e-commerce-backend-theta-nine.vercel.app/api/v1/cms/Home', (res) => {
  console.log('--- HEADERS ---');
  Object.keys(res.headers).forEach(key => {
    console.log(`${key}: ${res.headers[key]}`);
  });
  
  let data = [];
  res.on('data', chunk => data.push(chunk));
  res.on('end', () => {
    const buffer = Buffer.concat(data);
    console.log(`\n--- SIZE ---`);
    console.log(`Total Downloaded Bytes: ${buffer.length}`);
    
    // Decompress if gzip/brotli? Node https doesn't automatically decompress unless piped through zlib.
    // If the server sends gzip, we need to decode to parse JSON.
    // However, I didn't set Accept-Encoding: gzip, so it probably sent uncompressed.
    const jsonStr = buffer.toString('utf8');
    try {
      const json = JSON.parse(jsonStr);
      if(json.data && json.data.content) {
        const contentStr = json.data.content;
        const content = JSON.parse(contentStr);
        const heroImg = content.heroImage;
        const isBase64 = heroImg && heroImg.startsWith('data:image/');
        console.log(`\n--- DATA ---`);
        console.log(`heroImage is Base64? ${isBase64}`);
        if(isBase64) {
          console.log(`heroImage string length: ${heroImg.length} characters`);
          console.log(`Prefix: ${heroImg.substring(0, 40)}...`);
        } else {
          console.log(`heroImage URL: ${heroImg}`);
        }
      }
    } catch(e) {
      console.log('Failed to parse JSON:', e.message);
    }
  });
});
