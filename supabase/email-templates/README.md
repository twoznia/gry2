# Szablony e-mail (Supabase Auth)

Gotowe szablony w stylu Gry2 (ciemny motyw). Wklej HTML w panelu Supabase:
**Authentication → Emails → Templates**, wybierz odpowiedni typ, ustaw temat i wklej treść.

| Plik | Typ w Supabase | Proponowany temat |
|------|----------------|-------------------|
| `confirm-signup.html` | Confirm signup | `Potwierdź konto w Gry2 🎮` |
| `reset-password.html` | Reset Password | `Reset hasła w Gry2 🔑` |

## Zmienne
- `{{ .ConfirmationURL }}` — gotowy link (potwierdzenie / reset). Użyty w obu szablonach.
- Inne dostępne: `{{ .Token }}`, `{{ .TokenHash }}`, `{{ .SiteURL }}`, `{{ .RedirectTo }}`, `{{ .Email }}`.

## Uwagi
- Zmiana **treści i tematu** działa od razu, bez własnego SMTP.
- Zmiana **adresu nadawcy** (from) wymaga podpięcia własnego SMTP (Authentication → Emails → SMTP Settings).
- Aby link resetu działał na Pages, dodaj `https://twoznia.github.io/gry2/` do Redirect URLs
  (Authentication → URL Configuration).
- Podgląd: otwórz pliki `.html` w przeglądarce (linki będą puste do czasu wysyłki przez Supabase).
