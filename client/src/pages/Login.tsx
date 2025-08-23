import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { LoginFormData } from '../types';
import { Wrench, Mail, Lock, Eye, EyeOff } from 'lucide-react';

const Login: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>();

  // Redirect se già autenticato
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError('');

    try {
      const success = await login(data);
      if (!success) {
        setError('Credenziali non valide');
      }
    } catch (err) {
      setError('Errore durante il login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container fluid className="bg-light min-vh-100 d-flex align-items-center">
      <Container>
        <Row className="justify-content-center">
          <Col md={6} lg={4}>
            <Card className="shadow">
              <Card.Body className="p-5">
                {/* Header */}
                <div className="text-center mb-4">
                  <Wrench size={48} className="text-primary mb-3" />
                  <h3 className="fw-bold">Gestionale Termoidraulico</h3>
                  <p className="text-muted">Accedi al sistema di gestione clienti</p>
                </div>

                {/* Alert errore */}
                {error && (
                  <Alert variant="danger" dismissible onClose={() => setError('')}>
                    {error}
                  </Alert>
                )}

                {/* Form di login */}
                <Form onSubmit={handleSubmit(onSubmit)}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <Mail size={16} className="me-1" />
                      Email
                    </Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="admin@termoidraulico.it"
                      {...register('email', {
                        required: 'Email è obbligatoria',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Email non valida'
                        }
                      })}
                      isInvalid={!!errors.email}
                      disabled={isLoading}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.email?.message}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>
                      <Lock size={16} className="me-1" />
                      Password
                    </Form.Label>
                    <div className="position-relative">
                      <Form.Control
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Inserisci la password"
                        {...register('password', {
                          required: 'Password è obbligatoria',
                          minLength: {
                            value: 6,
                            message: 'Password deve essere di almeno 6 caratteri'
                          }
                        })}
                        isInvalid={!!errors.password}
                        disabled={isLoading}
                      />
                      <Button
                        variant="link"
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        type="button"
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </Button>
                    </div>
                    <Form.Control.Feedback type="invalid">
                      {errors.password?.message}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-100 mb-3"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Accesso in corso...
                      </>
                    ) : (
                      'Accedi'
                    )}
                  </Button>
                </Form>

                {/* Info account demo */}

              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </Container>
  );
};

export default Login;
