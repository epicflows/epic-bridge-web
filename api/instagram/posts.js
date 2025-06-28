// api/instagram/posts.js
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const { user, limit = 5, token } = req.query;
  const BRIDGE_TOKEN = process.env.BRIDGE_TOKEN || 'demo';
  if (!user || token !== BRIDGE_TOKEN) {
    return res.status(400).json({ error: 'Missing user or invalid token' });
  }

  try {
    // 1) Obtenemos el HTML
    const url = `https://www.instagram.com/${user}/`;
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const html = await resp.text();

    // 2) Extraemos el JSON
    const jsonText = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.+?)<\/script>/)[1];
    const data = JSON.parse(jsonText);

    // 3) Navegamos hasta las publicaciones
    const edges = data.props.pageProps.user.edge_owner_to_timeline_media.edges;

    // 4) Mapeamos las primeras `limit`
    const posts = edges.slice(0, Number(limit)).map(edge => {
      const node = edge.node;
      return {
        id:          node.id,
        shortcode:   node.shortcode,
        date:        new Date(node.taken_at_timestamp * 1000).toISOString(),
        caption:     node.edge_media_to_caption.edges[0]?.node.text || '',
        likes:       node.edge_liked_by.count,
        comments:    node.edge_media_to_comment.count,
        display_url: node.display_url,
        is_video:    node.is_video,
        media_url:   node.is_video ? node.video_url : node.display_url
      };
    });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: 'Error scraping Instagram posts', details: err.message });
  }
};
