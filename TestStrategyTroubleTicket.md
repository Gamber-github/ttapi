# STRATEGIA TESTÓW SYSTEMU ENTERPRISE TROUBLE TICKET

## Kontekst

Trouble Ticket API to system klasy enterprise do zarządzania zgłoszeniami serwisowymi: backend Spring Boot, frontend React, autoryzacja przez Keycloak. Kluczowe wymagania to ścisła izolacja danych między tenantami (multi-tenancy), poprawność maszyny stanów oraz wydajność API pod obciążeniem.

Ten dokument jest punktem odniesienia dla Dev, QA, DevOps i Product Ownera.

## 1. Obszary do testowania

### Zarządzanie zgłoszeniami (Core Engine)

Pełny cykl życia ticketu: tworzenie, walidacja `serviceId` (zakres 100001–100030), maszyna stanów (`new`, `acknowledged`, `inProgress`, `resolved`, `closed`, `rejected`). Szczególna uwaga na automatyczne przejścia stanów i blokowanie niedozwolonych transformacji.

### Notatki

Notatki można dodawać tylko w statusach `new`, `acknowledged`, `inProgress`. Testy obejmują pozytywne i negatywne ścieżki, w tym odrzucenie dla statusów końcowych.

### Multi-tenancy

Izolacja danych między tenantami na poziomie PostgreSQL i filtrów API. Weryfikacja odczytu `tenant_id` z tokenu JWT i zwrotu `404` przy próbie dostępu do zasobu innego tenanta.

### Autentykacja i autoryzacja

Integracja z Keycloak (OAuth2/OIDC): walidacja tokenów Bearer, role użytkowników, odświeżanie sesji, zachowanie przy braku/wygaśnięciu/uszkodzeniu tokenu.

### Frontend SPA

Renderowanie listy zgłoszeń, formularz tworzenia ticketów, dynamiczne blokowanie przycisków w zależności od statusu, obsługa błędów sieciowych i komunikatów dla użytkownika.

## 2. Priorytetyzacja obszarów testowych

Podejście Risk-Based Testing — zasoby QA kierowane na obszary o najwyższym ryzyku biznesowym.

| Obszar testowy                               | Krytyczność | Uzasadnienie                                                                                                                                  |
| :------------------------------------------- | :---------- | :-------------------------------------------------------------------------------------------------------------------------------------------- |
| Mechanizm Multi-tenancy                      | KRYTYCZNY   | Wyciek danych między tenantami to ryzyko prawne (RODO/GDPR), finansowe i reputacyjne.                                                        |
| Workflow Statusów i Zarządzanie Zgłoszeniami | KRYTYCZNY   | Rdzeń aplikacji. Błędy w maszynie stanów mogą zablokować pracę setek agentów helpdesk i naruszać SLA.                                        |
| Autentykacja i Autoryzacja (Keycloak)        | KRYTYCZNY   | Błędna weryfikacja uprawnień otwiera system na nieautoryzowany dostęp.                                                                        |
| Idempotencja Tworzenia Zgłoszeń             | WYSOKI      | Duplikacja ticketów przy problemach sieciowych destabilizuje integracje. Para (`tenantId`, `externalId`) musi być unikalna.                   |
| System Notatek i Komunikacji                 | WYSOKI      | Brak możliwości dodania notatki w dozwolonym statusie bezpośrednio opóźnia naprawę awarii.                                                   |
| Widoki listy i szczegółów w UI               | ŚREDNI      | Błędy prezentacji nie naruszają spójności bazy danych.                                                                                        |
| Filtrowanie i Sortowanie w UI                | NISKI       | Funkcjonalność pomocnicza z prostymi obejściami, nie blokuje procesów biznesowych.                                                            |

## 3. Typy testów

### Testy funkcjonalne

- **Manualne (E2E):** Eksploracyjne dla nowych funkcjonalności UI, edge cases i ścieżki UX różnych ról.
- **Automatyczne API:** Weryfikacja kontraktu OpenAPI 3.1, schematów JSON, kodów HTTP (`200`, `201`, `400`, `401`, `403`, `404`).
- **Automatyczne UI:** Playwright, kluczowe happy paths (tworzenie i zamknięcie ticketu).

### Testy integracyjne

Interakcje Spring Boot ↔ PostgreSQL ↔ Keycloak. Testy uruchamiane na izolowanych kontenerach (Testcontainers) — bez zależności od zewnętrznych środowisk.

### Testy regresyjne

CI/CD po każdym commicie i PR. Zestaw musi pokrywać 100% historycznie wykrytych krytycznych defektów.

### Testy wydajnościowe

Load i Stress tests dla `GET /api/v1/troubleTicket` i `POST /api/v1/troubleTicket`. Cel: zachowanie bazy przy symulacji masowego generowania ticketów przez systemy monitoringu.

### Testy bezpieczeństwa

Fuzzing pól tekstowych (notatki, opisy) pod kątem XSS i SQL Injection. Weryfikacja odporności na IDOR w kontekście izolacji tenantów.

### Testy użyteczności (UX)

Responsywność Material UI na różnych rozdzielczościach, czytelność flag statusów, nawigacja formularza zgłoszeniowego dla agentów pierwszej linii.

### Testy akceptacyjne (UAT)

Na środowisku stage, z udziałem Product Ownera i interesariuszy przed wdrożeniem na produkcję. Warunek zaliczenia: spełnienie kryteriów akceptacji z User Stories.

## 4. Ryzyka

| Id  | Ryzyko                                                                            | Prawdopodobieństwo | Wpływ     | Mitygacja                                                                                                                                                                                     |
| :-- | :-------------------------------------------------------------------------------- | :----------------- | :-------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Wyciek danych między tenantami (użytkownik Alpha odczytuje dane tenanta Beta).    | Średnie            | Krytyczny | Automatyczne testy matrycy uprawnień na poziomie API. Każdy test próby dostępu do zasobu obcego tenanta musi zwracać `HTTP 404`.                                                              |
| R2  | Regresja w maszynie stanów (błędne przejścia blokujące obsługę zgłoszeń).        | Wysokie            | Wysoki    | Testy jednostkowe i integracyjne dla wszystkich permutacji tabeli przejść. Automatyczne testy negatywnych ścieżek dla kodu `STATUS_TRANSITION_ERROR`.                                         |
| R3  | Degradacja wydajności bazy przy rosnącym wolumenie zgłoszeń.                     | Średnie            | Wysoki    | Nocne testy wydajnościowe na bazie z danymi syntetycznymi w skali produkcyjnej (miliony rekordów). Monitorowanie długich zapytań SQL.                                                         |
| R4  | Niedostępność Keycloaka w CI.                                                     | Wysokie            | Średni    | Lekki obraz Docker Keycloak z zaimportowanym realm `ttapi` wbudowany w pipeline CI/CD — niezależny od zewnętrznych serwerów tożsamości.                                                      |
| R5  | Duplikacja ticketów z ponowień HTTP.                                              | Średnie            | Wysoki    | Dedykowane testy współbieżności weryfikujące unikalność klucza (`tenantId`, `externalId`) i poprawną obsługę `HTTP 200` przy idempotentnym żądaniu.                                          |

## 5. Scenariusze testowe (High-Level)

### Grupa 1: Zarządzanie zgłoszeniami

- **TS-01:** Utworzenie zgłoszenia przy poprawnych danych — domyślny status `new` i automatyczne przejście do `acknowledged`.
- **TS-02:** Blokada tworzenia przy nieprawidłowym `serviceId` (poza zakresem 100001–100030) — oczekiwany błąd `SERVICE_NOT_FOUND`.
- **TS-03:** Idempotentność — ponowne żądanie z tą samą parą (`tenantId`, `externalId`) zwraca `HTTP 200` i istniejący zasób.
- **TS-04:** Blokada tworzenia z niedozwolonym statusem początkowym (innym niż `new`) — błąd `VALIDATION_ERROR`.
- **TS-05:** Przejście statusu `acknowledged` → `inProgress` przez `PATCH`.
- **TS-06:** Blokada przejścia `new` → `resolved` bezpośrednio — błąd `STATUS_TRANSITION_ERROR`.
- **TS-07:** Zamknięcie zgłoszenia z `inProgress` do `closed`.
- **TS-08:** Blokada zamknięcia ze statusów końcowych (`resolved`, `rejected`) — błąd `STATUS_TRANSITION_ERROR`.

### Grupa 2: System notatek

- **TS-09:** Dodanie notatki do aktywnego zgłoszenia w statusie `inProgress`.
- **TS-10:** Blokada dodania notatki do zgłoszenia w statusie `closed` — błąd `NOTE_ADDITION_NOT_ALLOWED`.
- **TS-11:** Blokada dodania notatki do zgłoszenia w statusie `rejected` lub `resolved` — błąd `NOTE_ADDITION_NOT_ALLOWED`.

### Grupa 3: Multi-tenancy i bezpieczeństwo

- **TS-12:** Próba pobrania zgłoszenia tenanta `beta` przez użytkownika tenanta `alpha` — zwraca `HTTP 404` (`TROUBLE_TICKET_NOT_FOUND`).
- **TS-13:** Wywołanie `/api/v1/troubleTicket` bez nagłówka `Authorization` lub z niepoprawnym JWT — `HTTP 401 Unauthorized`.
- **TS-14:** Lista zgłoszeń tenanta `gamma` zawiera wyłącznie zasoby z jego `tenant_id`.

### Grupa 4: Interfejs użytkownika

- **TS-15:** Renderowanie tabeli zgłoszeń — poprawne mapowanie i kolorystyka etykiet statusów.
- **TS-16:** Formularz notatki w widoku szczegółów — przycisk zapisu jest niewidoczny lub zablokowany dla zgłoszeń w statusie `closed`.
- **TS-17:** Walidacja formularza tworzenia ticketu — błędne dane blokują wysyłkę i podświetlają pole `serviceId` z odpowiednim komunikatem.

### Grupa 5: Scenariusze integracyjne i brzegowe

- **TS-18:** Znaki specjalne w opisie i notatce — długi ciąg unicode i znaczniki HTML (test XSS/fuzzing).
- **TS-19:** Spójność danych po sekwencji operacji (tworzenie → notatka → zmiana statusu) — widok szczegółów poprawnie agreguje chronologiczną listę zdarzeń.
- **TS-20:** Stabilność przy jednoczesnym odpytywaniu listy i dodawaniu notatki przy symulowanym opóźnieniu sieciowym na poziomie PostgreSQL.
