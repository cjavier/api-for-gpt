import React, { useContext, useEffect, useState } from 'react';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Layout from './Layout/Layout';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { CircularProgress } from '@mui/material';
import { getFirestore, doc, getDoc, getDocs, setDoc, collection, query, where } from 'firebase/firestore'; 
import { AuthContext } from '../AuthContext'; 

export default function FacturasSAT() {
  const { currentUser } = useContext(AuthContext);
  const [token, setToken] = useState('');
  const [syncMessage, setSyncMessage] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const db = getFirestore();
  const API_KEY = process.env.REACT_APP_SYNCFY_API_KEY;



  useEffect(() => {
    const fetchSessionToken = async () => {
      if (!currentUser) return;

      const userDocRef = doc(db, "usuarios", currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        console.error('No se encontraron datos del usuario.');
        return;
      }

      const userData = userDocSnap.data();
      const syncUserId = userData.sync_user_id;

      const sessionResponse = await fetch('https://api.syncfy.com/v1/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `api_key api_key=${API_KEY}`, // Corregido el formato del header de autorización
        },
        body: JSON.stringify({ id_user: syncUserId }),
      });

      if (!sessionResponse.ok) {
        throw new Error('Error al obtener el token de sesión de Syncfy');
      }

      const sessionData = await sessionResponse.json();
      setToken(sessionData.response.token);
      console.log('Token de sesión:', sessionData.response.token);
    };

    fetchSessionToken();
  }, [currentUser]); 

  const obtenerSATCredential = async () => {
    if (!currentUser) {
      console.error('No hay usuario actual');
      return null;
    }

    const userDocRef = doc(db, "usuarios", currentUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      console.error('No se encontraron datos del usuario.');
      return null;
    }

    return userDocSnap.data().SAT_credential;
  };

  const obtainTransactions = async (SAT_credential) => {
    if (!token || !SAT_credential) {
      throw new Error('Faltan token o SAT_credential para obtener las transacciones');
    }

    const response = await fetch(`https://api.syncfy.com/v1/credentials/${SAT_credential}/transactions?token=${token}&attachment_content_parse=1&limit=10`, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error('Error al obtener las transacciones del SAT');
    }

    const transactionsData = await response.json();
    return transactionsData.response; // Asume que este es el arreglo de transacciones
  };

  const checkDuplicatedandSave = async (transactions) => {
    let syncCount = 0;

    for (let transaction of transactions) {
      const q = query(collection(db, `usuarios/${currentUser.uid}/facturas`), where("id_transaction", "==", transaction.id_transaction));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        await setDoc(doc(collection(db, `usuarios/${currentUser.uid}/facturas`), transaction.id_transaction), transaction);
        syncCount++;
      }
    }

    return syncCount; // Retorna el número de transacciones sincronizadas
  };
  function cleanTransactionsData(transactions) {
    return transactions.map(transaction => {
      // Extraer id_attachment y asegurarse de que attachments sea un array de strings
    const attachmentsIds = transaction.attachments.map(att => att.id_attachment);

    // Guardar parse_content como un objeto JSON. Asumiendo que quieres el primer elemento de attachments para parse_content
    const parseContent = transaction.attachments[0]?.parse_content ? JSON.stringify(transaction.attachments[0].parse_content) : '{}';

    // Construir la transacción limpia
    let cleanedTransaction = {
      id_transaction: transaction.id_transaction,
      description: transaction.description,
      amount: transaction.amount,
      currency: transaction.currency,
      dt_transaction: transaction.dt_transaction,
      dt_created: transaction.dt_created,
      reference: transaction.reference,
      tax_id: transaction.extra?.tax_id,
      reference: transaction.reference,
      attachments: attachmentsIds, // Arreglo de id_attachment como strings
      parse_content: parseContent, // parse_content como un string JSON
    };
  
      // Omitir propiedades undefined del objeto principal
      Object.keys(cleanedTransaction).forEach(key => 
        cleanedTransaction[key] === undefined && delete cleanedTransaction[key]
      );
  
      return cleanedTransaction;
    });
  }
  
  
  

  const syncFacturasSAT = async () => {
    setIsSyncing(true);
    try {
      const SAT_credential = await obtenerSATCredential();
      if (!SAT_credential) return;
      const transactions = await obtainTransactions(SAT_credential);
      const cleanTransactions = await cleanTransactionsData(transactions);
      const syncCount = await checkDuplicatedandSave(cleanTransactions);

      setSyncMessage(`Se sincronizaron ${syncCount} de ${transactions.length} facturas encontradas en el SAT`);
    } catch (error) {
      console.error('Error durante la sincronización de facturas:', error.message);
      setSyncMessage(error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Layout>
      <Grid item xs={12}>
        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
          <h1>Facturas SAT</h1>
          <p>Sincroniza todas las facturas de tu cuenta del SAT</p>
          <Box sx={{ mt: 2 }}>
            <Button variant="contained" onClick={syncFacturasSAT}>
              Sincronizar facturas del SAT
            </Button>
            
          </Box>
          <Box sx={{ mt: 2 }}>
            
            {isSyncing && <CircularProgress size={24}  />}
            {syncMessage && <p>{syncMessage}</p>}
          </Box>
        </Paper>
      </Grid>
    </Layout>
  );
}
