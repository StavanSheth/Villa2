import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Register font for consistent styling
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyCg4QxlF.ttf' },
    { src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyCg4TYlF.ttf', fontWeight: 'bold' }
  ]
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#333333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    marginBottom: 10,
  },
  companyDetails: {
    textAlign: 'right',
    color: '#666666',
  },
  title: {
    fontSize: 24,
    color: '#D4AF37', // Gold color
    fontWeight: 'bold',
    marginBottom: 5,
  },
  section: {
    marginBottom: 30,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  bold: {
    fontWeight: 'bold',
  },
  table: {
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginBottom: 30,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableHeader: {
    backgroundColor: '#F3F4F6',
    fontWeight: 'bold',
  },
  tableCol: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  tableColWide: {
    width: '50%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  tableCell: {
    margin: 8,
    fontSize: 9,
  },
  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  totalsBox: {
    width: 250,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  grandTotal: {
    fontWeight: 'bold',
    color: '#D4AF37',
    fontSize: 12,
    marginTop: 5,
    paddingTop: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
  },
  qrCode: {
    width: 80,
    height: 80,
    marginTop: 20,
  }
});

interface InvoiceItemProps {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface InvoiceTemplateProps {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  bookingCode: string;
  items: InvoiceItemProps[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  qrCodeDataUrl?: string;
}

export const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({
  invoiceNumber,
  date,
  dueDate,
  customerName,
  customerEmail,
  customerPhone,
  bookingCode,
  items,
  subtotal,
  taxAmount,
  totalAmount,
  paidAmount,
  qrCodeDataUrl
}) => {
  const balanceDue = Math.max(0, totalAmount - paidAmount);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>INVOICE</Text>
            <Text style={styles.bold}>{invoiceNumber}</Text>
            <Text>Date: {date}</Text>
            <Text>Due Date: {dueDate}</Text>
          </View>
          <View style={styles.companyDetails}>
            <Text style={[styles.bold, { color: '#333', fontSize: 12, marginBottom: 4 }]}>Mavon Hospitality Pvt. Ltd.</Text>
            <Text>123 Luxury Lane, Lonavala</Text>
            <Text>Maharashtra 410401, India</Text>
            <Text>GSTIN: 27AABCM1234D1Z5</Text>
            <Text>contact@mavon.online</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <View>
              <Text style={[styles.bold, { marginBottom: 5 }]}>Billed To:</Text>
              <Text>{customerName}</Text>
              <Text>{customerEmail}</Text>
              {customerPhone && <Text>{customerPhone}</Text>}
            </View>
            <View style={{ textAlign: 'right' }}>
              <Text style={[styles.bold, { marginBottom: 5 }]}>Booking Reference:</Text>
              <Text>{bookingCode}</Text>
            </View>
          </View>
        </View>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <View style={styles.tableColWide}><Text style={styles.tableCell}>Description</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>Qty</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>Rate</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>Amount</Text></View>
          </View>
          
          {items.map((item, i) => (
            <View style={styles.tableRow} key={i}>
              <View style={styles.tableColWide}><Text style={styles.tableCell}>{item.description}</Text></View>
              <View style={styles.tableCol}><Text style={styles.tableCell}>{item.quantity}</Text></View>
              <View style={styles.tableCol}><Text style={styles.tableCell}>₹{item.rate.toLocaleString('en-IN')}</Text></View>
              <View style={styles.tableCol}><Text style={styles.tableCell}>₹{item.amount.toLocaleString('en-IN')}</Text></View>
            </View>
          ))}
        </View>

        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text>Subtotal:</Text>
              <Text>₹{subtotal.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text>GST (18%):</Text>
              <Text>₹{taxAmount.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.bold}>Total Amount:</Text>
              <Text style={styles.bold}>₹{totalAmount.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text>Amount Paid:</Text>
              <Text>₹{paidAmount.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.grandTotal}>Balance Due:</Text>
              <Text style={styles.grandTotal}>₹{balanceDue.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </View>

        {qrCodeDataUrl && (
          <View>
            <Text style={[styles.bold, { marginTop: 20 }]}>Scan to Pay Balance / Verify</Text>
            <Image src={qrCodeDataUrl} style={styles.qrCode} />
          </View>
        )}

        <View style={styles.footer}>
          <Text>Thank you for choosing Mavon. We hope you enjoyed your luxury stay.</Text>
          <Text>This is a computer-generated invoice and does not require a physical signature.</Text>
        </View>
      </Page>
    </Document>
  );
};
