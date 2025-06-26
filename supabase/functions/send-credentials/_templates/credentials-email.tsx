
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Text,
  Section,
  Row,
  Column,
  Hr,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface CredentialsEmailProps {
  userName: string;
  userEmail: string;
  password: string;
  companyName: string;
  websiteUrl: string;
  loginUrl: string;
}

export const CredentialsEmail = ({
  userName,
  userEmail,
  password,
  companyName,
  websiteUrl,
  loginUrl,
}: CredentialsEmailProps) => {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(loginUrl)}`;
  
  return (
    <Html>
      <Head />
      <Preview>Vos identifiants de connexion Digiibuz sont prêts !</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header avec logo */}
          <Section style={header}>
            <Heading style={h1}>🚀 Bienvenue sur Digiibuz !</Heading>
          </Section>

          {/* Message de bienvenue personnalisé */}
          <Section style={welcomeSection}>
            <Text style={welcomeText}>
              Bonjour <strong>{userName}</strong>,
            </Text>
            <Text style={text}>
              Félicitations ! Votre compte Digiibuz a été créé avec succès pour <strong>{companyName}</strong>.
              {websiteUrl && (
                <>
                  {' '}Vous pouvez maintenant gérer vos publications pour votre site{' '}
                  <Link href={websiteUrl} style={link} target="_blank">
                    {websiteUrl}
                  </Link>
                  .
                </>
              )}
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Identifiants de connexion */}
          <Section style={credentialsSection}>
            <Heading style={h2}>🔐 Vos identifiants de connexion</Heading>
            
            <div style={credentialsBox}>
              <Row style={credentialRow}>
                <Column style={credentialLabel}>
                  <Text style={labelText}>Email :</Text>
                </Column>
                <Column style={credentialValue}>
                  <Text style={valueText}>{userEmail}</Text>
                </Column>
              </Row>
              
              <Row style={credentialRow}>
                <Column style={credentialLabel}>
                  <Text style={labelText}>Mot de passe :</Text>
                </Column>
                <Column style={credentialValue}>
                  <Text style={passwordText}>{password}</Text>
                </Column>
              </Row>
            </div>
          </Section>

          <Hr style={divider} />

          {/* Bouton de connexion et QR Code */}
          <Section style={actionSection}>
            <Row>
              <Column style={buttonColumn}>
                <Link href={loginUrl} style={button} target="_blank">
                  Se connecter maintenant
                </Link>
              </Column>
              <Column style={qrColumn}>
                <div style={qrContainer}>
                  <Text style={qrText}>Ou scannez ce QR Code :</Text>
                  <Img
                    src={qrCodeUrl}
                    width="120"
                    height="120"
                    alt="QR Code pour accéder à Digiibuz"
                    style={qrCode}
                  />
                </div>
              </Column>
            </Row>
          </Section>

          <Hr style={divider} />

          {/* Informations utiles */}
          <Section style={infoSection}>
            <Heading style={h3}>📋 Prochaines étapes</Heading>
            <Text style={text}>
              • Connectez-vous à votre espace personnel<br/>
              • Explorez les fonctionnalités de création d'annonces<br/>
              • Configurez vos préférences de publication<br/>
              • Contactez notre support si vous avez des questions
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Besoin d'aide ? Contactez notre équipe support :<br/>
              <Link href="mailto:contact@digiibuz.fr" style={link}>
                contact@digiibuz.fr
              </Link>
            </Text>
            <Text style={footerText}>
              <Link href="https://www.digiibuz.fr" style={link} target="_blank">
                Digiibuz
              </Link>
              {' '}- Votre partenaire digital
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '32px 24px',
  backgroundColor: '#667eea',
  borderRadius: '12px 12px 0 0',
  textAlign: 'center' as const,
};

const h1 = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
  lineHeight: '1.3',
};

const h2 = {
  color: '#1a1a1a',
  fontSize: '20px',
  fontWeight: '600',
  margin: '0 0 16px 0',
  lineHeight: '1.3',
};

const h3 = {
  color: '#1a1a1a',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 12px 0',
  lineHeight: '1.3',
};

const welcomeSection = {
  padding: '32px 24px 24px',
};

const welcomeText = {
  color: '#1a1a1a',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
};

const text = {
  color: '#525252',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
};

const credentialsSection = {
  padding: '24px',
};

const credentialsBox = {
  backgroundColor: '#f8fafc',
  border: '2px solid #e2e8f0',
  borderRadius: '8px',
  padding: '20px',
  margin: '16px 0',
};

const credentialRow = {
  marginBottom: '12px',
};

const credentialLabel = {
  width: '30%',
  verticalAlign: 'top',
};

const credentialValue = {
  width: '70%',
  verticalAlign: 'top',
};

const labelText = {
  color: '#64748b',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0',
};

const valueText = {
  color: '#1e293b',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0',
  fontFamily: 'monospace',
};

const passwordText = {
  color: '#dc2626',
  fontSize: '16px',
  fontWeight: '700',
  margin: '0',
  fontFamily: 'monospace',
  backgroundColor: '#fef2f2',
  padding: '4px 8px',
  borderRadius: '4px',
  border: '1px solid #fecaca',
};

const actionSection = {
  padding: '24px',
  textAlign: 'center' as const,
};

const buttonColumn = {
  width: '60%',
  verticalAlign: 'middle',
  paddingRight: '12px',
};

const qrColumn = {
  width: '40%',
  verticalAlign: 'middle',
  paddingLeft: '12px',
};

const button = {
  backgroundColor: '#667eea',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 28px',
  width: '100%',
  boxSizing: 'border-box' as const,
};

const qrContainer = {
  textAlign: 'center' as const,
};

const qrText = {
  color: '#64748b',
  fontSize: '12px',
  margin: '0 0 8px 0',
};

const qrCode = {
  border: '2px solid #e2e8f0',
  borderRadius: '8px',
};

const infoSection = {
  padding: '24px',
};

const footer = {
  padding: '24px',
  backgroundColor: '#f8fafc',
  borderRadius: '0 0 12px 12px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#64748b',
  fontSize: '12px',
  lineHeight: '1.5',
  margin: '0 0 8px 0',
};

const link = {
  color: '#667eea',
  textDecoration: 'underline',
};

const divider = {
  border: 'none',
  borderTop: '1px solid #e2e8f0',
  margin: '0',
};

export default CredentialsEmail;
