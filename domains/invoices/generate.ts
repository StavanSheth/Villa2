import React from 'react';
import { renderToStream } from '@react-pdf/renderer';
import { InvoiceTemplate, InvoiceTemplateProps } from './templates/invoice-template';
import QRCode from 'qrcode';

export async function generateInvoicePdfBuffer(props: Omit<InvoiceTemplateProps, 'qrCodeDataUrl'>): Promise<Buffer> {
  let qrCodeDataUrl: string | undefined;
  
  try {
    // Generate a QR code that could point to the booking verification or payment link
    const verificationUrl = `https://mavon.online/verify/${props.bookingCode}`;
    qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: 'M',
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
  } catch (error) {
    console.error('Failed to generate QR code:', error);
  }

  const templateProps: InvoiceTemplateProps = {
    ...props,
    qrCodeDataUrl
  };

  const stream = await renderToStream(React.createElement(InvoiceTemplate, templateProps) as any);
  
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}
