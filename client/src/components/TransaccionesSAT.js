import React, { useContext, useEffect, useState } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { AuthContext } from '../AuthContext'; 
import { CircularProgress, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Modal, Box as ModalBox } from '@mui/material';
import Layout from './Layout/Layout';
import Box from '@mui/material/Box';

// Estilos para el modal
const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '80%', // Ancho del modal hasta un 80% del ancho de la ventana
  maxHeight: '90vh', // Altura máxima para evitar que el modal sea más grande que la ventana
  bgcolor: 'background.paper',
  border: '2px solid #000',
  fontSize: '8px',
  boxShadow: 24,
  p: 4,
  overflow: 'auto',
  whiteSpace: 'pre-wrap', // Mantiene el formateo de espacios y saltos de línea
  wordWrap: 'break-word', // Asegura que las palabras largas no desborden el contenedor
};

export default function TransaccionesSAT() {
  const { currentUser } = useContext(AuthContext);
  const [facturas, setFacturas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [selectedFactura, setSelectedFactura] = useState(null); // Almacena la factura seleccionada

  useEffect(() => {
    const fetchFacturas = async () => {
      if (!currentUser) return;
      setIsLoading(true);

      const db = getFirestore();
      const facturasRef = collection(db, `usuarios/${currentUser.uid}/facturas`);
      const querySnapshot = await getDocs(facturasRef);
      const fetchedFacturas = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setFacturas(fetchedFacturas);
      setIsLoading(false);
    };

    fetchFacturas();
  }, [currentUser]);

  const handleCloseModal = () => setOpenModal(false);

  return (
    <Layout>
      <Grid item xs={12}>
        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
          <h1>Lista de Facturas del SAT</h1>
          <Box sx={{ mt: 2 }}>
            {isLoading ? (
              <CircularProgress />
            ) : (
              <TableContainer component={Paper}>
                <Table aria-label="simple table">
                  <TableHead>
                    <TableRow>
                      <TableCell align="right">Descripción</TableCell>
                      <TableCell align="right">RFC</TableCell>
                      <TableCell align="right">Monto</TableCell>
                      <TableCell align="right">Moneda</TableCell>
                      <TableCell align="right">Fecha de Creación</TableCell>
                      <TableCell align="right">Fecha de Transacción</TableCell>
                      <TableCell align="right">Folio fiscal</TableCell>
                      <TableCell align="right">XML</TableCell> 
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {facturas.map((factura) => (
                      <TableRow key={factura.id}>
                        <TableCell align="right">{factura.description}</TableCell>
                        <TableCell align="right">{factura.tax_id}</TableCell>
                        <TableCell align="right">{factura.amount}</TableCell>
                        <TableCell align="right">{factura.currency}</TableCell>
                        <TableCell align="right">{new Date(factura.dt_created * 1000).toLocaleDateString()}</TableCell>
                        <TableCell align="right">{new Date(factura.dt_transaction * 1000).toLocaleDateString()}</TableCell>
                        <TableCell align="right">{factura.reference}</TableCell>
                        <TableCell align="right">
                          <Button onClick={() => { setSelectedFactura(factura); setOpenModal(true); }}>
                            Ver XML
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            <Modal
              open={openModal}
              onClose={handleCloseModal}
              aria-labelledby="modal-modal-title"
              aria-describedby="modal-modal-description"
            >
              <Box sx={style}>
                <h2 id="modal-modal-title">Factura XML</h2>
                {/* Usar la etiqueta <pre> y <code> para el formato JSON */}
                <pre id="modal-modal-description" style={{ overflow: 'auto', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                  <code>{JSON.stringify(selectedFactura?.parse_content, null, 2)}</code>
                </pre>
              </Box>
            </Modal>
          </Box>
        </Paper>
      </Grid>
    </Layout>
  );
}
