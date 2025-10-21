const got = require('got').default;
const yaml = require('yaml');
const fs = require('fs');
const path = require('path');
const { load } = require('cheerio');
const { URL } = require("url");


const sitesConfig = [
    {
        name: 'vittorio',
        url: "https://vittoriodublinoblog.org/",
        selectors: {
            container: "div.post-container",
            title: "h1.post-title",
            link: ".post-title a[href]",
            content: ".post-content p",
            image: "div.featured-media img",
            date: "time.updated",
            comments: "a.post-comments"
        }
    },
    {
        name: 'fanpage',
        url: "https://www.fanpage.it/",
        selectors: {
            container: ".nb",
            title: ".nb__title",
            link: "a.nb__title",
            category: ".lbl",
            image: ".nb__head-img-wrap img",
            info: ".gcrd__title"
        }
    },
    {
        name: 'ilfoglio',
        url: "https://www.ilfoglio.it/",
        selectors: {
            container: "article[data-type=\"articolo\"]",
            title: "article h2",
            link: "article h2 span a",
            overtitle: ".overtitle",
            description: "article .desc p",
            author: "span.author"
        }
    },
    {
        name: 'lastampa',
        url: "https://www.lastampa.it/",
        selectors: {
            container: "article.entry",
            title: "h2.entry__title",
            link: "h2.entry__title a",
            author: "span.entry__author",
            image: "figure.entry__media img",
            overtitle: "span.entry__overtitle"
        }
    },
    {
        name: 'editorialedomani',
        url: "https://www.editorialedomani.it/",
        selectors: {
            container: ".teaser-type-news",
            title: ".teaser-title",
            link: ".teaser-title a[href]",
            author: ".byline-name",
            image: "a.teaser-image-link",
            overtitle: ".teaser-keyword",
            description: ".teaser-text p"
        }
    }
];


const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));


function normalizeSpaces(text) {
  if (!text) return text;
  let cleaned = text.replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, ' ');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
}


function absoluteUrl(base, relative) {
    try {
        return new URL(relative, base).href;
    } catch {
        return relative;
    }
}


async function parseSite(siteConfig) {
    console.log(`Парсинг: ${siteConfig.url}`);
    try {
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0',
        };


        const response = await got(siteConfig.url, {
            headers,
            timeout: { request: 20000 },
            followRedirect: true,
        });


        const $ = load(response.body);
        const results = [];


        const containers = $(siteConfig.selectors.container);
        console.log(`Найдено контейнеров: ${containers.length} на ${siteConfig.url}`);


        containers.each((_, element) => {
            const $el = $(element);
            const item = {};


            for (const [key, selector] of Object.entries(siteConfig.selectors)) {
                if (key === 'container') continue;
                const found = $el.find(selector).first();

                if (found.length) {
                    if (selector.includes('img')) {
                        let imgUrl =
                            found.attr('src') ||
                            found.attr('data-src') ||
                            (found.attr('srcset') ? found.attr('srcset').split(' ')[0] : null);

                        if (!imgUrl && found.attr('style')) {
                            const match = found.attr('style').match(/url\(["']?(.*?)["']?\)/);
                            if (match) imgUrl = match[1];
                        }

                        item[key] = imgUrl ? absoluteUrl(siteConfig.url, imgUrl) : null;
                    } else if (selector.includes('a')) {
                        const href = found.attr('href');
                        const linkText = normalizeSpaces(found.text());
                        item[key] = href ? absoluteUrl(siteConfig.url, href) : linkText;
                    } else {
                        item[key] = normalizeSpaces(found.text());
                    }
                } else {
                    item[key] = null;
                }
            }

            results.push(item);
        });

        for (const item of results) {
            if (item.link) {
                try {
                    console.log(`Загружаю контент: ${item.link}`);
                    const articleResp = await got(item.link, {
                        headers,
                        timeout: { request: 15000 },
                        followRedirect: true,
                    });

                    const $$ = load(articleResp.body);

                    const paragraphs = $$('article p, .post-content p, .entry-content p, .content p')
                        .filter((_, el) => {
                            const parent = $$(el).parents().toArray();
                            return !parent.some(p =>
                                ['comment', 'comments', 'footer', 'nav', 'related', 'advert', 'promo', 'share']
                                    .some(bad => (($$(p).attr('class') || '').toLowerCase().includes(bad) || ($$(p).attr('id') || '').toLowerCase().includes(bad)))
                            );
                        })
                        .map((_, el) => $$(el).text().trim())
                        .get()
                        .filter(p => p.length > 0);

                    const joined = paragraphs.join('\n')
                        .replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, ' ')
                    item.fullContent = joined || null;

                    await sleep(400);
                } catch (err) {
                    console.error(`Не удалось получить контент для ${item.link}:`, err.message);
                    item.fullContent = null;
                }
            } else {
                item.fullContent = null;
            }
        }

        console.log(`Получено ${results.length} элементов с ${siteConfig.url}`);
        return results;

    } catch (error) {
        if (error.response && error.response.statusCode === 403) {
            console.error(`Ошибка 403 (Forbidden) ${siteConfig.url}. Возможно, сайт блокирует запросы.`);
        } else if (error.response && error.response.statusCode === 404) {
            console.error(`Ошибка 404 (Not Found) ${siteConfig.url}.`);
        } else if (error.code === 'TIMEOUT') {
            console.error(`Таймаут ${siteConfig.url}.`);
        } else {
            console.error(`Ошибка ${siteConfig.url}:`, error.message);
        }
        return [];
    }
}

async function runParser() {
    const dataDir = path.join(process.cwd(), 'data');

    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log(`Создана папка: ${dataDir}`);
    }

    for (const siteConfig of sitesConfig) {
        const siteResults = await parseSite(siteConfig);

        const fileName = `${siteConfig.name}.yaml`;
        const filePath = path.join(dataDir, fileName);

        const yamlString = yaml.stringify(siteResults, { lineWidth: -1 });
        fs.writeFileSync(filePath, yamlString);
        console.log(`Результаты для ${siteConfig.url} сохранены в ${filePath}`);

        await sleep(2000);
    }

    console.log('Конец парсинга');
}

runParser().catch(console.error);
