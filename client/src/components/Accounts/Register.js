import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, Avatar, Typography,
  TextField, Button, Grid
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { getAuth, createUserWithEmailAndPassword } from '../../firebase';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    try {
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

       // Llamado API para enviar UID y correo al servidor
       const response = await fetch('http://localhost:3000/crear-usuario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uid, correo: email }),
      });

      if (!response.ok) {
        throw new Error('Error al realizar el llamado API');
      }

      const data = await response.json();
      const syncUserId = data.user; // Asumiendo que esta es la estructura de la respuesta


      const db = getFirestore();
      // Asumiendo que quieres almacenar más información en el futuro, usa merge para no sobrescribir otros campos
      await setDoc(doc(db, "usuarios", uid), {
        uid: uid,
        correo: email,
        sync_user_id: syncUserId,
      }, { merge: true });

      setSuccessMessage('Usuario creado exitosamente!');
      setTimeout(() => {
        navigate('/onboarding');
      }, 2000);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      {error && (
        <Typography color="error" align="center" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}
      {successMessage && (  // Muestra el mensaje de éxito si existe
        <Typography color="success" align="center" sx={{ mt: 2 }}>
          {successMessage}
        </Typography>
      )}
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Crear cuenta
        </Typography>
        <Box component="form" noValidate sx={{ mt: 1 }} onSubmit={handleRegister}>
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="email"
            label="Correo Electrónico"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            name="password"
            label="Contraseña"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirmar Contraseña"
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {/* <FormControlLabel
            control={<Checkbox value="remember" color="primary" />}
            label="Recordarme"
          /> */}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 3, mb: 2 }}
          >
            Crear cuenta
          </Button>
          <Grid container>
            <Grid item>
              <a href="#" variant="body2">
                {"¿Ya tienes una cuenta? Iniciar sesión"}
              </a>
            </Grid>
          </Grid>
        </Box>
      </Box>
      <Typography variant="body2" align="center" sx={{ mt: 8 }}>
        Copyright ©{' '}
        <a href="https://mui.com/" variant="inherit">
          Your Website
        </a>{' '}
        2023.
      </Typography>
    </Container>
  );
};

export default Register;
