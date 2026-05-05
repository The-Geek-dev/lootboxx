import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'LootBoxx'
const APP_URL = 'https://lootboxx.live'

interface NudgeProps {
  title?: string
  message?: string
  ctaLabel?: string
  ctaUrl?: string
}

const DailyNudgeEmail = ({
  title = 'Your daily LootBoxx nudge',
  message = 'Open the app, play a round, keep your streak alive.',
  ctaLabel = 'Open LootBoxx',
  ctaUrl = APP_URL,
}: NudgeProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{title}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={brand}>{SITE_NAME}</Heading>
        <Section style={card}>
          <Heading as="h2" style={h2}>{title}</Heading>
          <Text style={text}>{message}</Text>
          <Section style={{ textAlign: 'center' as const }}>
            <Button href={ctaUrl} style={button}>{ctaLabel}</Button>
          </Section>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: DailyNudgeEmail,
  subject: (data: Record<string, any>) => data?.title || 'Your daily LootBoxx nudge',
  displayName: 'Daily engagement nudge',
  previewData: {
    title: '☀️ Good morning — your spins await',
    message: 'Start your day with a spin or two. Quick wins, real cash.',
    ctaLabel: 'Play Now',
    ctaUrl: `${APP_URL}/games`,
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: '#0f172a' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '32px 24px' }
const brand = { margin: '0 0 24px', fontSize: '22px', textAlign: 'center' as const, color: '#0f172a' }
const card = { background: '#f8fafc', borderRadius: '12px', padding: '28px' }
const h2 = { margin: '0 0 12px', fontSize: '20px', color: '#0f172a' }
const text = { margin: '0 0 24px', fontSize: '15px', lineHeight: '1.6', color: '#334155' }
const button = { background: '#5EE7DF', color: '#0f172a', padding: '12px 28px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, display: 'inline-block' }
