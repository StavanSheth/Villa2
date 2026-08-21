import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface ReviewApprovedEmailProps {
  customerName: string;
  villaName: string;
  reviewLink: string;
}

export const ReviewApprovedEmail = ({
  customerName,
  villaName,
  reviewLink,
}: ReviewApprovedEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your review for {villaName} is now live!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Review Published</Heading>
          <Text style={text}>Hi {customerName},</Text>
          <Text style={text}>
            Great news! Your review for <strong>{villaName}</strong> has been approved and is now live on our platform.
            Thank you for sharing your experience with the Mavon community.
          </Text>

          <Section style={btnContainer}>
            <Link href={reviewLink} style={button}>
              View Your Review
            </Link>
          </Section>

          <Text style={footer}>
            The Mavon Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  borderRadius: "8px",
  marginTop: "40px",
  marginBottom: "40px",
};

const h1 = {
  color: "#D4AF37",
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "30px 0",
};

const text = {
  color: "#525f7f",
  fontSize: "16px",
  lineHeight: "24px",
};

const btnContainer = {
  textAlign: "center" as const,
  marginTop: "32px",
  marginBottom: "32px",
};

const button = {
  backgroundColor: "#D4AF37",
  borderRadius: "4px",
  color: "#fff",
  fontSize: "16px",
  textDecoration: "none",
  display: "inline-block",
  padding: "14px 24px",
  fontWeight: "bold",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  textAlign: "center" as const,
  marginTop: "32px",
};
