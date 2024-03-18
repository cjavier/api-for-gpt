import * as React from 'react';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Layout from './Layout/Layout';
import Box from '@mui/material/Box';  

export default function Dashboard() {
  return (
    <Layout>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <h1>Accountant AI</h1>
            <p>Accountant Asistant using ChatGPT and OpenAI</p>
            <Box sx={{ mt: 2 }}>
              
            </Box>
          </Paper>
        </Grid>
    </Layout>
  );
}