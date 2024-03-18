import * as React from 'react';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ReceiptIcon from '@mui/icons-material/Receipt';
import Face3Icon from '@mui/icons-material/Face3';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { ElectricBolt, ManageSearch, Storage, SupervisedUserCircle } from '@mui/icons-material';
import { Link } from 'react-router-dom';


export const mainListItems = (
  <React.Fragment>
    <ListItemButton component={Link} to="/dashboard">
      <ListItemIcon>
        <DashboardIcon />
      </ListItemIcon>
      <ListItemText primary="Dashboard" />
    </ListItemButton>
    <ListItemButton component={Link} to="/asistente">
      <ListItemIcon>
        <Face3Icon />
      </ListItemIcon>
      <ListItemText primary="Asistente" />
    </ListItemButton>
    <ListItemButton component={Link} to="/transacciones-banco">
      <ListItemIcon>
        <ReceiptIcon />
      </ListItemIcon>
      <ListItemText primary="Transacciones Banco" />
    </ListItemButton>
    <ListItemButton component={Link} to="/transacciones-sat">
      <ListItemIcon>
        <ReceiptIcon />
      </ListItemIcon>
      <ListItemText primary="Transacciones SAT" />
    </ListItemButton>
    <ListItemButton component={Link} to="/integrar-sat">
      <ListItemIcon>
        <AccountBalanceIcon />
      </ListItemIcon>
      <ListItemText primary="Sincronizar con el SAT" />
    </ListItemButton>
    <ListItemButton component={Link} to="/facturas-sat">
      <ListItemIcon>
        <ReceiptIcon />
      </ListItemIcon>
      <ListItemText primary="Bajar Facturas" />
    </ListItemButton>
    <ListItemButton component={Link} to="/conciliacion">
      <ListItemIcon>
        <CurrencyExchangeIcon />
      </ListItemIcon>
      <ListItemText primary="Coinciliar con IA" />
    </ListItemButton>
  </React.Fragment>
);

export const secondaryListItems = (
  <React.Fragment>
    <ListSubheader component="div" inset>
      Saved reports
    </ListSubheader>
    <ListItemButton>
      <ListItemIcon>
        <AssignmentIcon />
      </ListItemIcon>
      <ListItemText primary="Current month" />
    </ListItemButton>
    <ListItemButton>
      <ListItemIcon>
        <AssignmentIcon />
      </ListItemIcon>
      <ListItemText primary="Last quarter" />
    </ListItemButton>
    <ListItemButton>
      <ListItemIcon>
        <AssignmentIcon />
      </ListItemIcon>
      <ListItemText primary="Year-end sale" />
    </ListItemButton>
  </React.Fragment>
);
