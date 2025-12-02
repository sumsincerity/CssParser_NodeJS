const express = require('express');
const router = express.Router();
const { Source, Article } = require('../models');
const { Op } = require('sequelize');

const sequelize = Article.sequelize;
const { col, fn } = sequelize;


router.get('/sources-count', async (req, res) => {
  try {
    const counts = await Article.findAll({
      attributes: [[fn('COUNT', col('Article.id')), 'count']],
      include: [{ model: Source, attributes: ['name'] }],
      group: ['Source.name', 'Source.id'],
      raw: true
    });
    const result = counts.map(c => ({
      source: c['Source.name'],
      count: parseInt(c.count, 10)
    }));
    res.json(result);
  } catch (err) {
    console.error('sources-count error:', err);
    res.status(500).json({ error: 'Ошибка при получении данных' });
  }
});

router.get('/avg-content-length', async (req, res) => {
  try {
    const data = await Article.findAll({
      attributes: [
        [fn('AVG', fn('LENGTH', col('Article.full_content'))), 'avgLength'],
        [fn('COUNT', col('Article.id')), 'count']
      ],
      include: [{ model: Source, attributes: ['name'] }],
      where: { full_content: { [Op.not]: null } },
      group: ['Source.name', 'Source.id'],
      raw: true
    });
    const result = data
      .filter(d => d.avgLength > 0)
      .map(d => ({
        source: d['Source.name'],
        avgLength: Math.round(parseFloat(d.avgLength))
      }));
    res.json(result);
  } catch (err) {
    console.error('avg-content-length error:', err);
    res.status(500).json({ error: 'Ошибка в avg-content-length' });
  }
});

router.get('/publications-daily', async (req, res) => {
  try {
    const data = await Article.findAll({
      attributes: [
        [fn('DATE', col('Article.fetched_at')), 'day'],
        [fn('COUNT', col('Article.id')), 'count']
      ],
      where: {
        fetched_at: { [Op.gte]: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }
      },
      group: [fn('DATE', col('Article.fetched_at'))],
      order: [[fn('DATE', col('Article.fetched_at')), 'ASC']],
      raw: true
    });
    const result = data.map(d => ({
      day: d.day,
      count: parseInt(d.count, 10)
    }));
    res.json(result);
  } catch (err) {
    console.error('publications-daily error:', err);
    res.status(500).json({ error: 'Ошибка в publications-daily' });
  }
});


router.get('/publications-by-weekday', async (req, res) => {
  try {
    const data = await Article.findAll({
      attributes: [
        [fn('EXTRACT', fn('DOW FROM', col('Article.fetched_at'))), 'dow'],
        [fn('COUNT', col('Article.id')), 'count']
      ],
      group: [fn('EXTRACT', fn('DOW FROM', col('Article.fetched_at')))],
      order: [[fn('EXTRACT', fn('DOW FROM', col('Article.fetched_at'))), 'ASC']],
      raw: true
    });
    const result = Array(7).fill(0).map((_, i) => {
      const found = data.find(d => parseInt(d.dow, 10) === i);
      return { dow: i, count: found ? parseInt(found.count, 10) : 0 };
    });
    res.json(result);
  } catch (err) {
    console.error('publications-by-weekday error:', err);
    res.status(500).json({ error: 'Ошибка' });
  }
});

router.get('/unique-articles', async (req, res) => {
  try {
    const data = await Article.findAll({
      attributes: [
        [fn('COUNT', fn('DISTINCT', col('Article.link'))), 'uniqueCount']
      ],
      include: [{ model: Source, attributes: ['name'] }],
      group: ['Source.name', 'Source.id'],
      raw: true
    });

    const result = data.map(d => ({
      source: d['Source.name'],
      uniqueCount: parseInt(d.uniqueCount, 10) || 0
    }));

    res.json(result);
  } catch (err) {
    console.error('unique-articles error:', err);
    res.status(500).json({ error: 'Ошибка' });
  }
});

router.get('/top-title-words', async (req, res) => {
  try {
    const titles = await Article.findAll({
      attributes: ['title'],
      where: { title: { [Op.not]: null } },
      limit: 300,
      order: [['fetched_at', 'DESC']],
      raw: true
    });

    const words = {};
    titles.forEach(({ title }) => {
      if (!title) return;
      const cleaned = title
        .toLowerCase()
        .replace(/[^\w\sàáâäãåèéêëìíîïòóôöõùúûüýÿçñ]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 3);
      cleaned.forEach(w => {
        words[w] = (words[w] || 0) + 1;
      });
    });

    const topWords = Object.entries(words)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));
    res.json(topWords);
  } catch (err) {
    console.error('top-title-words error:', err);
    res.status(500).json({ error: 'Ошибка' });
  }
});

router.get('/content-status', async (req, res) => {
  try {
    const totalCount = await Article.count();
    const withContentCount = await Article.count({
      where: { full_content: { [Op.not]: null } }
    });
    res.json({
      withContent: withContentCount,
      withoutContent: totalCount - withContentCount
    });
  } catch (err) {
    console.error('content-status error:', err);
    res.status(500).json({ error: 'Ошибка' });
  }
});

module.exports = router;