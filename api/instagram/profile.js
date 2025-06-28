// api/instagram/profile.js
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const { user, token } = req.query;
  const BRIDGE_TOKEN = process.env.BRIDGE_TOKEN || 'demo';
  const APIFY_TOKEN  = process.env.APIFY_TOKEN;
  if (!user || token !== BRIDGE_TOKEN || !APIFY_TOKEN) {
    return res.status(400).json({ error: 'Missing parameters or config' });
  }

  try {
    // Llamada al Actor de Apify
    const url = `https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}&username=${user}&simplified=true`;
    const resp = await fetch(url);
    const data = await resp.json();
    if (!data.length) throw new Error('No data returned');
    const profile = data[0].profile;

    res.json({
      username:    profile.username,
      full_name:   profile.fullName,
      bio:         profile.biography,
      followers:   profile.followersCount,
      following:   profile.followingCount,
      posts:       profile.postsCount,
      profile_pic: profile.profilePicUrl
    });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching via Apify', details: err.message });
  }
};
