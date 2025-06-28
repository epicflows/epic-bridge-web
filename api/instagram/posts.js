// api/instagram/posts.js
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const { user, limit = 5, token } = req.query;
  const BRIDGE_TOKEN = process.env.BRIDGE_TOKEN || 'demo';
  if (!user || token !== BRIDGE_TOKEN) {
    return res.status(400).json({ error: 'Missing user or invalid token' });
  }

  try {
    const url = `https://www.instagram.com/${user}/?__a=1&__d=dis`;
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
      }
    });
    const text = await resp.text();
    const match = text.match(/window\._sharedData = (.+);<\/script>/);
    if (!match) throw new Error('Could not extract sharedData');
    const shared = JSON.parse(match[1]);
    const edges = shared.entry_data.ProfilePage[0].graphql.user
      .edge_owner_to_timeline_media.edges
      .slice(0, Number(limit));

    const media = edges.map(edge => ({
      id: edge.node.id,
      shortcode: edge.node.shortcode,
      date: new Date(edge.node.taken_at_timestamp * 1000).toISOString(),
      caption: edge.node.edge_media_to_caption.edges[0]?.node.text || '',
      likes: edge.node.edge_liked_by.count,
      comments: edge.node.edge_media_to_comment.count,
      display_url: edge.node.display_url,
      is_video: edge.node.is_video,
      media_url: edge.node.is_video 
        ? edge.node.video_url 
        : edge.node.display_url
    }));

    res.json(media);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching Instagram posts', details: err.message });
  }
};
