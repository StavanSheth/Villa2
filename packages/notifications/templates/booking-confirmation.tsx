import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface BookingConfirmationEmailProps {
  customerName: string;
  bookingCode: string;
  villaName: string;
  checkInDate: string;
  checkOutDate: string;
  totalGuests: number;
  totalAmount: number;
  paidAmount: number;
  dashboardUrl: string;
}

export const BookingConfirmationEmail = ({
  customerName,
  bookingCode,
  villaName,
  checkInDate,
  checkOutDate,
  totalGuests,
  totalAmount,
  paidAmount,
  dashboardUrl,
}: BookingConfirmationEmailProps) => {
  const balanceDue = totalAmount - paidAmount;

  return (
    <Html>
      <Head />
      <Preview>Your booking at {villaName} is confirmed!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Booking Confirmed</Heading>
          <Text style={text}>Dear {customerName},</Text>
          <Text style={text}>
            Thank you for choosing Mavon. Your stay at <strong>{villaName}</strong> is confirmed.
            Below are your booking details.
          </Text>

          <Section style={detailsContainer}>
            <Text style={detailsText}><strong>Booking Code:</strong> {bookingCode}</Text>
            <Text style={detailsText}><strong>Check-in:</strong> {checkInDate}</Text>
            <Text style={detailsText}><strong>Check-out:</strong> {checkOutDate}</Text>
            <Text style={detailsText}><strong>Guests:</strong> {totalGuests}</Text>
          </Section>

          <Hr style={hr} />

          <Heading style={h2}>Payment Summary</Heading>
          <Section style={detailsContainer}>
            <Text style={detailsText}><strong>Total Amount:</strong> ₹{totalAmount.toLocaleString('en-IN')}</Text>
            <Text style={detailsText}><strong>Amount Paid:</strong> ₹{paidAmount.toLocaleString('en-IN')}</Text>
            {balanceDue > 0 && (
              <Text style={{ ...detailsText, color: "#eab308", fontWeight: "bold" }}>
                <strong>Balance Due:</strong> ₹{balanceDue.toLocaleString('en-IN')}
              </Text>
            )}
          </Section>

          <Section style={btnContainer}>
            <Link href={dashboardUrl} style={button}>
              View Booking Details
            </Link>
          </Section>

          <Text style={footer}>
            If you have any questions, reply to this email or contact our support team.
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
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
};

const h1 = {
  color: "#D4AF37",
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "30px 0",
};

const h2 = {
  color: "#333",
  fontSize: "20px",
  fontWeight: "bold",
  margin: "20px 0 10px",
};

const text = {
  color: "#525f7f",
  fontSize: "16px",
  lineHeight: "24px",
  textAlign: "left" as const,
};

const detailsContainer = {
  backgroundColor: "#f8fafc",
  padding: "16px",
  borderRadius: "6px",
  margin: "16px 0",
};

const detailsText = {
  color: "#334155",
  fontSize: "15px",
  margin: "8px 0",
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
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 24px",
  fontWeight: "bold",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  textAlign: "center" as const,
  marginTop: "32px",
};
