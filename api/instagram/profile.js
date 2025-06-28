// api/instagram/profile.js
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const { user, token } = req.query;
  const BRIDGE_TOKEN = process.env.BRIDGE_TOKEN || 'demo';
  if (!user || token !== BRIDGE_TOKEN) {
    return res.status(400).json({ error: 'Missing user or invalid token' });
  }

  try {
    // 1) Obtenemos el HTML público de la página
    const url = `https://www.instagram.com/${user}/`;
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const html = await resp.text();

    // 2) Extraemos el JSON de __NEXT_DATA__
    const jsonText = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.+?)<\/script>/)[1];
    const data = JSON.parse(jsonText);

    // 3) Navegamos hasta los datos del usuario
    const userData = data.props.pageProps.user;
    if (!userData) throw new Error('Profile data not found');

    // 4) Enviamos la respuesta
    res.json({
      username:    userData.username,
      full_name:   userData.full_name,
      bio:         userData.biography,
      followers:   userData.edge_followed_by.count,
      following:   userData.edge_follow.count,
      posts:       userData.edge_owner_to_timeline_media.count,
      profile_pic: userData.profile_pic_url_hd
    });
  } catch (err) {
    res.status(500).json({ error: 'Error scraping Instagram', details: err.message });
  }
};
