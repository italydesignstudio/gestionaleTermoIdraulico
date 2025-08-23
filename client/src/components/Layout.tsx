import React, { ReactNode, useState, useEffect } from 'react';
import { Navbar, Nav, Container, Row, Col, Button, Offcanvas } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, 
  Users, 
  Shield, 
  Settings, 
  LogOut,
  Wrench,
  User,
  Menu,
  X
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const [showSidebar, setShowSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if screen is mobile
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 992);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setShowSidebar(false);
    }
  }, [location.pathname, isMobile]);

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const sidebarItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home, color: 'primary' },
    { path: '/clienti', label: 'Clienti', icon: Users, color: 'info' },
    // Mostra Password e Info per Operatori e Amministratori
    ...(user && ['Operatore', 'Amministratore'].includes(user.ruolo) ? [
      { path: '/password-info', label: 'Password e Info', icon: Shield, color: 'warning' }
    ] : []),
    // Mostra Gestione Utenti solo per Amministratori
    ...(isAdmin() ? [
      { path: '/utenti', label: 'Gestione Utenti', icon: Settings, color: 'secondary' }
    ] : [])
  ];

  const handleSidebarToggle = () => {
    setShowSidebar(!showSidebar);
  };

  const SidebarContent = () => (
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
  );

  return (
    <div>
      {/* Top Navbar */}
      <Navbar bg="dark" variant="dark" expand="lg" sticky="top">
        <Container fluid>
          {/* Mobile menu toggle */}
          {isMobile && (
            <Button
              variant="outline-light"
              size="sm"
              onClick={handleSidebarToggle}
              className="d-lg-none me-2"
              aria-label="Toggle navigation"
            >
              {showSidebar ? <X size={20} /> : <Menu size={20} />}
            </Button>
          )}
          
          <Navbar.Brand as={Link} to="/dashboard" className="d-flex align-items-center">
            <Wrench size={24} className="me-2" />
            <span className="d-none d-sm-inline">Gestionale Termoidraulico</span>
            <span className="d-sm-none">Gestionale</span>
          </Navbar.Brand>
          
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Nav.Item className="d-flex align-items-center text-light me-3">
                <User size={16} className="me-1" />
                <span className="small d-none d-md-inline">
                  {user?.nome} {user?.cognome}
                  <span className="badge bg-primary ms-2">{user?.ruolo}</span>
                </span>
                <span className="small d-md-none">
                  {user?.nome?.charAt(0)}{user?.cognome?.charAt(0)}
                  <span className="badge bg-primary ms-1">{user?.ruolo}</span>
                </span>
              </Nav.Item>
              <Button 
                variant="outline-light" 
                size="sm" 
                onClick={logout}
                className="d-flex align-items-center"
              >
                <LogOut size={16} className="me-1" />
                <span className="d-none d-sm-inline">Logout</span>
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container fluid>
        <Row>
          {/* Desktop Sidebar */}
          {!isMobile && (
            <Col md={3} lg={2} className="sidebar p-0">
              <SidebarContent />
            </Col>
          )}

          {/* Mobile Sidebar (Offcanvas) */}
          {isMobile && (
            <Offcanvas
              show={showSidebar}
              onHide={() => setShowSidebar(false)}
              placement="start"
              className="sidebar"
              style={{ width: '280px' }}
            >
              <Offcanvas.Header closeButton className="border-bottom">
                <Offcanvas.Title className="d-flex align-items-center text-white">
                  <Wrench size={20} className="me-2" />
                  Menu
                </Offcanvas.Title>
              </Offcanvas.Header>
              <Offcanvas.Body className="p-0">
                <SidebarContent />
              </Offcanvas.Body>
            </Offcanvas>
          )}

          {/* Main Content */}
          <Col 
            md={isMobile ? 12 : 9} 
            lg={isMobile ? 12 : 10} 
            className="main-content"
          >
            <div className="fade-in">
              {children}
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Layout;
