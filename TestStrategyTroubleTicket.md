# STRATEGIA TESTÓW SYSTEMU ENTERPRISE TROUBLE TICKET

## Wprowadzenie i kontekst biznesowy

Niniejszy dokument definiuje kompleksową strategię zapewnienia jakości (QA) dla systemu Trouble Ticket API.

Celem dokumentu jest ujednolicenie podejścia testowego, zoptymalizowanie zasobów oraz minimalizacja ryzyka regresji i awarii na środowisku produkcyjnym.

Aplikacja jest systemem klasy enterprise do zarządzania zgłoszeniami serwisowymi, opartym na architekturze rozproszonej: backendzie w technologii Spring Boot, frontendzie w React oraz silniku autoryzacji Keycloak.

Kluczowym wyznacznikiem sukcesu biznesowego systemu jest bezwzględne zachowanie izolacji danych (multi-tenancy), niezawodność procesowania zgłoszeń zgodnie z regułami stanów oraz wysoka wydajność API pod obciążeniem.

Strategia ta stanowi punkt odniesienia dla całego zespołu projektowego (Dev, QA, DevOps, Product Owner) w cyklu życia aplikacji.

## 1. Identyfikacja obszarów do testowania

W celu zapewnienia pełnego pokrycia testowego, system został podzielony na logiczne komponenty oraz warstwy integracji podlegające weryfikacji:

### Moduł zarządzania zgłoszeniami (Core Engine)

Obszar odpowiedzialny za pełen cykl życia ticketu. Weryfikacji podlega mechanizm tworzenia zgłoszeń, walidacja poprawności danych wejściowych (np. identyfikatora usługi `serviceId` w zakresie 100001 – 100030), a także maszyna stanów sterująca przejściami pomiędzy statusami (`new`, `acknowledged`, `inProgress`, `resolved`, `closed`, `rejected`).
Specjalna uwaga zostanie poświęcona logice automatycznego przejścia stanu oraz regułom blokowania niedozwolonych transformacji.

### Moduł komunikacji i notatek

Komponent umożliwiający asynchroniczną i synchroniczną wymianę informacji wewnątrz zgłoszenia. Testowaniu podlega reguła biznesowa warunkująca możliwość dodania notatki wyłącznie w określonych statusach ticketu (`new`, `acknowledged`, `inProgress`) oraz walidacja odrzuceń dla statusów końcowych.

### Mechanizm multi-tenancy (Izolacja danych)

Krytyczna warstwa architektoniczna zapewniająca izolację danych pomiędzy niezależnymi operatorami (tenantami) na poziomie bazy danych PostgreSQL oraz filtrów API.
Testy obejmują weryfikację poprawnego odczytu claimu `tenant_id` z tokenu JWT oraz upewnienie się, że próba nieuprawnionego dostępu do danych innego tenanta skutkuje ukryciem zasobu.

### Moduł autentykacji i autoryzacji

Integracja backendu z serwerem Keycloak (protokoły OAuth2/OIDC). Zakres obejmuje testy walidacji tokenów Bearer, obsługę ról użytkowników, zarządzanie sesjami, odświeżanie tokenów oraz zachowanie aplikacji przy braku, wygaśnięciu lub uszkodzeniu tokenu bezpieczeństwa.

### Interfejs użytkownika (Frontend SPA)

Warstwa prezentacji zbudowana w oparciu o komponenty Material UI. Testy obejmują poprawność renderowania danych na liście zgłoszeń, ergonomię formularza tworzenia ticketów, dynamiczne blokowanie przycisków akcji (np. zamknięcie ticketu, dodanie notatki) w zależności od statusu zgłoszenia, a także mechanizmy obsługi błędów sieciowych i prezentacji komunikatów użytkownikowi.

## 2. Priorytetyzacja obszarów testowych

Zastosowanie podejścia opartego na ryzyku (Risk-Based Testing) pozwala zoptymalizować wysiłek QA i skierować zasoby na komponenty o najwyższym znaczeniu biznesowym.

| Obszar testowy                               | Poziom krytyczności | Uzasadnienie biznesowe                                                                                                                                  |
| :------------------------------------------- | :------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Mechanizm Multi-tenancy                      | KRYTYCZNY           | Wyciek danych pomiędzy tenantami (operatorami) niesie za sobą krytyczne ryzyko prawne (RODO/GDPR), finansowe oraz utratę reputacji firmy.               |
| Workflow Statusów i Zarządzanie Zgłoszeniami | KRYTYCZNY           | Rdzeń działania aplikacji. Błędy w maszynie stanów mogą zablokować pracę setek agentów helpdesk i uniemożliwić realizację kontraktów SLA.               |
| Autentykacja i Autoryzacja (Keycloak)        | KRYTYCZNY           | Niepoprawna weryfikacja uprawnień grozi całkowitym przełamaniem zabezpieczeń systemu przez nieautoryzowane podmioty zewnętrzne.                         |
| Idempotencja Tworzenia Zgłoszeń              | WYSOKI              | Zapobiega duplikacji ticketów przy problemach z siecią na styku API. Właściwa obsługa pary (`tenantId`, `externalId`) stabilizuje integracje systemowe. |
| System Notatek i Komunikacji                 | WYSOKI              | Kluczowy element wymiany informacji serwisowych. Brak możliwości dodania notatki w dozwolonym statusie bezpośrednio opóźnia naprawę awarii.             |
| Widoki listy i szczegółów w UI               | ŚREDNI              | Wpływa na codzienną wygodę pracy operatorów, lecz błędy prezentacji danych nie niszczą spójności bazy danych.                                           |
| Filtrowanie i Sortowanie w UI                | NISKI               | Funkcjonalność ułatwiająca pracę (nice-to-have). Błędy w tym obszarze posiadają proste obejścia (workarounds) i nie blokują procesów biznesowych.       |

## 3. Podejście do testowania (Typy testów)

W celu zapewnienia najwyższej jakości oprogramowania w modelu Agile/DevOps, wdrażamy piramidę testów połączoną z testami niefunkcjonalnymi.

### Testy funkcjonalne

- **Testy manualne (E2E):** Wykonywane eksploracyjnie dla nowych funkcjonalności UI, ze szczególnym uwzględnieniem edge cases i perspektywy UX różnych ról użytkowników.
- **Testy automatyczne API:** Stanowią fundament regresji. Obejmują pełną weryfikację kontraktu OpenAPI 3.1, walidację schem JSON oraz weryfikację kodów odpowiedzi HTTP (`200`, `201`, `400`, `401`, `403`, `404`).
- **Testy automatyczne UI:** Budowane z użyciem nowoczesnych frameworków (np. Playwright) dla kluczowych ścieżek użytkownika ("happy path" tworzenia i zamykania ticketu).

### Testy integracyjne

- **Zakres:** Weryfikacja interakcji pomiędzy modułem Spring Boot, bazą danych PostgreSQL oraz serwerem Keycloak.
- Szczególny nacisk kładziemy na testy integracyjne API na poziomie izolowanych kontenerów (np. przy użyciu Testcontainers) w celu symulacji rzeczywistego środowiska bazodanowego i tożsamościowego.

### Testy regresyjne

- **Zakres:** Uruchamiane automatycznie w pipeline CI/CD po każdym commicie i Pull Requeście.
- Zestaw testów regresyjnych API musi pokrywać 100% wykrytych wcześniej krytycznych defektów, zapobiegając ich ponownemu wystąpieniu.

### Testy wydajnościowe

- **Zakres:** Testy obciążeniowe (Load Tests) oraz testy przeciążeniowe (Stress Tests) dla endpointów `GET` oraz `POST` `/api/v1/troubleTicket`.
- Cel to weryfikacja zachowania bazy PostgreSQL przy symulacji dużej liczby współbieżnych zapytań (szczególnie w scenariuszach masowego generowania ticketów przez systemy monitoringu).

### Testy bezpieczeństwa

- **Zakres:** Walidacja podatności mechanizmu uwierzytelniania. Testy typu fuzzing dla pól tekstowych (notatki, opisy) pod kątem podatności na XSS (Cross-Site Scripting) oraz SQL Injection.
- Rygorystyczna weryfikacja odporności na IDOR (Insecure Direct Object Reference) w kontekście izolacji najemców.

### Testy użyteczności (UX)

- **Zakres:** Weryfikacja responsywności interfejsu Material UI na różnych rozdzielczościach ekranu, czytelności flag statusów oraz intuicyjności nawigacji formularza zgłoszeniowego dla agentów pierwszej linii wsparcia.

### Testy akceptacyjne (UAT)

- **Zakres:** Prowadzone na środowisku stage z udziałem Product Ownera i kluczowych interesariuszy biznesowych przed wdrożeniem na produkcję.
- Warunkiem zaliczenia UAT jest realizacja kryteriów akceptacji zdefiniowanych w wymaganiach biznesowych (User Stories).

## 4. Analiza ryzyk i wyzwań

Poniższa macierz przedstawia kluczowe ryzyka jakościowe zidentyfikowane dla systemu Trouble Ticket wraz ze strategią ich łagodzenia.

| Id  | Ryzyko                                                                            | Prawd.  | Wpływ     | Strategia mitygacji (Plan działania)                                                                                                                                                                 |
| :-- | :-------------------------------------------------------------------------------- | :------ | :-------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Wyciek danych między tenantami (Dostęp użytkownika Alpha do danych tenanta Beta). | Średnie | Krytyczny | Implementacja zautomatyzowanych testów matrycy uprawnień na poziomie API. Każdy test weryfikujący dostęp sprawdza asercję zwrotu kodu `HTTP 404` w przypadku próby odpytania o zasób obcego tenanta. |
| R2  | Regresja w maszynie stanów (Błędne przejścia blokujące proces obsługi).           | Wysokie | Wysoki    | Pokrycie testami jednostkowymi i integracyjnymi wszystkich permutacji tabeli przejść statusów. Testy automatyczne negatywnych ścieżek dla kodu `STATUS_TRANSITION_ERROR`.                            |
| R3  | Degradacja wydajności bazy danych przy rosnącym wolumenie zgłoszeń.               | Średnie | Wysoki    | Wdrożenie automatycznych testów wydajnościowych w cyklu nocnym przy bazie danych wypełnionej syntetycznymi danymi (skala produkcyjna: miliony rekordów). Monitorowanie długich zapytań SQL.          |
| R4  | Niedostępność powiązanego Keycloaka podczas testów automatycznych na CI.          | Wysokie | Średni    | Wykorzystanie z góry skonfigurowanego, lekkiego obrazu Docker Keycloak z zaimportowanym realm-ttapi w procesie CI/CD, uniezależniając testy od zewnętrznych serwerów tożsamości.                     |
| R5  | Duplikacja ticketów wynikająca z ponowień zapytań HTTP sieciowych.                | Średnie | Wysoki    | Opracowanie dedykowanego zestawu testów współbieżności dla weryfikacji unikalności klucza biznesowego (`tenantId`, `externalId`) i potwierdzenie poprawnej obsługi kodu `HTTP 200`.                  |

## 5. Propozycja scenariuszy testowych (High-Level)

Poniższe scenariusze stanowią bazę do implementacji testów automatycznych i manualnych. Zostały sformułowane w sposób jednoznaczny i niezależny kontekstowo.

### Grupa 1: Zarządzanie zgłoszeniami (Workflow i Walidacja)

- **TS-01:** Weryfikacja utworzenia nowego zgłoszenia przez klienta API przy poprawnych danych wejściowych z przypisaniem domyślnego statusu `new` oraz automatycznym przejściem w status `acknowledged`.
- **TS-02:** Walidacja blokady utworzenia zgłoszenia w przypadku przesłania nieprawidłowego identyfikatora usługi (wartość `serviceId` poza zakresem 100001 – 100030) z oczekiwanym kodem błędu `SERVICE_NOT_FOUND`.
- **TS-03:** Weryfikacja mechanizmu idempotentności podczas próby ponownego wysłania zgłoszenia z identyczną parą (`tenantId`, `externalId`), kończąca się zwróceniem kodu `HTTP 200` oraz instancji istniejącego zasobu.
- **TS-04:** Walidacja odrzucenia próby utworzenia nowego zgłoszenia z niedozwolonym statusem początkowym (innym niż `new`) i sprawdzenie obsługi kodu błędu `VALIDATION_ERROR`.
- **TS-05:** Weryfikacja poprawnego przejścia statusu zgłoszenia ze stanu `acknowledged` do stanu `inProgress` za pomocą metody `PATCH`.
- **TS-06:** Walidacja negatywnej ścieżki zmiany statusu – próba przejścia bezpośrednio ze statusu `new` do statusu `resolved` i weryfikacja obsługi kodu błędu `STATUS_TRANSITION_ERROR`.
- **TS-07:** Weryfikacja możliwości zamknięcia zgłoszenia przez klienta API ze statusu `inProgress` do statusu docelowego `closed`.
- **TS-08:** Walidacja blokady zamknięcia zgłoszenia bezpośrednio ze statusów końcowych/systemowych (`resolved`, `rejected`) i weryfikacja obsługi kodu błędu `STATUS_TRANSITION_ERROR`.

### Grupa 2: System notatek

- **TS-09:** Weryfikacja dodania nowej notatki tekstowej przez użytkownika API do aktywnego zgłoszenia w statusie `inProgress`.
- **TS-10:** Walidacja blokady dodawania notatek dla zgłoszenia posiadającego status `closed` z oczekiwaną weryfikacją kodu błędu `NOTE_ADDITION_NOT_ALLOWED`.
- **TS-11:** Walidacja blokady dodawania notatek dla zgłoszenia posiadającego status `rejected` lub `resolved` z oczekiwaną weryfikacją kodu błędu `NOTE_ADDITION_NOT_ALLOWED`.

### Grupa 3: Multi-tenancy i bezpieczeństwo

- **TS-12:** Weryfikacja całkowitej izolacji danych najemców – próba pobrania szczegółów zgłoszenia należącego do tenanta `beta` przez zalogowanego użytkownika tenanta `alpha` musi zakończyć się zwróceniem kodu odpowiedzi `HTTP 404` (`TROUBLE_TICKET_NOT_FOUND`).
- **TS-13:** Weryfikacja zachowania systemu przy wywołaniu endpointu `/api/v1/troubleTicket` bez przekazanego nagłówka Authorization lub z niepoprawnym tokenem JWT (oczekiwany kod odpowiedzi `HTTP 401 Unauthorized`).
- **TS-14:** Weryfikacja pobierania listy zgłoszeń – zalogowany użytkownik tenanta `gamma` otrzymuje na liście wyłącznie zgłoszenia przypisane do jego identyfikatora `tenant_id`.

### Grupa 4: Interfejs użytkownika (UI)

- **TS-15:** Weryfikacja poprawnego renderowania tabeli zgłoszeń na frontendzie, uwzględniająca właściwe mapowanie i kolorystykę etykiet statusów dla zalogowanego operatora.
- **TS-16:** Weryfikacja działania formularza dodawania notatki w widoku szczegółów – przycisk zapisu notatki jest niewidoczny bądź zablokowany, gdy wyświetlane zgłoszenie znajduje się w stanie `closed`.
- **TS-17:** Weryfikacja reakcji interfejsu na błędy walidacji – wprowadzenie błędnych danych w formularzu tworzenia ticketu blokuje wysyłkę i podświetla pole `serviceId` odpowiednim komunikatem błędu.

### Grupa 5: Scenariusze integracyjne i brzegowe

- **TS-18:** Weryfikacja odporności bazy danych na znaki specjalne poprzez przesłanie w treści opisu oraz notatki zgłoszenia długiego ciągu znaków unicode oraz znaczników HTML (test podatności XSS/fuzzing).
- **TS-19:** Weryfikacja spójności danych historycznych – sprawdzenie czy po sekwencji operacji (utworzenie -> dodanie notatki -> zmiana statusu) widok szczegółów zgłoszenia poprawnie agreguje chronologiczną listę zdarzeń i notatek.
- **TS-20:** Weryfikacja stabilności systemu przy jednoczesnym wywołaniu zapytania o listę zgłoszeń i dodawania notatki w warunkach symulowanego opóźnienia sieciowego na poziomie bazy danych PostgreSQL.

## Notatka Architekta QA

Przedstawione scenariusze high-level stanowią wejściową bazę asercji dla budowanych skryptów testowych.

Każdy przypadek testujący negatywne ścieżki i reguły biznesowe musi jawnie odwoływać się do kodów błędów zdefiniowanych w specyfikacji technicznej API.

Wszystkie testy automatyczne powinny być uruchamiane w środowiskach tymczasowych podnoszonych z Docker Compose, co gwarantuje pełną powtarzalność wyników.
