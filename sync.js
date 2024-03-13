const express = require('express');
require('dotenv').config();
const Sync = require('@paybook/sync-js');
//import "@paybook/sync-widget/dist/widget.css";
//import SyncWidget from "@paybook/sync-widget";
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.SYNC_API_KEY;

app.use(cors());
app.use(express.json());

let syncToken = '';
let credencialSAT = '';
let id_user = '65ec835acaa98b2d6b500adc';
let token = '';

app.get('/', async (req, res) => {
    try {
        // Crear un usuario
        let user = await Sync.run(
            {api_key: API_KEY}, 
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
            {api_key: API_KEY}, // Tu API KEY
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
            {api_key: API_KEY},
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
            {api_key: API_KEY}, 
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
            {api_key: API_KEY},
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

// Endpoint para refrescar el token de un usuario
app.get('/ruta-para-refrescar-token', async (req, res) => {
    try {
        // Asumiendo que recibimos el id_user de alguna manera (e.g., a través de un JWT)
        // Para este ejemplo, lo recibirás como una query param por simplicidad
       // const id_user = req.query.id_user;

        if (!id_user) {
            return res.status(400).send('ID de usuario no proporcionado');
        }

        // Aquí usarías la API de Sync para obtener un nuevo token para el usuario
        let newToken = await Sync.auth(
            {api_key: API_KEY},
            {id_user: id_user} // ID de usuario para el cual refrescar el token
        );
        
        syncToken = newToken.token;

        res.json({
            message: 'Datos:',
            user: id_user,
            syncToken: syncToken,
            credencialSAT : credencialSAT
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Ocurrió un error al procesar la solicitud de refrescar el token.');
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
