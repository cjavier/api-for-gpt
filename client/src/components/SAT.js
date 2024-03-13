import * as React from 'react';
import { useContext, useEffect } from 'react';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Layout from './Layout/Layout';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import "@paybook/sync-widget/dist/widget.css";
import SyncWidget from "@paybook/sync-widget";
import { getFirestore, collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore'; 
import { AuthContext } from '../AuthContext'; // Asegúrate de que este contexto esté configurado correctamente

export default function SAT() {
  const { currentUser } = useContext(AuthContext);

  useEffect(() => {
    const fetchTokenAndInitWidget = async () => {
      if (!currentUser) return;

      const db = getFirestore();
      const usersCollection = collection(db, 'usuarios');
      const q = query(usersCollection, where('uid', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.error('No se encontraron datos del usuario.');
        return;
      }

      const userData = querySnapshot.docs[0].data();
      const syncUserId = userData.sync_user_id; // Asumiendo que el sync_user_id está almacenado en Firestore

      try {
        const response = await fetch(`http://localhost:3000/obtener-sesion?sync_user_id=${syncUserId}`);
        if (!response.ok) {
          throw new Error('Respuesta del servidor no fue exitosa.');
        }
        const data = await response.json();
        const token = data.token;

        // Configuración del widget con el token obtenido
        const params = {
          token,
          element: "#widget",
          config: {
            locale: "es",
            navigation: {
              enableBackNavigation: false,
              displayBusinessSites: false,
            },
          },
        };

        if (!window.syncWidget) {
          const syncWidget = new SyncWidget(params);
          window.syncWidget = syncWidget;

          // Manejar el evento de éxito
          syncWidget.$on("success", async (credential) => {
            console.log("La sincronización fue exitosa:", credential);
            // Actualizar el documento del usuario en Firestore
            const userDocRef = doc(db, "usuarios", currentUser.uid);
            await updateDoc(userDocRef, {
              SAT_credential: credential.id_credential,
            });
            console.log("SAT_credential guardado en Firestore exitosamente.");
          });

          // Opcional: Manejar cambios en el estado de sincronización
          syncWidget.$on("status", (status) => {
            console.log("Estado de sincronización:", status);
            // Aquí puedes agregar código para manejar diferentes estados
          });

        }
      } catch (error) {
        console.error('Error al obtener el token para el widget:', error);
      }
    };

    fetchTokenAndInitWidget();
  }, [currentUser]);

  const openWidget = () => {
    if (window.syncWidget) {
      window.syncWidget.open();
    }
  };

  return (
    <Layout>
      <Grid item xs={12}>
        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
          <h1>Integrar con tu cuenta de SAT</h1>
          <p>Accountant Assistant using ChatGPT and OpenAI</p>
          <Box sx={{ mt: 2 }}>
            <div id="widget"></div>
            <Button variant="contained" onClick={openWidget}>
              Activar Widget
            </Button>
          </Box>
        </Paper>
      </Grid>
    </Layout>
  );
}
