// api/instagram/posts.js
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const { user, limit = 5, token } = req.query;
  const BRIDGE_TOKEN = process.env.BRIDGE_TOKEN || 'demo';
  const APIFY_TOKEN  = process.env.APIFY_TOKEN;
  if (!user || token !== BRIDGE_TOKEN || !APIFY_TOKEN) {
    return res.status(400).json({ error: 'Missing parameters or config' });
  }

  try {
    const url = `https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}&username=${user}&simplified=true`;
    const resp = await fetch(url);
    const data = await resp.json();
    if (!data.length) throw new Error('No data returned');
    // Los primeros datos son perfil, luego posts
    const posts = data.slice(1, Number(limit) + 1).map(item => ({
      id:          item.id,
      shortcode:   item.shortcode,
      date:        item.date,
      caption:     item.caption || '',
      likes:       item.likes,
      comments:    item.comments,
      display_url: item.imageUrl,
      is_video:    item.isVideo,
      media_url:   item.videoUrl || item.imageUrl
    }));

    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching via Apify', details: err.message });
  }
};
