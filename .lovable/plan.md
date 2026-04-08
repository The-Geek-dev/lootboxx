## LootBox Platform Pivot Plan

### Phase 1: Rebrand & Core Pages
1. **Rebrand everything** — Replace all SQUANCH/crypto references with LootBox gaming branding
2. **Update homepage** — New hero section focused on games, bonuses, and winning prizes
3. **Update Navigation & Footer** — New menu items (Games, Deposit, Referrals, etc.)
4. **Update beta popup** — Reflect LootBox branding

### Phase 2: Core Features (UI + Backend)
5. **Deposit System** — Page where users can deposit money (7k) / buy coupons (requires payment integration)
6. **Referral System** — Generate referral codes, track referrals, award bonuses (new DB tables)
7. **User Wallet/Balance** — Track user balance from deposits, winnings, and referral bonuses

### Phase 3: Games
8. **Raffle/Lottery Game** — Buy tickets, random draw, winner announcement
9. **Spin-the-Wheel** — Animated wheel with prize segments
10. **Trivia/Quiz Game** — Answer questions to win bonuses

### Phase 4: Dashboard
11. **Update Dashboard** — Show balance, game history, referral stats instead of trading stats

### Payment Integration
- Will need Stripe for deposits (functional payments as requested)

### Database Tables Needed
- `user_wallets` (balance tracking)
- `deposits` (deposit history)
- `referrals` (referral codes & tracking)
- `raffle_entries` / `raffle_draws`
- `game_results` (spin/trivia history)

Shall I proceed with this plan? We'll tackle it phase by phase.