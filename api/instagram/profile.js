// api/instagram/profile.js
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const { user, token } = req.query;
  const BRIDGE_TOKEN = process.env.BRIDGE_TOKEN || 'demo';
  if (!user || token !== BRIDGE_TOKEN) {
    return res.status(400).json({ error: 'Missing user or invalid token' });
  }

  try {
    const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${user}`;
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
      }
    });
    const json = await resp.json();
    const profile = json.data.user;
    res.json({
      username: profile.username,
      full_name: profile.full_name,
      bio: profile.biography,
      followers: profile.edge_followed_by.count,
      following: profile.edge_follow.count,
      posts: profile.edge_owner_to_timeline_media.count,
      profile_pic: profile.profile_pic_url_hd
    });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching Instagram data', details: err.message });
  }
};
