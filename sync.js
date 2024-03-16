const express = require('express');
require('dotenv').config();
const Sync = require('@paybook/sync-js');
const multer = require('multer');
const fs = require('fs');
//import "@paybook/sync-widget/dist/widget.css";
//import SyncWidget from "@paybook/sync-widget";
const cors = require('cors');
const app = express();
const OpenAI = require("openai");

const PORT = process.env.PORT || 3000;
const SYNCFY_API_KEY = process.env.SYNC_API_KEY;
const OPENAI_API_KEY = process.env.SYNC_API_KEY;

const upload = multer({ dest: 'uploads/' });
const openai = new OpenAI();


app.use(cors());
app.use(express.json());

let syncToken = '';
let credencialSAT = '';
let id_user = '65ec835acaa98b2d6b500adc';
let token = '';
let currentThreadId = null; // Variable para mantener el ID del hilo actual entre peticiones


app.get('/', async (req, res) => {
    try {
        // Crear un usuario
        let user = await Sync.run(
            {api_key: SYNCFY_API_KEY}, 
            '/users', 
            {
                id_external: 'MIST079001',
                name: 'Rey Misterio4'
            }, 
            'POST'
        );

        let {id_user} = user;
        console.log(`ID de usuario: ${id_user}`);
        
        // Crear una sesión para un usuario
        token = await Sync.auth(
            {api_key: SYNCFY_API_KEY}, // Tu API KEY
            {id_user: id_user} // ID de usuario
        );
        syncToken = token.token;

        res.json({
            message: 'Datos:',
            user: id_user,
            syncToken: syncToken,
            credencialSAT : credencialSAT
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Ocurrió un error al procesar la solicitud.');
    }
});

app.get('/obtener-sesion', async (req, res) => {
    try {
        const { sync_user_id } = req.query; 

        if (!sync_user_id) {
            return res.status(400).send('Se requiere el sync_user_id.');
        }
        let session = await Sync.auth(
            {api_key: SYNCFY_API_KEY},
            {id_user: sync_user_id}
        );
        syncToken = session.token;
        console.log(`Token: ${syncToken}`);
        res.json({
            message: 'Datos obtenidos exitosamente',
            user: sync_user_id,
            token: syncToken,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Ocurrió un error al procesar la solicitud.');
    }
});

app.get('/crear-credencial', async (req, res) => {
    try {
        const payload = {
            id_site: "56cf5728784806f72b8b456f",
            credentials: {
                rfc: "ACM010101ABC",
                password: "test"
            },
            options: {
                search_from: "2024-01-01",
                search_to: "2024-01-31"
            }
        };

        let credential = await Sync.run(
            {token: syncToken}, 
            '/credentials', 
            payload, 
            'POST'
        );
        credencialSAT = credential.id_credential;
        console.log(credencialSAT);

        res.json({
            message: 'Datos:',
            user: id_user,
            syncToken: syncToken,
            credencialSAT : credencialSAT
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Ocurrió un error al procesar la solicitud.');
    }
});

app.post('/crear-usuario', async (req, res) => {
    try {
        const { uid, correo } = req.body;
        if (!uid || !correo) {
            return res.status(400).send('Falta el uid o el correo en la solicitud.');
        }
        // Crear un usuario en Sync
        let user = await Sync.run(
            {api_key: SYNCFY_API_KEY}, 
            '/users', 
            {
                id_external: uid,
                name: correo
            }, 
            'POST'
        );

        let {id_user} = user;
        
        // Crear una sesión para el usuario
        let session = await Sync.auth(
            {api_key: SYNCFY_API_KEY},
            {id_user: id_user}
        );
        syncToken = session.token;

        res.json({
            message: 'Datos recibidos:',
            user: id_user,
            syncToken: syncToken,
        });
        console.log(session.token);
    } catch (error) {
        console.error(error);
        res.status(500).send('Ocurrió un error al procesar la solicitud.');
    }
});

app.post('/asistente-ia', async (req, res) => {
    const { content, file_ids } = req.body; // Asume que el mensaje del usuario y el file_id opcional vienen en el cuerpo de la solicitud
    let threadId = currentThreadId; // Asume que existe una variable `currentThreadId` para mantener el estado del hilo
    console.log("Current thread:", threadId, "Content:", content, "File IDs:", file_ids);
    try {
        if (!threadId) {
            const thread = await openai.beta.threads.create();
            threadId = thread.id; // Guarda el nuevo ID del hilo para su uso posterior
            currentThreadId = threadId; // Asume que estás almacenando este ID en una variable global o en algún almacén de estado
        }
        console.log("Thread:", threadId);
        
        const messageOptions = {
            role: "user",
            content: content,
        };
        
        // Añadir file_ids al objeto messageOptions si fileId está presente
        if (file_ids) {
            messageOptions.file_ids = file_ids;
        }
        console.log("Message:", messageOptions);

        // Crea un nuevo mensaje en el hilo
        await openai.beta.threads.messages.create(threadId, messageOptions);

        // Crea un nuevo 'run' en el hilo
        let run = await openai.beta.threads.runs.create(threadId, { 
            assistant_id: "asst_VV22DJTqPF8iofKiAJRC7iI0"
        });

        // Espera hasta que el 'run' se complete
        while (['queued', 'in_progress', 'cancelling'].includes(run.status)) {
            console.log("Status:", run.status);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Espera 1 segundo
            run = await openai.beta.threads.runs.retrieve(threadId, run.id);
        }

        if (run.status === 'completed') {
            // Lista los mensajes del hilo
            const messages = await openai.beta.threads.messages.list(threadId);
            const responseMessage = messages.data.find(m => m.role === 'assistant');

            // Envía el mensaje de respuesta al cliente
            res.json({ message: responseMessage.content[0].text.value });
        } else {
            res.status(500).send('Error al procesar la solicitud con el asistente de IA');
        }
    } catch (error) {
        console.error('Error al procesar la solicitud:', error);
        res.status(500).send('Error interno del servidor');
    }
});


app.post('/asistente-ia-file', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded');
    }

    try {
        const filePath = req.file.path;

        // Aquí asumimos que ya has manejado la creación o recuperación del ID de hilo (thread) de alguna manera

        // Sube el archivo a OpenAI
        const fileResponse = await openai.files.create({
            file: fs.createReadStream(filePath),
            purpose: "assistants",
          });

        // Limpia el archivo temporal
        fs.unlinkSync(filePath);

        // Respuesta al cliente
        console.log('File uploaded to OpenAI:', fileResponse);
        res.json({ ok: true, fileId: fileResponse.id });
    } catch (error) {
        console.error('Failed to upload file to OpenAI:', error);
        res.status(500).send('Error uploading file');
    }
});


app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
