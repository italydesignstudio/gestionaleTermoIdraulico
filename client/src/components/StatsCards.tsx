import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { StatsResponse } from '../types';
import { Users, CheckCircle, XCircle, TrendingUp } from 'lucide-react';

interface StatsCardsProps {
  stats: StatsResponse;
  isLoading: boolean;
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <Row className="mb-4">
        {[1, 2, 3, 4].map((i) => (
          <Col lg={3} md={6} key={i} className="mb-3">
            <Card>
              <Card.Body className="text-center">
                <div className="placeholder-glow">
                  <div className="placeholder rounded-circle" style={{ width: '48px', height: '48px' }}></div>
                  <div className="placeholder w-75 mt-2"></div>
                  <div className="placeholder w-50"></div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    );
  }

  const conMarketingCount = stats.consensoMarketing?.find(item => item.tipo === 'Con consenso')?.count || 0;
  const senzaMarketingCount = stats.consensoMarketing?.find(item => item.tipo === 'Senza consenso')?.count || 0;
  const totaleClienti = stats.totaleClienti || 0;
  const percentualeMarketing = totaleClienti > 0 
    ? Math.round((conMarketingCount / totaleClienti) * 100) 
    : 0;

  const topProvenienza = stats.provenienzaContatto?.length > 0 
    ? stats.provenienzaContatto[0] 
    : { provenienzaContatto: 'N/A', count: 0 };

  const statsData = [
    {
      title: 'Totale Clienti',
      value: totaleClienti,
      icon: Users,
      color: 'primary',
      description: 'Clienti registrati'
    },
    {
      title: 'Consenso Marketing',
      value: `${percentualeMarketing}%`,
      icon: CheckCircle,
      color: 'success',
      description: `${conMarketingCount} su ${totaleClienti}`
    },
    {
      title: 'Senza Consenso',
      value: senzaMarketingCount,
      icon: XCircle,
      color: 'warning',
      description: 'No marketing'
    },
    {
      title: 'Top Provenienza',
      value: topProvenienza.count,
      icon: TrendingUp,
      color: 'info',
      description: topProvenienza.provenienzaContatto
    }
  ];

  return (
    <Row className="mb-4">
      {statsData.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Col lg={3} md={6} key={index} className="mb-3">
            <Card className="h-100">
              <Card.Body className="text-center">
                <div className={`text-${stat.color} mb-3`}>
                  <IconComponent size={48} />
                </div>
                <h4 className="fw-bold mb-1">{stat.value}</h4>
                <h6 className="text-muted mb-1">{stat.title}</h6>
                <small className="text-muted">{stat.description}</small>
              </Card.Body>
            </Card>
          </Col>
        );
      })}
    </Row>
  );
};

export default StatsCards;
