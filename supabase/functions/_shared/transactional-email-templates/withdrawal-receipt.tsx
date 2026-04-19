/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'LootBoxx'

interface WithdrawalReceiptProps {
  recipientName?: string
  amount?: number
  feeAmount?: number
  netAmount?: number
  bankName?: string
  accountNumber?: string
  accountName?: string
  reference?: string
  processedAt?: string
}

const formatNaira = (n: number) =>
  '₦' + n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const WithdrawalReceiptEmail = ({
  recipientName = 'Player',
  amount = 0,
  feeAmount = 0,
  netAmount = 0,
  bankName = '—',
  accountNumber = '—',
  accountName = '—',
  reference = '—',
  processedAt = new Date().toISOString(),
}: WithdrawalReceiptProps) => {
  const dateStr = new Date(processedAt).toLocaleString('en-NG', {
    timeZone: 'Africa/Lagos',
    dateStyle: 'full',
    timeStyle: 'short',
  })

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        Your {SITE_NAME} withdrawal of {formatNaira(amount)} has been approved
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar}>
            <Heading style={brand}>{SITE_NAME}</Heading>
          </Section>

          <Section style={card}>
            <Heading style={h1}>✅ Withdrawal Approved</Heading>
            <Text style={lead}>
              Hi {recipientName}, great news — your withdrawal request has been
              approved and processed. The funds are on their way to your bank account.
            </Text>

            <Section style={amountBox}>
              <Text style={amountLabel}>Net amount paid out</Text>
              <Text style={amountValue}>{formatNaira(netAmount)}</Text>
              <Text style={amountSub}>
                Gross {formatNaira(amount)} − {formatNaira(feeAmount)} fee
              </Text>
            </Section>

            <Hr style={hr} />

            <Heading as="h2" style={h2}>Receipt details</Heading>

            <Row label="Reference" value={reference} />
            <Row label="Account name" value={accountName} />
            <Row label="Bank" value={bankName} />
            <Row label="Account number" value={accountNumber} />
            <Row label="Gross amount" value={formatNaira(amount)} />
            <Row label="Processing fee (5%)" value={formatNaira(feeAmount)} />
            <Row label="Net paid out" value={formatNaira(netAmount)} highlight />
            <Row label="Processed at" value={dateStr} />
            <Row label="Status" value="Approved & Paid" highlight />

            <Hr style={hr} />

            <Text style={text}>
              Funds typically reflect in your bank within 5–30 minutes. If you
              don't see them within 24 hours, reply to this email or contact
              support and quote the reference above.
            </Text>

            <Text style={footer}>
              Thanks for playing on {SITE_NAME}. Good luck on your next spin! 🎰
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const Row = ({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) => (
  <Section style={rowSection}>
    <Text style={rowLabel}>{label}</Text>
    <Text style={highlight ? rowValueHighlight : rowValue}>{value}</Text>
  </Section>
)

export const template = {
  component: WithdrawalReceiptEmail,
  subject: (data: Record<string, any>) =>
    `Your ${SITE_NAME} withdrawal of ₦${Number(data?.amount ?? 0).toLocaleString('en-NG')} has been approved`,
  displayName: 'Withdrawal receipt',
  previewData: {
    recipientName: 'Philip Ifechukwude Ndinwa',
    amount: 50000,
    feeAmount: 2500,
    netAmount: 47500,
    bankName: 'Opay',
    accountNumber: '8124976407',
    accountName: 'Philip Ifechukwude Ndinwa',
    reference: 'LBX-WD-DEMO-0001',
    processedAt: new Date().toISOString(),
  },
} satisfies TemplateEntry

// Styles — white body required
const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif",
  margin: 0,
  padding: 0,
}
const container = { maxWidth: '560px', margin: '0 auto', padding: '24px 16px' }
const brandBar = { textAlign: 'center' as const, padding: '8px 0 16px' }
const brand = {
  fontSize: '24px',
  fontWeight: 800,
  letterSpacing: '0.5px',
  color: 'hsl(175, 85%, 28%)',
  margin: 0,
}
const card = {
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  padding: '28px 24px',
  backgroundColor: '#ffffff',
}
const h1 = {
  fontSize: '22px',
  fontWeight: 700,
  color: '#0f172a',
  margin: '0 0 12px',
}
const h2 = {
  fontSize: '15px',
  fontWeight: 700,
  color: '#0f172a',
  margin: '20px 0 10px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
}
const lead = { fontSize: '14px', lineHeight: '22px', color: '#334155', margin: '0 0 18px' }
const amountBox = {
  backgroundColor: 'hsl(175, 85%, 96%)',
  border: '1px solid hsl(175, 85%, 80%)',
  borderRadius: '12px',
  padding: '18px 16px',
  textAlign: 'center' as const,
  margin: '6px 0 8px',
}
const amountLabel = {
  fontSize: '12px',
  color: 'hsl(175, 30%, 30%)',
  margin: 0,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
}
const amountValue = {
  fontSize: '32px',
  fontWeight: 800,
  color: 'hsl(175, 85%, 22%)',
  margin: '6px 0 4px',
}
const amountSub = { fontSize: '12px', color: '#475569', margin: 0 }
const hr = { borderColor: '#e5e7eb', margin: '20px 0' }
const rowSection = {
  display: 'block',
  borderBottom: '1px solid #f1f5f9',
  padding: '8px 0',
}
const rowLabel = { fontSize: '12px', color: '#64748b', margin: '0 0 2px' }
const rowValue = { fontSize: '14px', color: '#0f172a', margin: 0, fontWeight: 500 }
const rowValueHighlight = {
  fontSize: '14px',
  color: 'hsl(175, 85%, 22%)',
  margin: 0,
  fontWeight: 700,
}
const text = { fontSize: '13px', lineHeight: '20px', color: '#475569', margin: '14px 0' }
const footer = {
  fontSize: '12px',
  color: '#64748b',
  margin: '20px 0 0',
  textAlign: 'center' as const,
}
