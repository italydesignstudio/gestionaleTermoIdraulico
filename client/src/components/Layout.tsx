import React, { ReactNode } from 'react';
import { Navbar, Nav, Container, Row, Col, Button } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, 
  Users, 
  Shield, 
  Settings, 
  LogOut,
  Wrench,
  User
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const sidebarItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home, color: 'primary' },
    { path: '/clienti', label: 'Clienti', icon: Users, color: 'info' },
    ...(isAdmin() ? [
      { path: '/password-info', label: 'Password e Info', icon: Shield, color: 'warning' },
      { path: '/utenti', label: 'Gestione Utenti', icon: Settings, color: 'secondary' }
    ] : [])
  ];

  return (
    <div>
      {/* Top Navbar */}
      <Navbar bg="dark" variant="dark" expand="lg" sticky="top">
        <Container fluid>
          <Navbar.Brand as={Link} to="/dashboard" className="d-flex align-items-center">
            <Wrench size={24} className="me-2" />
            Gestionale Termoidraulico
          </Navbar.Brand>
          
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Nav.Item className="d-flex align-items-center text-light me-3">
                <User size={16} className="me-1" />
                <span className="small">
                  {user?.nome} {user?.cognome}
                  <span className="badge bg-primary ms-2">{user?.ruolo}</span>
                </span>
              </Nav.Item>
              <Button 
                variant="outline-light" 
                size="sm" 
                onClick={logout}
                className="d-flex align-items-center"
              >
                <LogOut size={16} className="me-1" />
                Logout
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container fluid>
        <Row>
          {/* Sidebar */}
          <Col md={3} lg={2} className="sidebar p-0">
            <Nav className="flex-column">
              {sidebarItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Nav.Link
                    key={item.path}
                    as={Link}
                    to={item.path}
                    className={`d-flex align-items-center ${isActive(item.path) ? 'active' : ''}`}
                  >
                    <IconComponent size={18} className="me-2" />
                    {item.label}
                  </Nav.Link>
                );
              })}
            </Nav>
          </Col>

          {/* Main Content */}
          <Col md={9} lg={10} className="main-content">
            {children}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Layout;
