import { Html, Text, Heading, Section, Container } from '@react-email/components';

interface OtpEmailProps {
  code: string;
  firstName: string;
}

export function OtpEmail({ code, firstName }: OtpEmailProps) {
  return (
    <Html lang="fr">
      <Container>
        <Section>
          <Heading>Code de vérification Hoodly</Heading>
          <Text>Bonjour {firstName},</Text>
          <Text>Votre code de vérification est :</Text>
          <Heading>{code}</Heading>
          <Text>Ce code est valable 5 minutes.</Text>
          <Text>Si vous n'avez pas demandé ce code, ignorez cet email.</Text>
        </Section>
      </Container>
    </Html>
  );
}
