# Торговые идеи

Современный Next.js dashboard для платформы торговых сигналов в Apple glass / dark fintech стиле.

## Запуск

```powershell
npm install
npm run prisma:generate
npm run dev
```

После запуска откройте:

```text
http://localhost:3000
```

## Структура

- `app/page.tsx` - главная страница.
- `components/` - UI-компоненты dashboard.
- `data/mockSignals.ts` - mock data торговых идей.
- `types/signal.ts` - TypeScript-типы сигналов.

## Переменные окружения

```text
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
AUTH_SECRET="replace-with-long-random-secret"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="strong-password"
ADMIN_NAME="Администратор"
```

Первого администратора можно создать командой:

```powershell
npm run prisma:seed
```
