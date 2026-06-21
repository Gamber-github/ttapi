# Instrukcja uruchomienia testów

## Wymagania

- Node.js 18+
- Docker Engine 24+ z Docker Compose v2
- Uruchomione środowisko aplikacji (patrz niżej)

---

## 1. Uruchomienie środowiska

Testy działają względem lokalnego środowiska Docker Compose. Przed uruchomieniem testów upewnij się że wszystkie kontenery są aktywne:

```bash
cd docker
docker compose -f docker-compose.yaml build
docker compose up -d
```

Pełne uruchomienie trwa ok. 60–90 sekund. Gotowość środowiska można sprawdzić przez:

```bash
docker compose ps
```

Wszystkie serwisy powinny mieć status `healthy`.

| Serwis    | Adres                         |
|-----------|-------------------------------|
| Frontend  | http://localhost:3000         |
| API       | http://localhost:8080         |
| Keycloak  | http://localhost:8180         |

---

## 2. Instalacja zależności

```bash
npm install
npx playwright install chromium
```

---

## 3. Uruchomienie testów

### Wszystkie testy

```bash
npm test
```

### Tylko testy API

```bash
npm run test:api
```

Uruchamia testy z katalogu `e2e/tests/api/`:
- `auth.spec.ts` — autoryzacja (brak tokenu, niepoprawny token)
- `tenant-isolation.spec.ts` — izolacja danych między tenantami
- `ticket-workflow.spec.ts` — tworzenie, walidacja, idempotencja, przejścia statusów

### Tylko testy UI

```bash
npm run test:ui
```

Uruchamia testy z katalogu `e2e/tests/ui/` w przeglądarce Chrome.

### Konkretny plik

```bash
npx playwright test e2e/tests/api/ticket-workflow.spec.ts --project=api
```

### Konkretny test po nazwie

```bash
npx playwright test --project=api -g "STATUS_TRANSITION_ERROR"
```

### Raport HTML po wykonaniu testów

```bash
npm run report
```

---

## 4. Mechanizm uwierzytelniania

Przed każdą sesją testową Playwright wykonuje `global-setup`, który:

1. Loguje użytkowników `alpha`, `beta`, `gamma` przez interfejs Keycloak
2. Pobiera tokeny JWT dla każdego tenanta
3. Zapisuje stan sesji do pliku `.auth/{tenant}.json`

Pliki `.auth/` są generowane automatycznie — nie wymagają ręcznej konfiguracji.

---

## 5. Zmienne środowiskowe

Domyślne wartości wskazują na lokalne środowisko Docker. Można je nadpisać przed uruchomieniem:

| Zmienna         | Domyślna wartość            | Opis                  |
|-----------------|-----------------------------|-----------------------|
| `BASE_URL_API`  | `http://localhost:8080`     | Adres REST API        |
| `BASE_URL_UI`   | `http://localhost:3000`     | Adres frontendu       |
| `KC_URL`        | `http://localhost:8180`     | Adres Keycloak        |
| `KC_REALM`      | `ttapi`                     | Nazwa realm Keycloak  |
| `KC_CLIENT_ID`  | `ttapi-client`              | Client ID Keycloak    |

Przykład nadpisania:

```bash
BASE_URL_API=http://localhost:9090 npm run test:api
```

---

## 6. Dane testowe

Testy API i UI tworzą własne dane testowe w trakcie wykonania — nie wymagają predefiniowanych rekordów. Każde wywołanie `createTicket` generuje unikalny `externalId` oparty o timestamp.

Predefiniowane zgłoszenia w bazie danych (ok. 30 rekordów po ~10 na tenanta) są używane wyłącznie w testach UI które szukają ticketów w konkretnym statusie (np. `resolved`), niedostępnym przez publiczne API.

---

## 7. Zatrzymanie środowiska

```bash
cd docker
docker compose down
```

Aby usunąć również dane bazy:

```bash
docker compose down -v
```
