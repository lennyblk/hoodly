import { Html, Text, Heading, Section, Container } from '@react-email/components';

interface NeighbourhoodRequestEmailProps {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
}

export function NeighbourhoodRequestEmail({ firstName, lastName, email, address }: NeighbourhoodRequestEmailProps) {
  return (
    <Html lang="fr">
      <Container>
        <Section>
          <Heading>Nouvelle demande de quartier</Heading>
          <Text>Un utilisateur s'est inscrit avec une adresse qui ne correspond a aucun quartier existant.</Text>
          <Text><strong>Nom :</strong> {firstName} {lastName}</Text>
          <Text><strong>Email :</strong> {email}</Text>
          <Text><strong>Adresse :</strong> {address}</Text>
          <Text>Connectez-vous au back-office pour verifier si un quartier doit etre cree ou etendu pour couvrir cette adresse.</Text>
        </Section>
      </Container>
    </Html>
  );
}
