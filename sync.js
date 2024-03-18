const express = require('express');
require('dotenv').config();
const Sync = require('@paybook/sync-js');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
const app = express();
const OpenAI = require("openai");
const admin = require('firebase-admin');
const { Timestamp } = admin.firestore;

const PORT = process.env.PORT || 3000;
const SYNCFY_API_KEY = process.env.SYNC_API_KEY;
const OPENAI_API_KEY = process.env.SYNC_API_KEY;
const serviceAccount = require('./contador-ai-firebase-adminsdk-ktp4l-44323405b2.json');

const upload = multer({ dest: 'uploads/' });
const openai = new OpenAI();

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

const db = admin.firestore();

app.use(cors());
app.use(express.json());

let currentThreadId = null; // Variable para mantener el ID del hilo actual entre peticiones


app.get('/', async (req, res) => {
    res.send('Servidor Activo')
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
        const syncToken = session.token;
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
//
// FUNCIONES FIREBASE
//
const saveTransaction = async (transaction, uid) => {
    try {
      // Normaliza los campos
      const amount = Number(transaction.amount); // Asegúrate de que amount sea un número
      const description = String(transaction.description).trim(); // Asegúrate de que description sea un string
      const date = new Date(transaction.date); // Convierte date a un objeto Date
      const firebaseDate = Timestamp.fromDate(date);
      // Genera el ID usando date y amount
      // Asume que date está en formato YYYY-MM-DD y lo convierte a timestamp para el ID
      const transactionId = `${transaction.date}_${amount}`;
      console.log(`Transaction ID: ${transactionId}`);
  
      // Referencia al documento con el ID generado
      const transactionRef = db.collection("usuarios").doc(uid).collection("transacciones").doc(transactionId);
  
      // Prepara el objeto de la transacción para guardar
      const transactionToSave = {
        date: firebaseDate,
        description,
        amount
      };
  
      // Guarda o actualiza el documento en Firestore
      await transactionRef.set(transactionToSave);
      console.log(`Transaction saved: ${transactionId}`);
    } catch (error) {
      console.error(`Error saving transaction:`, error);
    }
  };
  

  
//
// FUNCIONES OPENAI
//

// Crear o recuperar un thread
async function getOrCreateThread(threadId) {
    if (threadId) {
      return threadId;
    } else {
      const thread = await openai.beta.threads.create();
      return thread.id;
    }
  }
  
  // Enviar un mensaje al thread
  async function sendMessageToThread(threadId, content, fileIds) {
    const messageOptions = {
      role: "user",
      content: content,
    };
  
    if (fileIds) {
      messageOptions.file_ids = fileIds;
    }
  
    await openai.beta.threads.messages.create(threadId, messageOptions);
  }

  async function actionRequired(run, uid) {
    const requiredActions = run.required_action.submit_tool_outputs.tool_calls;
    const toolCalls = run.required_action.submit_tool_outputs.tool_calls.map(toolCall => ({
        id: toolCall.id,
        output:  "",
    }));
    for (const action of requiredActions) {
        switch (action.function.name) {
            case "registerTransactions":
                await registerTransactions(JSON.parse(action.function.arguments), run.thread_id, run.id, toolCalls, uid);
                break;
            // Aquí podrías agregar más casos según sea necesario
            default:
                console.log(`No action handler defined for ${action.function.name}`);
        }
    }
}

async function registerTransactions(arguments, thread, run, toolCalls, uid) {
    console.log("Registering transactions with arguments:", arguments);
    const transactions = arguments.transactions;
    for (const transaction of transactions) {
        try {
            await saveTransaction(transaction, uid);
            console.log(`Transaction registered: ${transaction.id}`);
        } catch (error) {
            console.error(`Error saving transaction ${transaction.id}:`, error);
        }
    }
    await submitFunctionOutput(thread, run, toolCalls);
}
// ejemplo con outputs
//const outputs = [
//    { tool_call_id: "call_001", output: "Resultado del tool call 001" },
//];
//await submitFunctionOutput(threadId, runId, outputs);

async function submitFunctionOutput(threadId, runId, toolCalls) {
    const toolOutputs = toolCalls.map(toolCall => ({
        tool_call_id: toolCall.id,
        output: toolCall.output || "", // Envía un string vacío si no hay output específico
    }));

    try {
        await openai.beta.threads.runs.submitToolOutputs(threadId, runId, {
            tool_outputs: toolOutputs,
        });
        console.log("Tool outputs submitted successfully.");
    } catch (error) {
        console.error("Error submitting tool outputs:", error);
        throw error;
    }
}

  
  // Procesar un run en el thread y obtener la respuesta
  async function processRunAndGetResponse(threadId, uid) {
    let run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: "asst_VV22DJTqPF8iofKiAJRC7iI0",
    });
  
    while (['queued', 'in_progress', 'cancelling', 'requires_action'].includes(run.status)) {
        if (run.status === 'requires_action') {
            console.log(`Action required for run: ${run.id}`);
            await actionRequired(run, uid);
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        run = await openai.beta.threads.runs.retrieve(threadId, run.id);
        console.log(`Run status: ${run.status}`);
    }
  
    if (run.status === 'completed') {
      const messages = await openai.beta.threads.messages.list(threadId);
      const responseMessage = messages.data.find(m => m.role === 'assistant');
      return responseMessage.content[0].text.value;
    } else {
      throw new Error('Run did not complete successfully');
    }
  }
  
//
// ENDPOINT DE ASISTENTE
//

app.post('/asistente-ia', async (req, res) => {
    const { uid, content, file_ids } = req.body;
  
    try {
      let threadId = currentThreadId; // Asume que existe una variable global o de estado para el threadId
      threadId = await getOrCreateThread(threadId);
      currentThreadId = threadId; // Actualiza el threadId global/estado si es necesario
  
      await sendMessageToThread(threadId, content, file_ids);
      const responseMessage = await processRunAndGetResponse(threadId, uid);
  
      res.json({ message: responseMessage });
    } catch (error) {
      console.error('Error al procesar la solicitud:', error);
      res.status(500).send('Error interno del servidor');
    }
  });
  


app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
