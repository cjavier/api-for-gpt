import React, { useState, useEffect, useRef } from 'react';
import { Grid, Typography, Paper, Button, List, ListItem, ListItemText, Divider, TextField, Fab } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import UploadIcon from '@mui/icons-material/Upload';
import Layout from './Layout/Layout';

export default function Asistente() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const endOfMessagesRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [fileIds, setFileIds] = useState([]); // Almacenar varios IDs
  const fileInputRef = useRef(null);

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const uploadedFileIds = await Promise.all(files.map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('http://localhost:3000/asistente-ia-file', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        return data.fileId; // Suponiendo que la respuesta incluye el fileId
      } catch (error) {
        console.error('Error uploading file:', error);
        return null; // Retorna null para errores, se filtrarán más adelante
      }
    }));

    // Filtrar nulls y actualizar el estado con nuevos fileIds
    const validFileIds = uploadedFileIds.filter((id) => id !== null);
    setFileIds((prevIds) => [...prevIds, ...validFileIds]);
    setUploading(false);
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const OpenAIAssistantCall = async (userMessage) => {
    try {
      const payload = {
        content: userMessage.text,
        file_ids: fileIds,
      };
      console.log("Sending to OpenAI with payload:", payload);

      const response = await fetch('http://localhost:3000/asistente-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      const aiMessage = { text: data.message, sender: "assistant", time: new Date() };

      setMessages((prevMessages) => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error('Error al llamar al asistente de OpenAI:', error);
    } finally {
      setFileIds([]); // Resetea fileIds después de enviar el mensaje
      scrollToBottom();
    }
  };

  const MensajeUsuario = (userMessage) => {
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    OpenAIAssistantCall(userMessage);
  };

  const handleSendMessage = () => {
    if (newMessage.trim() !== "") {
      const userMessage = { text: newMessage, sender: "user", time: new Date() };
      MensajeUsuario(userMessage);
      setNewMessage("");
    }
  };

  const handleKeyUp = (e) => {
    if (e.key === 'Enter') handleSendMessage();
  };

  useEffect(() => scrollToBottom(), [messages]);

  return (
    <Layout>
      <Grid item xs={12}>
        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '70vh' }}>
          <h1>Accountant AI</h1>
          <p>Habla con nuestro asistente. Mandale tu estado de cuenta en cualquier formato para que registre tus transacciones en el sistema.</p>
          <List sx={{ overflowY: 'auto', maxHeight: '50vh', mb: 1 }}>
            {messages.map((message, index) => (
              <ListItem key={index}>
                <Grid container>
                  <Grid item xs={12}>
                    <ListItemText align={message.sender === "user" ? "right" : "left"} primary={message.text}></ListItemText>
                  </Grid>
                  <Grid item xs={12}>
                    <ListItemText align={message.sender === "user" ? "right" : "left"} secondary={message.time.toLocaleTimeString()}></ListItemText>
                  </Grid>
                </Grid>
                <div ref={endOfMessagesRef} />
              </ListItem>
            ))}
          </List>
          <Divider />
          <Grid container sx={{ p: 2 }} alignItems="center">
            <Grid item xs={11}>
              <TextField 
                id="outlined-basic-email" 
                label="Escribe un mensaje" 
                fullWidth 
                value={newMessage} 
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyUp={handleKeyUp}
              />
            </Grid>
            <Grid item xs={1} align="right">
              <Fab color="primary" aria-label="send" onClick={handleSendMessage}>
                <SendIcon />
              </Fab>
            </Grid>
            
          </Grid>
          {uploading && <p>Subiendo...</p>}
        </Paper>
      </Grid>
      <input
        type="file"
        hidden
        onChange={handleFileUpload}
        ref={fileInputRef}
      />
      <Grid item xs={12} align="right">
        <Fab color="primary" aria-label="upload" onClick={handleUploadClick}>
          <UploadIcon />
        </Fab>
      </Grid>
      <Grid item xs={12}>
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography variant="h6">Documentos adjuntos:</Typography>
          <List>
            {fileIds.map((fileId, index) => (
              <ListItem key={index}>
                <ListItemText primary={fileId} />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Grid>
    </Layout>
  );
}